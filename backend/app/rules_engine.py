import json
import re
import uuid
import copy
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import RULES_PATH


# Default rules fallback in case rules.json is ever missing or corrupted
DEFAULT_RULES_BACKUP = []


class RulesEngine:
    def __init__(self, rules_file_path: Path = RULES_PATH):
        self.rules_path = rules_file_path
        self.rules: List[Dict[str, Any]] = []
        self.load_rules()

    def load_rules(self):
        global DEFAULT_RULES_BACKUP
        if self.rules_path.exists():
            try:
                with open(self.rules_path, "r", encoding="utf-8") as f:
                    self.rules = json.load(f)
                    if not DEFAULT_RULES_BACKUP and self.rules:
                        DEFAULT_RULES_BACKUP = copy.deepcopy(self.rules)
                    return
            except Exception as e:
                print(f"Error loading {self.rules_path}: {e}")
        
        if DEFAULT_RULES_BACKUP:
            self.rules = copy.deepcopy(DEFAULT_RULES_BACKUP)
        else:
            self.rules = []

    def save_rules(self):
        with open(self.rules_path, "w", encoding="utf-8") as f:
            json.dump(self.rules, f, indent=2)

    def get_rules(self) -> List[Dict[str, Any]]:
        return self.rules

    def get_rule_by_id(self, rule_id: str) -> Optional[Dict[str, Any]]:
        for r in self.rules:
            if r["id"] == rule_id:
                return r
        return None

    def add_rule(self, rule_data: Dict[str, Any]) -> Dict[str, Any]:
        rule_id = rule_data.get("id") or f"rule_{uuid.uuid4().hex[:8]}"
        new_rule = {
            "id": rule_id,
            "name": rule_data["name"],
            "category": rule_data.get("category", "General"),
            "severity": rule_data.get("severity", "Medium"),
            "pattern_type": rule_data.get("pattern_type", "regex"),
            "patterns": rule_data.get("patterns", []),
            "enabled": rule_data.get("enabled", True),
            "explanation": rule_data.get("explanation", "")
        }
        self.rules.append(new_rule)
        self.save_rules()
        return new_rule

    def update_rule(self, rule_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for i, r in enumerate(self.rules):
            if r["id"] == rule_id:
                for key, val in updates.items():
                    if val is not None:
                        self.rules[i][key] = val
                self.save_rules()
                return self.rules[i]
        return None

    def delete_rule(self, rule_id: str) -> bool:
        before_len = len(self.rules)
        self.rules = [r for r in self.rules if r["id"] != rule_id]
        if len(self.rules) < before_len:
            self.save_rules()
            return True
        return False

    def reset_rules(self) -> List[Dict[str, Any]]:
        global DEFAULT_RULES_BACKUP
        if DEFAULT_RULES_BACKUP:
            self.rules = copy.deepcopy(DEFAULT_RULES_BACKUP)
            self.save_rules()
        return self.rules

    @staticmethod
    def extract_matched_sentence(text: str, match_obj) -> str:
        """
        Extracts the sentence containing the match.
        Falls back to a snippet around the match if sentence boundaries are irregular.
        """
        match_start = match_obj.start()
        match_end = match_obj.end()

        # Split text into sentences using period, semicolon, newline, colon
        sentence_delims = [m.start() for m in re.finditer(r'(?<=[\.\;\:\n])\s+', text)]
        start_bound = 0
        end_bound = len(text)

        for d in sentence_delims:
            if d <= match_start:
                start_bound = max(start_bound, d)
            elif d >= match_end:
                end_bound = min(end_bound, d)
                break

        sentence = text[start_bound:end_bound].strip()
        if len(sentence) < 15 or len(sentence) > 500:
            # Fallback snippet
            s = max(0, match_start - 50)
            e = min(len(text), match_end + 50)
            return text[s:e].strip()
        return sentence

    def evaluate_clauses(
        self,
        clauses: List[Dict[str, Any]],
        duplicate_map: Optional[Dict[str, List[Dict[str, str]]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluates all enabled rules against each clause.
        Produces findings with exact evidence quote, offsets, and explanation.
        """
        if duplicate_map is None:
            duplicate_map = {}

        findings: List[Dict[str, Any]] = []
        seen_clauses_for_rule = set()

        for rule in self.rules:
            if not rule.get("enabled", True):
                continue

            patterns = rule.get("patterns", [])
            pattern_type = rule.get("pattern_type", "regex")
            compiled_patterns = []

            for pat in patterns:
                try:
                    if pattern_type == "regex":
                        compiled_patterns.append(re.compile(pat, re.IGNORECASE | re.DOTALL))
                    else:
                        escaped = re.escape(pat)
                        compiled_patterns.append(re.compile(r'\b' + escaped + r'\b', re.IGNORECASE))
                except re.error:
                    continue

            for clause in clauses:
                clause_id = clause["clause_id"]
                rule_key = f"{rule['id']}_{clause_id}"
                if rule_key in seen_clauses_for_rule:
                    continue

                clause_text = clause["full_text"]
                heading = clause["heading"]
                search_text = f"{heading}\n{clause_text}"

                matched_quote = None
                matched_offset_start = clause["start_char"]
                matched_offset_end = clause["end_char"]

                for cpat in compiled_patterns:
                    match = cpat.search(clause_text)
                    if match:
                        matched_quote = self.extract_matched_sentence(clause_text, match)
                        
                        # Find quote relative position in clause_text
                        q_pos = clause_text.find(matched_quote)
                        if q_pos != -1:
                            matched_offset_start = clause["start_char"] + q_pos
                            matched_offset_end = matched_offset_start + len(matched_quote)
                        else:
                            # Use match position
                            matched_offset_start = clause["start_char"] + match.start()
                            matched_offset_end = clause["start_char"] + match.end()
                        break

                if matched_quote:
                    seen_clauses_for_rule.add(rule_key)
                    also_appears = duplicate_map.get(clause_id, [])

                    finding = {
                        "id": f"find_{uuid.uuid4().hex[:8]}",
                        "rule_id": rule["id"],
                        "rule_name": rule["name"],
                        "category": rule["category"],
                        "severity": rule["severity"],
                        "clause_id": clause_id,
                        "clause_heading": heading,
                        "evidence_quote": matched_quote,
                        "start_char": matched_offset_start,
                        "end_char": matched_offset_end,
                        "explanation": rule["explanation"],
                        "also_appears_in": also_appears,
                        "review_status": "Unreviewed",
                        "reviewer_note": "",
                        "reviewed_at": None
                    }
                    findings.append(finding)

        return findings


# Global rules engine singleton
rules_engine = RulesEngine()
