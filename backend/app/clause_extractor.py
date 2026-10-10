import re
from typing import List, Dict, Any


HEADING_PATTERN = re.compile(
    r'(?m)^[ \t]*('
    # Pattern A: Section / Article / Clause + number/roman
    r'(?:(?:SECTION|Section|ARTICLE|Article|CLAUSE|Clause)\s+(?:[0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)[\.\:\-]?[ \t]*[^\n\r]*)'
    r'|'
    # Pattern B: Numbered headings like 1. / 1.1 / 2.3.4 + title
    r'(?:[0-9]+(?:\.[0-9]+)*\.?[ \t]+[A-Z][^\n\r]*)'
    r'|'
    # Pattern C: ALL-CAPS headings on a line by itself (e.g., TERMINATION, LIMITATION OF LIABILITY)
    r'(?:[A-Z0-9\s\-_,\:\(\)]{4,60})(?=\s*\n)'
    r')[ \t]*$'
)

# Filter for pure all-caps headings so we don't accidentally match normal lines
ALL_CAPS_LINE_PATTERN = re.compile(r'^[A-Z0-9\s\-_,\:\(\)\.]{4,60}$')


def extract_clauses(raw_text: str) -> List[Dict[str, Any]]:
    """
    Extracts clauses from raw contract text.
    Identifies numbered headings (1., 1.1, Section 2, Article III),
    ALL-CAPS headings, and falls back to paragraphs.
    Preserves exact character offsets (start_char, end_char), heading, and full text.
    """
    if not raw_text or not raw_text.strip():
        return []

    lines = raw_text.splitlines(keepends=True)
    heading_matches = []
    
    current_offset = 0
    for line in lines:
        stripped_line = line.strip()
        line_length = len(line)
        
        # Check if line matches structured heading
        if stripped_line:
            is_heading = False
            heading_text = stripped_line
            
            # Check 1: Section / Article / Clause pattern
            if re.match(r'^(?:SECTION|Section|ARTICLE|Article|CLAUSE|Clause)\s+(?:[0-9]+|[IVXLCDM]+)', stripped_line, re.IGNORECASE):
                is_heading = True
            # Check 2: Numbered dot pattern: e.g., "1. Scope", "2.1 Payment Terms"
            elif re.match(r'^[0-9]+(?:\.[0-9]+)*\.?\s+[A-Z]', stripped_line):
                is_heading = True
            # Check 3: Short ALL-CAPS line (min 4 chars, max 60 chars, mostly letters)
            elif (
                len(stripped_line) <= 60 
                and ALL_CAPS_LINE_PATTERN.match(stripped_line)
                and sum(1 for c in stripped_line if c.isalpha()) >= 4
                and stripped_line == stripped_line.upper()
                and not stripped_line.endswith(('.', ';', ','))
            ):
                is_heading = True

            if is_heading:
                heading_matches.append({
                    "heading": heading_text,
                    "start": current_offset,
                    "end": current_offset + line_length
                })

        current_offset += line_length

    clauses = []

    # If we found at least 2 structured headings, slice by headings
    if len(heading_matches) >= 2:
        # Check if there is introductory text before the first heading
        first_h = heading_matches[0]
        if first_h["start"] > 0 and raw_text[:first_h["start"]].strip():
            intro_text = raw_text[:first_h["start"]]
            clauses.append({
                "clause_id": "clause_0",
                "heading": "Preamble & Recitals",
                "full_text": intro_text.strip(),
                "start_char": 0,
                "end_char": first_h["start"]
            })

        for i, h in enumerate(heading_matches):
            clause_id = f"clause_{len(clauses) + 1}"
            start = h["start"]
            end = heading_matches[i + 1]["start"] if (i + 1 < len(heading_matches)) else len(raw_text)
            clause_content = raw_text[start:end]

            clauses.append({
                "clause_id": clause_id,
                "heading": h["heading"],
                "full_text": clause_content.strip(),
                "start_char": start,
                "end_char": end
            })
    else:
        # Fallback to paragraph splitting by double newlines
        para_pattern = re.compile(r'(?:\r?\n\s*){2,}')
        parts = []
        last_pos = 0
        for match in para_pattern.finditer(raw_text):
            chunk = raw_text[last_pos:match.start()]
            if chunk.strip():
                parts.append((last_pos, match.start(), chunk))
            last_pos = match.end()
        if last_pos < len(raw_text):
            chunk = raw_text[last_pos:]
            if chunk.strip():
                parts.append((last_pos, len(raw_text), chunk))

        if not parts:
            # Single paragraph contract
            parts = [(0, len(raw_text), raw_text)]

        for idx, (p_start, p_end, p_text) in enumerate(parts, start=1):
            first_line = p_text.strip().splitlines()[0][:60]
            clauses.append({
                "clause_id": f"clause_{idx}",
                "heading": f"Section {idx}: {first_line}" if len(first_line) > 5 else f"Paragraph {idx}",
                "full_text": p_text.strip(),
                "start_char": p_start,
                "end_char": p_end
            })

    return clauses
