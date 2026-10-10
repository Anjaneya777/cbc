import re
from typing import List, Dict, Any
from difflib import SequenceMatcher


UNUSUAL_LEGAL_TERMS = [
    "hereinbefore",
    "hereinafter",
    "mutatis mutandis",
    "notwithstanding anything to the contrary",
    "inter alia",
    "in perpetuity",
    "ipso facto",
    "sua sponte",
    "save harmless",
    "pari passu",
    "force majeure",
    "strict liability",
    "time is of the essence",
    "ultra vires",
    "de minimis",
    "cui bono",
    "in witness whereof",
    "to have and to hold",
    "null and void ab initio"
]


def detect_unusual_terminology(clauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detects archaic/rare legal terms and low-similarity clauses.
    Flags matching clauses as 'Unusual wording, review manually'.
    """
    alerts = []
    
    for clause in clauses:
        clause_id = clause["clause_id"]
        heading = clause["heading"]
        full_text = clause["full_text"]
        category = clause.get("category", "Unclassified")
        confidence = float(clause.get("confidence", 0.0))
        lower_text = full_text.lower()

        # 1. Check for specific rare terms
        matched_terms = []
        for term in UNUSUAL_LEGAL_TERMS:
            if term.lower() in lower_text:
                matched_terms.append(term)

        if matched_terms:
            # Find a short quote around the first matched term
            first_term = matched_terms[0]
            pos = lower_text.find(first_term.lower())
            start_snippet = max(0, pos - 40)
            end_snippet = min(len(full_text), pos + len(first_term) + 50)
            snippet = full_text[start_snippet:end_snippet].strip()
            
            alerts.append({
                "clause_id": clause_id,
                "clause_heading": heading,
                "term": ", ".join(matched_terms),
                "context_snippet": f"...{snippet}..." if start_snippet > 0 else f"{snippet}...",
                "reason": "Unusual wording, review manually",
                "details": f"Contains complex archaic phrases: {', '.join(matched_terms)}"
            })
        elif category == "Unclassified" and len(full_text) > 120 and confidence == 0.0:
            # 2. Low-similarity / anomalous clause
            alerts.append({
                "clause_id": clause_id,
                "clause_heading": heading,
                "term": "Non-standard text structure",
                "context_snippet": full_text[:100] + ("..." if len(full_text) > 100 else ""),
                "reason": "Unusual wording, review manually",
                "details": "Clause does not match any recognized standard commercial clause taxonomy."
            })

    return alerts


def normalize_text_for_comparison(text: str) -> str:
    """Normalize text by stripping non-alphanumeric chars and extra whitespace."""
    clean = re.sub(r'[^\w\s]', ' ', text.lower())
    return " ".join(clean.split())


def find_duplicate_clauses(clauses: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, str]]]:
    """
    Identifies identical or near-identical clauses appearing across multiple sections.
    Returns a mapping: primary_clause_id -> list of {'clause_id': ..., 'heading': ...}
    """
    duplicate_map: Dict[str, List[Dict[str, str]]] = {}
    already_grouped = set()

    normalized = []
    for c in clauses:
        norm = normalize_text_for_comparison(c["full_text"])
        normalized.append((c["clause_id"], c["heading"], norm))

    for i in range(len(normalized)):
        c1_id, c1_heading, norm1 = normalized[i]
        if c1_id in already_grouped or len(norm1) < 40:
            continue

        for j in range(i + 1, len(normalized)):
            c2_id, c2_heading, norm2 = normalized[j]
            if c2_id in already_grouped or len(norm2) < 40:
                continue

            # Compare normalized text similarity
            similarity = SequenceMatcher(None, norm1, norm2).ratio()
            if similarity >= 0.85:
                if c1_id not in duplicate_map:
                    duplicate_map[c1_id] = []
                duplicate_map[c1_id].append({
                    "clause_id": c2_id,
                    "heading": c2_heading
                })
                already_grouped.add(c2_id)

    return duplicate_map


def evaluate_no_match(findings: List[Any]) -> Dict[str, Any]:
    """
    Edge case: No matching risk pattern found.
    Returns clear explicit notice that the absence of findings does not guarantee safety.
    """
    if len(findings) == 0:
        return {
            "no_match_found": True,
            "no_match_message": "No matching risk pattern found. This does not mean the contract is safe. A qualified legal professional should still review the contract."
        }
    return {
        "no_match_found": False,
        "no_match_message": None
    }
