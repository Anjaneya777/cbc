import pytest
from app.clause_extractor import extract_clauses


def test_numbered_and_section_headings():
    contract_text = """
SECTION 1. SCOPE OF ENGAGEMENT
The consultant shall provide systems engineering and architecture review services.

SECTION 2. FEES AND INVOICING
All invoices are payable within 30 days of submission.

ARTICLE III: TERMINATION AND NOTICE
Either party may terminate upon thirty days written notice.
"""
    clauses = extract_clauses(contract_text)
    assert len(clauses) >= 3
    headings = [c["heading"] for c in clauses]
    assert any("SECTION 1" in h for h in headings)
    assert any("SECTION 2" in h for h in headings)
    assert any("ARTICLE III" in h for h in headings)

    # Verify character offsets
    for c in clauses:
        assert c["start_char"] >= 0
        assert c["end_char"] > c["start_char"]
        assert c["full_text"] != ""


def test_all_caps_headings():
    contract_text = """
CONFIDENTIALITY AND TRADE SECRETS
The receiving party agrees to hold all proprietary materials in confidence.

LIMITATION OF LIABILITY
Neither party shall be liable for indirect or consequential damages.

GOVERNING LAW
This agreement is governed by the laws of California.
"""
    clauses = extract_clauses(contract_text)
    assert len(clauses) >= 3
    headings = [c["heading"] for c in clauses]
    assert any("CONFIDENTIALITY" in h for h in headings)
    assert any("LIMITATION OF LIABILITY" in h for h in headings)


def test_paragraph_fallback():
    contract_text = """
This is an informal single page letter agreement between Acme and Beta. We agree to collaborate on research.

All payments shall be made at the beginning of each calendar quarter by wire transfer.

Either party may withdraw with two weeks notice if research objectives are not met.
"""
    clauses = extract_clauses(contract_text)
    assert len(clauses) >= 2
    # Verify fallback generated paragraph headings
    assert all("Paragraph" in c["heading"] or "Section" in c["heading"] for c in clauses)
