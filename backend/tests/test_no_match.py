import pytest
from app.edge_cases import evaluate_no_match


def test_no_matching_risk_pattern():
    findings = []
    result = evaluate_no_match(findings)
    assert result["no_match_found"] is True
    assert "No matching risk pattern found" in result["no_match_message"]
    assert "This does not mean the contract is safe" in result["no_match_message"]


def test_matching_risk_pattern_present():
    findings = [{"id": "find_1", "rule_name": "Test Rule"}]
    result = evaluate_no_match(findings)
    assert result["no_match_found"] is False
    assert result["no_match_message"] is None
