from typing import List, Dict, Any
from .rules_engine import rules_engine
from .missing_clauses import MISSING_CHECKLIST


def compare_contracts(
    c1_meta: Dict[str, Any],
    c1_findings: List[Dict[str, Any]],
    c1_missing: List[Dict[str, Any]],
    c2_meta: Dict[str, Any],
    c2_findings: List[Dict[str, Any]],
    c2_missing: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Compares two contracts:
    - Side-by-side per-rule counts, clause references, and quotes
    - Missing clause differences
    - Risk score and delta assessment
    """
    # 1. Rules comparison
    all_rules = rules_engine.get_rules()
    rules_comparison = []

    c1_findings_by_rule: Dict[str, List[Dict[str, Any]]] = {}
    for f in c1_findings:
        c1_findings_by_rule.setdefault(f["rule_id"], []).append(f)

    c2_findings_by_rule: Dict[str, List[Dict[str, Any]]] = {}
    for f in c2_findings:
        c2_findings_by_rule.setdefault(f["rule_id"], []).append(f)

    c1_high_total = sum(1 for f in c1_findings if f["severity"] == "High")
    c2_high_total = sum(1 for f in c2_findings if f["severity"] == "High")

    for rule in all_rules:
        r_id = rule["id"]
        c1_matches_list = c1_findings_by_rule.get(r_id, [])
        c2_matches_list = c2_findings_by_rule.get(r_id, [])

        c1_count = len(c1_matches_list)
        c2_count = len(c2_matches_list)

        # Include if at least one contract has a finding for this rule
        if c1_count > 0 or c2_count > 0:
            if c1_count > c2_count:
                delta = "Contract 1 Higher"
            elif c2_count > c1_count:
                delta = "Contract 2 Higher"
            else:
                delta = "Balanced"

            rules_comparison.append({
                "rule_id": r_id,
                "rule_name": rule["name"],
                "category": rule["category"],
                "severity": rule["severity"],
                "contract_1_matches": c1_count,
                "contract_1_clauses": [f["clause_heading"] for f in c1_matches_list],
                "contract_1_quotes": [f["evidence_quote"] for f in c1_matches_list],
                "contract_2_matches": c2_count,
                "contract_2_clauses": [f["clause_heading"] for f in c2_matches_list],
                "contract_2_quotes": [f["evidence_quote"] for f in c2_matches_list],
                "risk_delta": delta
            })

    # 2. Missing clauses difference
    c1_missing_map = {item["item_name"]: item["is_present"] for item in c1_missing}
    c2_missing_map = {item["item_name"]: item["is_present"] for item in c2_missing}

    missing_diff = {}
    for item in MISSING_CHECKLIST:
        name = item["item_name"]
        p1 = c1_missing_map.get(name, False)
        p2 = c2_missing_map.get(name, False)

        if p1 and p2:
            status = "Both Present"
        elif not p1 and not p2:
            status = "Both Missing"
        elif not p1 and p2:
            status = "Missing in Contract 1 Only"
        else:
            status = "Missing in Contract 2 Only"

        missing_diff[name] = {
            "severity": item["severity"],
            "contract_1_present": p1,
            "contract_2_present": p2,
            "difference_status": status,
            "rationale": item["rationale"]
        }

    # 3. Plain language assessment
    if c1_high_total > c2_high_total:
        assessment = (
            f"Contract 1 ({c1_meta['filename']}) presents HIGHER overall risk with {c1_high_total} high-severity findings "
            f"compared to {c2_high_total} in Contract 2 ({c2_meta['filename']}). Review highlighted differences closely."
        )
    elif c2_high_total > c1_high_total:
        assessment = (
            f"Contract 2 ({c2_meta['filename']}) presents HIGHER overall risk with {c2_high_total} high-severity findings "
            f"compared to {c1_high_total} in Contract 1 ({c1_meta['filename']}). Review highlighted differences closely."
        )
    else:
        assessment = (
            f"Both contracts exhibit similar high-risk exposure ({c1_high_total} High findings each). "
            f"Inspect specific category variations and missing protections in the comparison breakdown."
        )

    return {
        "contract_1_id": c1_meta["id"],
        "contract_1_filename": c1_meta["filename"],
        "contract_2_id": c2_meta["id"],
        "contract_2_filename": c2_meta["filename"],
        "summary_1": c1_meta["summary"],
        "summary_2": c2_meta["summary"],
        "missing_clauses_diff": missing_diff,
        "rules_comparison": rules_comparison,
        "risk_assessment": assessment,
        "disclaimer": "This tool highlights clauses for human review. It is not legal advice."
    }
