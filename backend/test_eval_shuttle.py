import sqlite3
from app.rules_engine import rules_engine
from app.categorizer import categorizer

conn = sqlite3.connect("contract_reviews.db")
cursor = conn.cursor()
cursor.execute("SELECT clause_id, heading, full_text, category, start_char, end_char FROM clauses WHERE contract_id = 'cnt_e4c72e86'")
clauses = []
for cid, heading, text, cat, sc, ec in cursor.fetchall():
    clauses.append({
        "clause_id": cid,
        "heading": heading,
        "full_text": text,
        "category": cat,
        "start_char": sc,
        "end_char": ec
    })

print(f"Loaded {len(clauses)} clauses from DB")

findings = rules_engine.evaluate_clauses(clauses)
print(f"\nRules engine evaluated findings: {len(findings)}")
for f in findings:
    print(f"- [{f['severity']}] {f['rule_name']} in {f['clause_heading']}: {f['evidence_quote']}")
