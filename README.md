# AI-Based Contract Risk Indicator (Team Titans)

> **Problem Statement 46 (Domain: AI & ML)**: Contracts often contain clauses that need careful human attention—such as unusual termination terms, severe penalties, automatic evergreen renewals, or missing protections.
>
> **Mandatory Disclaimer**: *This tool highlights clauses for human review. It is not legal advice.*

---

## Architecture Overview (ASCII)

```
+-----------------------------------------------------------------------------------+
|                            REACT + VITE + TAILWIND CSS                             |
|  - Drag-and-Drop Uploader (PDF / DOCX / TXT) & Sample Loader                      |
|  - Interactive Dual Pane: Findings Cards <== Auto-Scroll ==> Highlighted Viewer   |
|  - Human Review Interface (Confirm Risk / Needs Legal Review / Not a Concern)     |
|  - Configurable Rules Manager (CRUD, Live Toggle, Re-Analysis)                    |
|  - Cross-Contract Comparator (Side-by-Side Delta Matrix, Missing Clause Diffs)    |
|  - Non-Dismissible Disclaimer Banner (Present on All Views)                       |
+-----------------------------------------------------------------------------------+
                                       |
                                HTTP REST API
                                       |
+-----------------------------------------------------------------------------------+
|                              FASTAPI BACKEND                                      |
|                                                                                   |
|  +------------------------+  +-------------------------+  +--------------------+  |
|  | Document Parser        |  | Hybrid Categorizer      |  | Rules Engine       |  |
|  | - PDF (pdfplumber)     |  | - Regex Rule Filters    |  | - 17 Default Rules |  |
|  | - DOCX (python-docx)   |  | - TF-IDF Vectorizer     |  | - Exact Quote Extr |  |
|  | - TXT UTF-8 / Latin-1  |  | - Cosine Similarity     |  | - Char Offsets     |  |
|  | - Text Layer Check     |  | - 12 Commercial Classes |  | - rules.json CRUD  |  |
|  +------------------------+  +-------------------------+  +--------------------+  |
|               |                           |                          |            |
|  +------------------------+  +-------------------------+  +--------------------+  |
|  | Clause Splitter        |  | Missing Clauses Auditor |  | Edge Cases Handler |  |
|  | - Numbered Headings    |  | - Governing Law         |  | - Rare Terminology |  |
|  | - ALL-CAPS Headings    |  | - Termination           |  | - De-Duplication   |  |
|  | - Paragraph Fallback   |  | - Liability Limitation  |  | - No-Match Safety  |  |
|  | - Precise Char Offsets |  | - 7 Core Legal Pillars  |  |   Notice           |  |
|  +------------------------+  +-------------------------+  +--------------------+  |
|                                                                                   |
|  +------------------------+  +-------------------------+  +--------------------+  |
|  | SQLite Storage         |  | Export Engine           |  | Optional LLM Step  |  |
|  | - Contracts, Clauses   |  | - Downloadable CSV      |  | - Gemini / GenAI   |  |
|  | - Findings, Reviews    |  | - Downloadable JSON     |  | - Local Fallback   |  |
|  +------------------------+  +-------------------------+  +--------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## Key Features

1. **Multi-Format Ingestion**: Ingests PDF (`pdfplumber`), Word DOCX (`python-docx`), and TXT. Rejects image-only/scanned PDFs lacking text layers with a clear instructional error.
2. **Hybrid Clause Categorization**: Combines regex patterns and `scikit-learn` TF-IDF cosine similarity across 12 legal categories:
   - *Termination, Payment, Penalties, Renewal, Liability, Indemnity, Confidentiality, IP, Non-compete/Exclusivity, Governing law/Disputes, Unilateral changes, Data/Privacy*.
3. **17 Configurable Default Risk Indicators**:
   - Termination without cause / at sole discretion
   - Short notice period (< 15 days)
   - Liquidated damages / punitive assessments
   - Automatic evergreen renewal
   - Unlimited liability / exclusion of liability caps
   - Broad indemnity ("any and all claims")
   - Unilateral contract amendments without notice
   - Non-compete and exclusivity restrictions
   - Irrevocable IP assignment of all work product
   - Non-refundable fees and deposits
   - Payment terms exceeding Net 60 days
   - Perpetual confidentiality survival
   - One-sided foreign jurisdiction
   - Waiver of jury trial
   - Unrestricted data processing / commercialization
   - Excessive compounding interest penalty
   - Unreasonable audit on demand without notice
4. **Verifiable Sentence-Level Evidence**: Every finding includes exact matched sentence quotes and character offsets (`start_char`, `end_char`).
5. **Human Review Classification**: Mark findings as `Confirmed risk`, `Needs legal review`, or `Not a concern` with reviewer notes, persisted in SQLite and exportable to CSV/JSON.
6. **Missing Protections Audit**: Checks for the presence of 7 standard commercial safeguards (governing law, termination, liability cap, payment terms, parties/date, signatures, confidentiality).
7. **Edge Cases**:
   - **Unusual Legal Terminology**: Detects archaic terms (*hereinbefore, mutatis mutandis, inter alia*) and flags them as *"Unusual wording, review manually"*.
   - **Cross-Section Duplication**: De-duplicates repeated clauses and adds *"Also appears in clauses..."* cross-references.
   - **No Match Safety Banner**: Explicitly returns *"No matching risk pattern found. This does not mean the contract is safe."*
8. **Contract Comparison (Stretch Goal)**: Side-by-side risk matrix comparing two contracts with risk deltas and missing protection differences.

---

## Quickstart & Installation

### Option A: One-Command Start (Windows)
Double-click or run:
```cmd
run.bat
```
or in PowerShell:
```powershell
.\run.ps1
```

### Option B: Manual Start

#### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Docs & Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## Running the Automated Test Suite

Run all 23 unit and integration tests:
```bash
cd backend
python -m pytest tests -v
```
Test coverage includes:
- Clause heading splitting (numbered, ALL-CAPS, paragraph fallback)
- Every default risk indicator pattern
- Multi-section clause de-duplication
- Missing standard clauses checklist
- No-match safety notification
- Full upload, review classification, CSV export API flow
- Corrupted/scanned PDF error handling

---

## 3-Minute Hackathon Demo Script

1. **Step 1: Upload Contract (0:00 - 0:45)**
   - Open `http://localhost:5173`. Point out the non-dismissible legal disclaimer banner at the top.
   - Click **"Load Sample Contract (14+ Risks)"**.
   - Show instant extraction: 15 clauses parsed, 14 high/medium risk indicators triggered.

2. **Step 2: Review Findings & Evidence Highlighting (0:45 - 1:30)**
   - Click on the first High Risk finding: *"Termination Without Cause or at Sole Discretion"*.
   - Notice the contract viewer automatically scrolls to **Section 4.1** and highlights the exact evidence quote: *"Company may terminate this Agreement without cause and at its sole discretion upon 5 days' written notice to Client."*
   - Point out the character offset badge and the plain-language explanation.
   - Click **"Confirm Risk"** and type a note: *"Requires 30 days notice mutual cure period"*.

3. **Step 3: Edge Cases & Missing Protection Audit (1:30 - 2:00)**
   - Scroll to the **"Unusual Terminology"** card: highlight detection of *mutatis mutandis* and *hereinbefore* flagged as *"Unusual wording, review manually"*.
   - Point out the **"Also appears in: Section 14"** cross-reference on the duplicate notification clause.
   - Show the **"Missing Essential Protection Audit"** checklist.

4. **Step 4: Rules Customization (2:00 - 2:30)**
   - Click the **"Risk Rules"** tab.
   - Toggle off a rule or add a custom indicator (e.g., keyword *"subcontractor"* with High severity).
   - Return to the Analyze tab and click **"Re-analyze"** to show instant live recalculation.

5. **Step 5: Cross-Contract Comparison & Export (2:30 - 3:00)**
   - Click the **"Compare"** tab.
   - Click **"Benchmark Sample 1 vs Sample 2"**.
   - Show the executive risk delta: Contract 1 has higher high-severity exposure, while Contract 2 is missing governing law and signature blocks.
   - Return to Analyze and click **"Export CSV"** to download the completed review audit trail.
