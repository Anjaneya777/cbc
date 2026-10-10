import os
import io
import csv
import uuid
import json
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .config import LEGAL_DISCLAIMER, LLM_API_KEY
from .database import engine, Base, get_db
from .models import ContractModel, ClauseModel, FindingModel, MissingCheckModel
from .schemas import (
    RuleSchema, RuleCreateSchema, RuleUpdateSchema,
    ReviewUpdateSchema, ContractAnalysisResponse,
    ClauseSchema, FindingSchema, MissingItemSchema,
    EdgeCasesSchema, AnalysisSummarySchema,
    CompareRequest, CompareResponse
)
from .document_parser import extract_text_from_file
from .clause_extractor import extract_clauses
from .categorizer import categorizer
from .rules_engine import rules_engine
from .missing_clauses import check_missing_clauses
from .edge_cases import detect_unusual_terminology, find_duplicate_clauses, evaluate_no_match
from .comparator import compare_contracts
from .llm_explainer import rewrite_explanation_with_llm

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Based Contract Risk Indicator",
    description="Identifies potentially important or unusual contract clauses for human review. NOT legal advice.",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "AI-Based Contract Risk Indicator API",
        "status": "online",
        "frontend_url": "http://localhost:5173",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "disclaimer": LEGAL_DISCLAIMER
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI-Based Contract Risk Indicator",
        "disclaimer": LEGAL_DISCLAIMER,
        "llm_configured": bool(os.getenv("LLM_API_KEY", LLM_API_KEY).strip()),
        "total_rules": len(rules_engine.get_rules())
    }


@app.get("/api/sample/{filename}")
def get_sample_file(filename: str):
    if filename not in ["sample_contract.txt", "sample_contract_2.txt"]:
        raise HTTPException(status_code=404, detail="Sample contract not found")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    workspace_root = os.path.dirname(base_dir)
    file_path = os.path.join(workspace_root, filename)
    if not os.path.exists(file_path):
        file_path = os.path.join(workspace_root, "frontend", "public", filename)

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return Response(content=content, media_type="text/plain")
    raise HTTPException(status_code=404, detail="Sample file not found")




# ==========================================
# CONTRACT UPLOAD & ANALYSIS ENDPOINTS
# ==========================================

def run_contract_analysis(contract_id: str, filename: str, raw_text: str, db: Session, enrich_llm: bool = False):
    """
    Executes the full pipeline:
    1. Clause extraction
    2. Hybrid categorization
    3. Missing clause checks
    4. Duplicate clause detection
    5. Rule evaluation with evidence quote extraction
    6. Edge cases detection (unusual terms, no match)
    7. Storage in SQLite
    """
    # 1. Clause extraction
    raw_clauses = extract_clauses(raw_text)
    
    # 2. Hybrid categorization
    categorized_clauses = []
    for c in raw_clauses:
        category, conf = categorizer.categorize(c["heading"], c["full_text"])
        c_copy = dict(c)
        c_copy["category"] = category
        c_copy["confidence"] = conf
        categorized_clauses.append(c_copy)

    # 3. Missing clauses check
    missing_items = check_missing_clauses(raw_text)

    # 4. Duplicate clauses detection
    dup_map = find_duplicate_clauses(categorized_clauses)

    # 5. Rule evaluation
    findings = rules_engine.evaluate_clauses(categorized_clauses, duplicate_map=dup_map)

    # Optional LLM rewrite
    if enrich_llm:
        for f in findings:
            f["explanation"] = rewrite_explanation_with_llm(
                f["rule_name"], f["evidence_quote"], f["explanation"]
            )

    # 6. Edge cases
    unusual_terms = detect_unusual_terminology(categorized_clauses)
    no_match_eval = evaluate_no_match(findings)

    # Clean existing records for this contract if re-analyzing
    db.query(ClauseModel).filter(ClauseModel.contract_id == contract_id).delete()
    db.query(FindingModel).filter(FindingModel.contract_id == contract_id).delete()
    db.query(MissingCheckModel).filter(MissingCheckModel.contract_id == contract_id).delete()

    # Save Clauses
    for c in categorized_clauses:
        clause_obj = ClauseModel(
            id=f"{contract_id}_{c['clause_id']}",
            contract_id=contract_id,
            clause_id=c["clause_id"],
            heading=c["heading"],
            full_text=c["full_text"],
            start_char=c["start_char"],
            end_char=c["end_char"],
            category=c["category"],
            confidence=str(c["confidence"])
        )
        db.add(clause_obj)

    # Save Findings
    for f in findings:
        finding_obj = FindingModel(
            id=f["id"],
            contract_id=contract_id,
            rule_id=f["rule_id"],
            rule_name=f["rule_name"],
            category=f["category"],
            severity=f["severity"],
            clause_id=f["clause_id"],
            clause_heading=f["clause_heading"],
            evidence_quote=f["evidence_quote"],
            start_char=f["start_char"],
            end_char=f["end_char"],
            explanation=f["explanation"],
            review_status="Unreviewed",
            reviewer_note="",
            reviewed_at=None
        )
        finding_obj.set_also_appears_in(f.get("also_appears_in", []))
        db.add(finding_obj)

    # Save Missing Checks
    for m in missing_items:
        m_obj = MissingCheckModel(
            id=f"{contract_id}_{uuid.uuid4().hex[:6]}",
            contract_id=contract_id,
            item_name=m["item_name"],
            is_present=m["is_present"],
            severity=m["severity"],
            rationale=m["rationale"]
        )
        db.add(m_obj)

    db.commit()

    # Build summary
    high_count = sum(1 for f in findings if f["severity"] == "High")
    med_count = sum(1 for f in findings if f["severity"] == "Medium")
    low_count = sum(1 for f in findings if f["severity"] == "Low")
    missing_count = sum(1 for m in missing_items if not m["is_present"])

    # Prepare duplicates list for edge case response
    duplicates_list = []
    for primary_id, appearances in dup_map.items():
        duplicates_list.append({
            "primary_clause_id": primary_id,
            "duplicated_in": appearances
        })

    def compute_risk_metrics(h_c: int, m_c: int, l_c: int, miss_c: int):
        raw_score = (h_c * 20) + (m_c * 8) + (l_c * 2) + (miss_c * 10)
        score = min(100, max(0, raw_score))
        if h_c >= 1 or score >= 50:
            level = "High"
        elif m_c >= 1 or miss_c >= 1 or score >= 20:
            level = "Medium"
        else:
            level = "Low"
        return level, score

    risk_level, risk_score = compute_risk_metrics(high_count, med_count, low_count, missing_count)

    summary = AnalysisSummarySchema(
        total_clauses=len(categorized_clauses),
        total_findings=len(findings),
        high_count=high_count,
        medium_count=med_count,
        low_count=low_count,
        reviewed_count=0,
        missing_items_count=missing_count,
        overall_risk_level=risk_level,
        overall_risk_score=risk_score
    )

    edge_cases = EdgeCasesSchema(
        unusual_terms_detected=unusual_terms,
        duplicate_clauses_detected=duplicates_list,
        no_match_found=no_match_eval["no_match_found"],
        no_match_message=no_match_eval["no_match_message"]
    )

    return {
        "contract_id": contract_id,
        "filename": filename,
        "created_at": datetime.utcnow(),
        "disclaimer": LEGAL_DISCLAIMER,
        "summary": summary,
        "clauses": [
            ClauseSchema(
                clause_id=c["clause_id"],
                heading=c["heading"],
                full_text=c["full_text"],
                start_char=c["start_char"],
                end_char=c["end_char"],
                category=c["category"],
                confidence=float(c["confidence"])
            ) for c in categorized_clauses
        ],
        "findings": [
            FindingSchema(
                id=f["id"],
                rule_id=f["rule_id"],
                rule_name=f["rule_name"],
                category=f["category"],
                severity=f["severity"],
                clause_id=f["clause_id"],
                clause_heading=f["clause_heading"],
                evidence_quote=f["evidence_quote"],
                start_char=f["start_char"],
                end_char=f["end_char"],
                explanation=f["explanation"],
                also_appears_in=f.get("also_appears_in", []),
                review_status="Unreviewed",
                reviewer_note="",
                reviewed_at=None
            ) for f in findings
        ],
        "missing_clauses": [
            MissingItemSchema(
                item_name=m["item_name"],
                is_present=m["is_present"],
                severity=m["severity"],
                rationale=m["rationale"]
            ) for m in missing_items
        ],
        "edge_cases": edge_cases
    }


@app.post("/api/contracts/upload", response_model=ContractAnalysisResponse)
async def upload_contract(
    file: UploadFile = File(...),
    enrich_llm: bool = Query(False, description="Optional LLM rewrite for explanations"),
    db: Session = Depends(get_db)
):
    """
    Accepts PDF, DOCX, or TXT contracts.
    Extracts text, runs clause splitting, categorization, and rule indicators.
    Returns findings with exact quotes and mandatory legal disclaimer.
    """
    filename = file.filename or "contract.txt"
    try:
        content_bytes = await file.read()
        raw_text, file_type = extract_text_from_file(content_bytes, filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

    contract_id = f"cnt_{uuid.uuid4().hex[:8]}"

    # Save Contract record
    contract_obj = ContractModel(
        id=contract_id,
        filename=filename,
        file_type=file_type,
        raw_text=raw_text,
        created_at=datetime.utcnow()
    )
    db.add(contract_obj)
    db.commit()

    analysis_result = run_contract_analysis(
        contract_id=contract_id,
        filename=filename,
        raw_text=raw_text,
        db=db,
        enrich_llm=enrich_llm
    )

    return analysis_result


@app.get("/api/contracts")
def list_contracts(db: Session = Depends(get_db)):
    """Lists all previously uploaded and analyzed contracts."""
    contracts = db.query(ContractModel).order_by(ContractModel.created_at.desc()).all()
    results = []
    for c in contracts:
        total_findings = db.query(FindingModel).filter(FindingModel.contract_id == c.id).count()
        high_findings = db.query(FindingModel).filter(FindingModel.contract_id == c.id, FindingModel.severity == "High").count()
        med_findings = db.query(FindingModel).filter(FindingModel.contract_id == c.id, FindingModel.severity == "Medium").count()
        low_findings = db.query(FindingModel).filter(FindingModel.contract_id == c.id, FindingModel.severity == "Low").count()
        risk_level = "High" if high_findings > 0 else ("Medium" if total_findings > 0 else "Low")
        results.append({
            "id": c.id,
            "filename": c.filename,
            "file_type": c.file_type,
            "created_at": c.created_at,
            "total_findings": total_findings,
            "high_severity_findings": high_findings,
            "medium_severity_findings": med_findings,
            "low_severity_findings": low_findings,
            "risk_level": risk_level,
            "disclaimer": LEGAL_DISCLAIMER
        })
    return {"contracts": results, "disclaimer": LEGAL_DISCLAIMER}


@app.get("/api/contracts/{contract_id}", response_model=ContractAnalysisResponse)
def get_contract(contract_id: str, db: Session = Depends(get_db)):
    """Retrieves full analysis for a contract by ID."""
    contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    clauses = db.query(ClauseModel).filter(ClauseModel.contract_id == contract_id).all()
    findings = db.query(FindingModel).filter(FindingModel.contract_id == contract_id).all()
    missing = db.query(MissingCheckModel).filter(MissingCheckModel.contract_id == contract_id).all()

    # Reconstruct edge cases
    clause_dicts = [{
        "clause_id": c.clause_id,
        "heading": c.heading,
        "full_text": c.full_text,
        "category": c.category,
        "confidence": float(c.confidence)
    } for c in clauses]

    dup_map = find_duplicate_clauses(clause_dicts)
    unusual_terms = detect_unusual_terminology(clause_dicts)
    no_match_eval = evaluate_no_match(findings)

    high_c = sum(1 for f in findings if f.severity == "High")
    med_c = sum(1 for f in findings if f.severity == "Medium")
    low_c = sum(1 for f in findings if f.severity == "Low")
    rev_c = sum(1 for f in findings if f.review_status != "Unreviewed")
    missing_c = sum(1 for m in missing if not m.is_present)

    raw_sc = (high_c * 20) + (med_c * 8) + (low_c * 2) + (missing_c * 10)
    score_c = min(100, max(0, raw_sc))
    if high_c >= 1 or score_c >= 50:
        lvl_c = "High"
    elif med_c >= 1 or missing_c >= 1 or score_c >= 20:
        lvl_c = "Medium"
    else:
        lvl_c = "Low"

    summary = AnalysisSummarySchema(
        total_clauses=len(clauses),
        total_findings=len(findings),
        high_count=high_c,
        medium_count=med_c,
        low_count=low_c,
        reviewed_count=rev_c,
        missing_items_count=missing_c,
        overall_risk_level=lvl_c,
        overall_risk_score=score_c
    )

    duplicates_list = [{"primary_clause_id": k, "duplicated_in": v} for k, v in dup_map.items()]

    return {
        "contract_id": contract.id,
        "filename": contract.filename,
        "created_at": contract.created_at,
        "disclaimer": LEGAL_DISCLAIMER,
        "summary": summary,
        "clauses": [
            ClauseSchema(
                clause_id=c.clause_id,
                heading=c.heading,
                full_text=c.full_text,
                start_char=c.start_char,
                end_char=c.end_char,
                category=c.category,
                confidence=float(c.confidence)
            ) for c in clauses
        ],
        "findings": [
            FindingSchema(
                id=f.id,
                rule_id=f.rule_id,
                rule_name=f.rule_name,
                category=f.category,
                severity=f.severity,
                clause_id=f.clause_id,
                clause_heading=f.clause_heading,
                evidence_quote=f.evidence_quote,
                start_char=f.start_char,
                end_char=f.end_char,
                explanation=f.explanation,
                also_appears_in=f.get_also_appears_in(),
                review_status=f.review_status,
                reviewer_note=f.reviewer_note or "",
                reviewed_at=f.reviewed_at
            ) for f in findings
        ],
        "missing_clauses": [
            MissingItemSchema(
                item_name=m.item_name,
                is_present=m.is_present,
                severity=m.severity,
                rationale=m.rationale
            ) for m in missing
        ],
        "edge_cases": EdgeCasesSchema(
            unusual_terms_detected=unusual_terms,
            duplicate_clauses_detected=duplicates_list,
            no_match_found=no_match_eval["no_match_found"],
            no_match_message=no_match_eval["no_match_message"]
        )
    }


@app.post("/api/contracts/{contract_id}/reanalyze", response_model=ContractAnalysisResponse)
def reanalyze_contract(contract_id: str, db: Session = Depends(get_db)):
    """Re-runs risk indicators against existing contract clauses using current rules."""
    contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    return run_contract_analysis(
        contract_id=contract.id,
        filename=contract.filename,
        raw_text=contract.raw_text,
        db=db
    )


# ==========================================
# HUMAN REVIEW & EXPORT ENDPOINTS
# ==========================================

@app.put("/api/findings/{finding_id}/review")
def review_finding(finding_id: str, body: ReviewUpdateSchema, db: Session = Depends(get_db)):
    """
    Submits a human review for a finding:
    Valid statuses: 'Confirmed risk', 'Needs legal review', 'Not a concern'
    Persists reviewer note and timestamp in SQLite.
    """
    valid_statuses = ["Confirmed risk", "Needs legal review", "Not a concern"]
    if body.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid review status. Must be one of: {', '.join(valid_statuses)}"
        )

    finding = db.query(FindingModel).filter(FindingModel.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.review_status = body.status
    finding.reviewer_note = body.reviewer_note or ""
    finding.reviewed_at = datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "finding_id": finding.id,
        "review_status": finding.review_status,
        "reviewer_note": finding.reviewer_note,
        "reviewed_at": finding.reviewed_at,
        "disclaimer": LEGAL_DISCLAIMER
    }


@app.get("/api/contracts/{contract_id}/export")
def export_contract_review(
    contract_id: str,
    format: str = Query("json", description="Export format: 'json' or 'csv'"),
    db: Session = Depends(get_db)
):
    """
    Exports contract findings, source evidence, and human review decisions.
    Supports JSON or CSV format.
    """
    contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    findings = db.query(FindingModel).filter(FindingModel.contract_id == contract_id).all()

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Finding ID",
            "Rule Name",
            "Category",
            "Severity",
            "Clause ID",
            "Clause Heading",
            "Evidence Quote",
            "Explanation",
            "Review Status",
            "Reviewer Note",
            "Reviewed At"
        ])
        for f in findings:
            writer.writerow([
                f.id,
                f.rule_name,
                f.category,
                f.severity,
                f.clause_id,
                f.clause_heading,
                f.evidence_quote,
                f.explanation,
                f.review_status,
                f.reviewer_note,
                f.reviewed_at.isoformat() if f.reviewed_at else "Unreviewed"
            ])
        output.seek(0)
        
        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=contract_{contract_id}_review.csv"
            }
        )
        return response

    # Default JSON export
    data = {
        "contract_id": contract.id,
        "filename": contract.filename,
        "exported_at": datetime.utcnow().isoformat(),
        "disclaimer": LEGAL_DISCLAIMER,
        "findings": [
            {
                "finding_id": f.id,
                "rule_name": f.rule_name,
                "category": f.category,
                "severity": f.severity,
                "clause_id": f.clause_id,
                "clause_heading": f.clause_heading,
                "evidence_quote": f.evidence_quote,
                "start_char": f.start_char,
                "end_char": f.end_char,
                "explanation": f.explanation,
                "also_appears_in": f.get_also_appears_in(),
                "review_status": f.review_status,
                "reviewer_note": f.reviewer_note,
                "reviewed_at": f.reviewed_at.isoformat() if f.reviewed_at else None
            } for f in findings
        ]
    }
    return data


# ==========================================
# CONFIGURABLE RULES CRUD ENDPOINTS
# ==========================================

@app.get("/api/rules", response_model=List[RuleSchema])
def get_all_rules():
    """Returns all configurable risk indicator rules."""
    return rules_engine.get_rules()


@app.post("/api/rules", response_model=RuleSchema)
def create_rule(rule_in: RuleCreateSchema):
    """Creates a new custom risk indicator rule."""
    new_rule = rules_engine.add_rule(rule_in.model_dump())
    return new_rule


@app.put("/api/rules/{rule_id}", response_model=RuleSchema)
def update_rule(rule_id: str, rule_in: RuleUpdateSchema):
    """Updates an existing risk indicator rule (enable/disable, patterns, severity)."""
    updates = {k: v for k, v in rule_in.model_dump().items() if v is not None}
    updated = rules_engine.update_rule(rule_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Rule not found")
    return updated


@app.delete("/api/rules/{rule_id}")
def delete_rule(rule_id: str):
    """Deletes a risk indicator rule."""
    success = rules_engine.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"status": "deleted", "rule_id": rule_id}


@app.post("/api/rules/reset", response_model=List[RuleSchema])
def reset_rules_to_defaults():
    """Resets all risk indicator rules to original system defaults."""
    return rules_engine.reset_rules()


# ==========================================
# STRETCH GOAL: CONTRACT COMPARISON
# ==========================================

@app.post("/api/compare", response_model=CompareResponse)
def compare_two_contracts(req: CompareRequest, db: Session = Depends(get_db)):
    """
    Takes two contract IDs and returns:
    - Side-by-side rule counts and clause references
    - Missing clause differences
    - Plain-language risk delta summary
    - Mandatory disclaimer
    """
    c1 = db.query(ContractModel).filter(ContractModel.id == req.contract_id_1).first()
    c2 = db.query(ContractModel).filter(ContractModel.id == req.contract_id_2).first()

    if not c1 or not c2:
        raise HTTPException(status_code=404, detail="One or both contracts not found for comparison.")

    c1_findings = db.query(FindingModel).filter(FindingModel.contract_id == c1.id).all()
    c2_findings = db.query(FindingModel).filter(FindingModel.contract_id == c2.id).all()
    c1_missing = db.query(MissingCheckModel).filter(MissingCheckModel.contract_id == c1.id).all()
    c2_missing = db.query(MissingCheckModel).filter(MissingCheckModel.contract_id == c2.id).all()

    c1_findings_dicts = [{
        "rule_id": f.rule_id,
        "rule_name": f.rule_name,
        "category": f.category,
        "severity": f.severity,
        "clause_heading": f.clause_heading,
        "evidence_quote": f.evidence_quote
    } for f in c1_findings]

    c2_findings_dicts = [{
        "rule_id": f.rule_id,
        "rule_name": f.rule_name,
        "category": f.category,
        "severity": f.severity,
        "clause_heading": f.clause_heading,
        "evidence_quote": f.evidence_quote
    } for f in c2_findings]

    c1_missing_dicts = [{"item_name": m.item_name, "is_present": m.is_present} for m in c1_missing]
    c2_missing_dicts = [{"item_name": m.item_name, "is_present": m.is_present} for m in c2_missing]

    c1_summary = AnalysisSummarySchema(
        total_clauses=db.query(ClauseModel).filter(ClauseModel.contract_id == c1.id).count(),
        total_findings=len(c1_findings),
        high_count=sum(1 for f in c1_findings if f.severity == "High"),
        medium_count=sum(1 for f in c1_findings if f.severity == "Medium"),
        low_count=sum(1 for f in c1_findings if f.severity == "Low"),
        reviewed_count=sum(1 for f in c1_findings if f.review_status != "Unreviewed"),
        missing_items_count=sum(1 for m in c1_missing if not m.is_present)
    )

    c2_summary = AnalysisSummarySchema(
        total_clauses=db.query(ClauseModel).filter(ClauseModel.contract_id == c2.id).count(),
        total_findings=len(c2_findings),
        high_count=sum(1 for f in c2_findings if f.severity == "High"),
        medium_count=sum(1 for f in c2_findings if f.severity == "Medium"),
        low_count=sum(1 for f in c2_findings if f.severity == "Low"),
        reviewed_count=sum(1 for f in c2_findings if f.review_status != "Unreviewed"),
        missing_items_count=sum(1 for m in c2_missing if not m.is_present)
    )

    c1_meta = {"id": c1.id, "filename": c1.filename, "summary": c1_summary}
    c2_meta = {"id": c2.id, "filename": c2.filename, "summary": c2_summary}

    comparison = compare_contracts(
        c1_meta=c1_meta,
        c1_findings=c1_findings_dicts,
        c1_missing=c1_missing_dicts,
        c2_meta=c2_meta,
        c2_findings=c2_findings_dicts,
        c2_missing=c2_missing_dicts
    )

    return comparison
