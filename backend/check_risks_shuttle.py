import sqlite3

conn = sqlite3.connect("contract_reviews.db")
cursor = conn.cursor()
cursor.execute("SELECT raw_text FROM contracts WHERE id = 'cnt_e4c72e86'")
raw_text = cursor.fetchone()[0]

print("--- SEARCHING FOR RISK KEYWORDS IN SHUTTLE PDF ---")
keywords = ["indemnif", "terminate", "hold harmless", "insurance", "damages", "breach", "liability", "audit", "assign", "waiver", "warranty", "penalty", "sole discretion", "without cause", "notice"]
for kw in keywords:
    count = raw_text.lower().count(kw)
    print(f"'{kw}': {count} occurrences")

print("\n--- SAMPLE SECTIONS CONTAINING INDEMNIF / TERMINAT ---")
import re
for m in re.finditer(r"(?:indemnif|terminate|hold harmless|liability)[^\.\n]*[\.\n]", raw_text, re.IGNORECASE):
    print("-", m.group(0).strip())
