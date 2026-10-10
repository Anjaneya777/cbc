import pytest
from app.edge_cases import find_duplicate_clauses
from app.rules_engine import rules_engine


def test_duplicate_clause_cross_referencing():
    clauses = [
        {
            "clause_id": "clause_3",
            "heading": "Section 3. Notice Obligation",
            "full_text": "Each party shall promptly notify the other party in writing within 48 hours of any security event.",
            "start_char": 100,
            "end_char": 200
        },
        {
            "clause_id": "clause_9",
            "heading": "Section 9. Duplicate Notice Requirement",
            "full_text": "Each party shall promptly notify the other party in writing within 48 hours of any security event.",
            "start_char": 800,
            "end_char": 900
        }
    ]

    dup_map = find_duplicate_clauses(clauses)
    assert "clause_3" in dup_map
    assert any(d["clause_id"] == "clause_9" for d in dup_map["clause_3"])

    # Verify that evaluating rules with duplicate map attaches also_appears_in
    test_rule = {
        "id": "rule_security_notice",
        "name": "Security Notice Requirement",
        "category": "Data/Privacy",
        "severity": "Low",
        "pattern_type": "keyword",
        "patterns": ["security event"],
        "enabled": True,
        "explanation": "Strict notification window"
    }
    rules_engine.rules.append(test_rule)
    findings = rules_engine.evaluate_clauses(clauses, duplicate_map=dup_map)
    f = next(item for item in findings if item["rule_id"] == "rule_security_notice")
    assert len(f["also_appears_in"]) > 0
    assert f["also_appears_in"][0]["clause_id"] == "clause_9"
