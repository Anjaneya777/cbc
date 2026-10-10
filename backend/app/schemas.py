from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime


class RuleSchema(BaseModel):
    id: str
    name: str
    category: str
    severity: str  # High, Medium, Low
    pattern_type: str = "regex"  # regex, keyword
    patterns: List[str]
    enabled: bool = True
    explanation: str


class RuleCreateSchema(BaseModel):
    name: str
    category: str
    severity: str
    pattern_type: str = "regex"
    patterns: List[str]
    enabled: bool = True
    explanation: str


class RuleUpdateSchema(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    pattern_type: Optional[str] = None
    patterns: Optional[List[str]] = None
    enabled: Optional[bool] = None
    explanation: Optional[str] = None


class ReviewUpdateSchema(BaseModel):
    status: str = Field(..., description="Confirmed risk | Needs legal review | Not a concern")
    reviewer_note: Optional[str] = ""


class ClauseSchema(BaseModel):
    clause_id: str
    heading: str
    full_text: str
    start_char: int
    end_char: int
    category: str = "Unclassified"
    confidence: float = 0.0


class FindingSchema(BaseModel):
    id: str
    rule_id: str
    rule_name: str
    category: str
    severity: str
    clause_id: str
    clause_heading: str
    evidence_quote: str
    start_char: int
    end_char: int
    explanation: str
    also_appears_in: List[Dict[str, str]] = []
    review_status: str = "Unreviewed"
    reviewer_note: str = ""
    reviewed_at: Optional[datetime] = None


class MissingItemSchema(BaseModel):
    item_name: str
    is_present: bool
    severity: str
    rationale: str


class EdgeCasesSchema(BaseModel):
    unusual_terms_detected: List[Dict[str, Any]] = []
    duplicate_clauses_detected: List[Dict[str, Any]] = []
    no_match_found: bool = False
    no_match_message: Optional[str] = None


class AnalysisSummarySchema(BaseModel):
    total_clauses: int
    total_findings: int
    high_count: int
    medium_count: int
    low_count: int
    reviewed_count: int
    missing_items_count: int
    overall_risk_level: str = "Low"  # "High", "Medium", "Low"
    overall_risk_score: int = 0      # 0 to 100



class ContractAnalysisResponse(BaseModel):
    contract_id: str
    filename: str
    created_at: datetime
    disclaimer: str = "This tool highlights clauses for human review. It is not legal advice."
    summary: AnalysisSummarySchema
    clauses: List[ClauseSchema]
    findings: List[FindingSchema]
    missing_clauses: List[MissingItemSchema]
    edge_cases: EdgeCasesSchema


class CompareRequest(BaseModel):
    contract_id_1: str
    contract_id_2: str


class CompareRuleItem(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    severity: str
    contract_1_matches: int
    contract_1_clauses: List[str]
    contract_1_quotes: List[str]
    contract_2_matches: int
    contract_2_clauses: List[str]
    contract_2_quotes: List[str]
    risk_delta: str  # Contract 1 Higher, Contract 2 Higher, Balanced, None


class CompareResponse(BaseModel):
    contract_1_id: str
    contract_1_filename: str
    contract_2_id: str
    contract_2_filename: str
    summary_1: AnalysisSummarySchema
    summary_2: AnalysisSummarySchema
    missing_clauses_diff: Dict[str, Dict[str, Any]]
    rules_comparison: List[CompareRuleItem]
    risk_assessment: str
    disclaimer: str = "This tool highlights clauses for human review. It is not legal advice."
