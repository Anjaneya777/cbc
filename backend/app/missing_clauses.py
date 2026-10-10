import re
from typing import List, Dict, Any


MISSING_CHECKLIST = [
    {
        "item_name": "Governing Law & Jurisdiction",
        "key": "governing_law",
        "severity": "High",
        "patterns": [
            r'(?i)\bgoverning\s+law\b',
            r'(?i)\bjurisdiction\b',
            r'(?i)\bconstrued\s+in\s+accordance\s+with\b',
            r'(?i)\blaws\s+of\s+(?:the\s+state\s+of|the\s+country\s+of|the\s+province\s+of|[A-Z][a-z]+)\b'
        ],
        "rationale": "Missing governing law or dispute resolution clause creates immense uncertainty and risk of costly jurisdictional battles in the event of a dispute."
    },
    {
        "item_name": "Termination Clause",
        "key": "termination",
        "severity": "High",
        "patterns": [
            r'(?i)\bterminat(?:ion|e|ed)?\b',
            r'(?i)\bcancellation\b',
            r'(?i)\bright\s+to\s+cancel\b'
        ],
        "rationale": "Missing termination clause leaves parties with no agreed process to exit the contract for cause, convenience, or breach, potentially locking parties in indefinitely."
    },
    {
        "item_name": "Limitation of Liability",
        "key": "liability",
        "severity": "High",
        "patterns": [
            r'(?i)\blimitation\s+of\s+liability\b',
            r'(?i)\baggregate\s+liability\b',
            r'(?i)\bcap\s+on\s+liability\b',
            r'(?i)\bconsequential\s+damages\b'
        ],
        "rationale": "Without a limitation of liability clause, damages under common law are potentially uncapped, exposing your organization to unbounded financial recovery."
    },
    {
        "item_name": "Payment & Consideration Terms",
        "key": "payment",
        "severity": "High",
        "patterns": [
            r'(?i)\bpayment\s+terms\b',
            r'(?i)\bfee(?:s)?\b',
            r'(?i)\binvoice(?:s)?\b',
            r'(?i)\bpayable\s+within\b',
            r'(?i)\bcompensation\b',
            r'(?i)\bnet\s+\d+\b'
        ],
        "rationale": "No clearly specified payment schedules, invoicing mechanisms, or consideration terms were detected, creating cash flow vulnerability."
    },
    {
        "item_name": "Parties and Effective Date",
        "key": "parties_date",
        "severity": "Medium",
        "patterns": [
            r'(?i)\beffective\s+date\b',
            r'(?i)\bentered\s+into\s+(?:by\s+and\s+between|as\s+of|on\s+this)\b',
            r'(?i)\bthis\s+agreement\s+is\s+made\b',
            r'(?i)\bdated\s+as\s+of\b'
        ],
        "rationale": "The agreement lacks clear contracting party definitions or an explicit effective date, which can compromise enforceability and timeline calculations."
    },
    {
        "item_name": "Signature Block / Execution Section",
        "key": "signatures",
        "severity": "Medium",
        "patterns": [
            r'(?i)\bin\s+witness\s+whereof\b',
            r'(?i)\bby:\s*_{2,}\b',
            r'(?i)\bauthorized\s+signat(?:ory|ure)\b',
            r'(?i)\bname:\s*_{2,}\b',
            r'(?i)\btitle:\s*_{2,}\b',
            r'(?i)\[\s*signature\s*\]'
        ],
        "rationale": "No signature or execution section was detected, indicating this document may be an unexecuted draft rather than a binding final agreement."
    },
    {
        "item_name": "Confidentiality & Non-Disclosure",
        "key": "confidentiality",
        "severity": "Medium",
        "patterns": [
            r'(?i)\bconfidential(?:ity)?\b',
            r'(?i)\bnon-disclosure\b',
            r'(?i)\bproprietary\s+information\b',
            r'(?i)\btrade\s+secrets\b'
        ],
        "rationale": "No confidentiality provisions detected, leaving shared sensitive business information, data, or technical know-how unprotected against disclosure."
    }
]


def check_missing_clauses(full_text: str) -> List[Dict[str, Any]]:
    """
    Checks for the presence of 7 critical standard contract clauses.
    Returns a list of check results with presence flag, severity, and rationale.
    """
    results = []
    for item in MISSING_CHECKLIST:
        is_present = False
        for pat in item["patterns"]:
            if re.search(pat, full_text):
                is_present = True
                break
        
        results.append({
            "item_name": item["item_name"],
            "is_present": is_present,
            "severity": item["severity"],
            "rationale": item["rationale"] if not is_present else f"Present: Verified '{item['item_name']}' in contract."
        })
    return results
