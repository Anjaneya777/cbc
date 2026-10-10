import pytest
from app.missing_clauses import check_missing_clauses


def test_missing_clauses_detection():
    # Incomplete text missing governing law, signatures, and limitation of liability
    bare_text = """
MEMORANDUM OF UNDERSTANDING
Parties: Company A and Company B. Effective date: Jan 1, 2026.
Payment: Client shall pay $5,000 monthly fee within Net 30 days.
Termination: Either party may terminate with 30 days notice.
Confidentiality: Parties shall protect proprietary trade secrets.
"""
    results = check_missing_clauses(bare_text)
    by_name = {r["item_name"]: r for r in results}

    # Should detect payment, termination, confidentiality, parties
    assert by_name["Payment & Consideration Terms"]["is_present"] is True
    assert by_name["Termination Clause"]["is_present"] is True
    assert by_name["Confidentiality & Non-Disclosure"]["is_present"] is True
    assert by_name["Parties and Effective Date"]["is_present"] is True

    # Should flag missing governing law, limitation of liability, signature block
    assert by_name["Governing Law & Jurisdiction"]["is_present"] is False
    assert by_name["Limitation of Liability"]["is_present"] is False
    assert by_name["Signature Block / Execution Section"]["is_present"] is False
