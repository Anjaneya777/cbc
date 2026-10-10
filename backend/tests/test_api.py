import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "disclaimer" in data
    assert "not legal advice" in data["disclaimer"].lower()


def test_upload_and_review_flow():
    sample_text = """
MASTER SERVICES AGREEMENT
Effective date: October 10, 2026. Apex Global and Zenith Enterprise.

SECTION 1. FEES
Payment shall be made within Net 90 days. All advance deposits are non-refundable.

SECTION 2. TERMINATION
Company may terminate this agreement at its sole discretion upon 5 days' written notice.
Client shall pay liquidated damages of $50,000 upon default.

SECTION 3. CONFIDENTIALITY
Confidentiality obligations shall survive in perpetuity.

SECTION 4. DISPUTES
Exclusive jurisdiction of the courts of the Cayman Islands. Each party waives jury trial.

IN WITNESS WHEREOF:
Authorized Signatory: __________________
"""
    # Upload as TXT
    files = {"file": ("test_contract.txt", sample_text.encode("utf-8"), "text/plain")}
    res = client.post("/api/contracts/upload", files=files)
    assert res.status_code == 200
    data = res.json()

    contract_id = data["contract_id"]
    assert "disclaimer" in data
    assert len(data["clauses"]) >= 4
    assert len(data["findings"]) >= 4
    assert data["summary"]["high_count"] >= 1

    first_finding = data["findings"][0]
    finding_id = first_finding["id"]

    # Submit human review
    review_res = client.put(
        f"/api/findings/{finding_id}/review",
        json={"status": "Confirmed risk", "reviewer_note": "Unacceptable sole discretion exit"}
    )
    assert review_res.status_code == 200
    review_data = review_res.json()
    assert review_data["review_status"] == "Confirmed risk"

    # Export review as CSV
    export_res = client.get(f"/api/contracts/{contract_id}/export?format=csv")
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers["content-type"]
    assert "Confirmed risk" in export_res.text

    # Export review as JSON
    export_json = client.get(f"/api/contracts/{contract_id}/export?format=json")
    assert export_json.status_code == 200
    assert "findings" in export_json.json()


def test_empty_pdf_error():
    # Simulated empty PDF bytes
    empty_pdf = b"%PDF-1.4\n%%EOF"
    files = {"file": ("scanned_blank.pdf", empty_pdf, "application/pdf")}
    res = client.post("/api/contracts/upload", files=files)
    assert res.status_code == 400
    assert "no extractable text layer" in res.json()["detail"].lower()
