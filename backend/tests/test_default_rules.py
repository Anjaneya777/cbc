import pytest
from app.rules_engine import rules_engine


@pytest.fixture
def fresh_rules():
    rules_engine.load_rules()
    return rules_engine


def test_rule_sole_discretion(fresh_rules):
    clauses = [{
        "clause_id": "c1",
        "heading": "Termination",
        "full_text": "Company may terminate this agreement at its sole discretion upon written notice.",
        "start_char": 0,
        "end_char": 100
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_term_sole_discretion" in rule_ids
    # Verify evidence quote exists
    f = next(item for item in findings if item["rule_id"] == "rule_term_sole_discretion")
    assert "sole discretion" in f["evidence_quote"].lower()
    assert f["severity"] == "High"


def test_rule_short_notice(fresh_rules):
    clauses = [{
        "clause_id": "c2",
        "heading": "Termination Notice",
        "full_text": "Either party may terminate upon 5 days' written notice to the other party.",
        "start_char": 0,
        "end_char": 80
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_short_notice" in rule_ids


def test_rule_liquidated_damages(fresh_rules):
    clauses = [{
        "clause_id": "c3",
        "heading": "Damages",
        "full_text": "Client agrees to pay liquidated damages of $50,000 upon default.",
        "start_char": 0,
        "end_char": 70
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_liquidated_damages" in rule_ids


def test_rule_auto_renewal(fresh_rules):
    clauses = [{
        "clause_id": "c4",
        "heading": "Term",
        "full_text": "This agreement shall automatically renew for successive terms of one year each.",
        "start_char": 0,
        "end_char": 85
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_auto_renewal" in rule_ids


def test_rule_unlimited_liability(fresh_rules):
    clauses = [{
        "clause_id": "c5",
        "heading": "Liability",
        "full_text": "Customer shall be liable without any limitation of liability for all losses.",
        "start_char": 0,
        "end_char": 80
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_unlimited_liability" in rule_ids


def test_rule_broad_indemnity(fresh_rules):
    clauses = [{
        "clause_id": "c6",
        "heading": "Indemnification",
        "full_text": "Supplier shall defend and hold harmless Buyer against any and all claims whatsoever.",
        "start_char": 0,
        "end_char": 90
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_broad_indemnity" in rule_ids


def test_rule_unilateral_amendment(fresh_rules):
    clauses = [{
        "clause_id": "c7",
        "heading": "Amendments",
        "full_text": "Vendor reserves the right to modify these terms at any time without notice.",
        "start_char": 0,
        "end_char": 80
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_unilateral_amendment" in rule_ids


def test_rule_non_compete(fresh_rules):
    clauses = [{
        "clause_id": "c8",
        "heading": "Non-Competition",
        "full_text": "Contractor shall not directly or indirectly compete with the Company.",
        "start_char": 0,
        "end_char": 75
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_non_compete" in rule_ids


def test_rule_ip_assignment(fresh_rules):
    clauses = [{
        "clause_id": "c9",
        "heading": "IP Ownership",
        "full_text": "Developer irrevocably assigns all work product and waives all moral rights.",
        "start_char": 0,
        "end_char": 80
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_ip_assignment" in rule_ids


def test_rule_non_refundable_fees(fresh_rules):
    clauses = [{
        "clause_id": "c10",
        "heading": "Deposits",
        "full_text": "All deposit payments are strictly non-refundable.",
        "start_char": 0,
        "end_char": 55
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_non_refundable_fees" in rule_ids


def test_rule_extended_payment_terms(fresh_rules):
    clauses = [{
        "clause_id": "c11",
        "heading": "Invoicing",
        "full_text": "Invoices are payable within Net 90 days of receipt.",
        "start_char": 0,
        "end_char": 55
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_extended_payment_terms" in rule_ids


def test_rule_perpetual_confidentiality(fresh_rules):
    clauses = [{
        "clause_id": "c12",
        "heading": "Non-Disclosure",
        "full_text": "Information shall remain confidential in perpetuity.",
        "start_char": 0,
        "end_char": 55
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_perpetual_confidentiality" in rule_ids


def test_rule_jury_waiver(fresh_rules):
    clauses = [{
        "clause_id": "c13",
        "heading": "Dispute Resolution",
        "full_text": "Each party waives any and all right to a jury trial.",
        "start_char": 0,
        "end_char": 55
    }]
    findings = fresh_rules.evaluate_clauses(clauses)
    rule_ids = [f["rule_id"] for f in findings]
    assert "rule_jury_waiver" in rule_ids
