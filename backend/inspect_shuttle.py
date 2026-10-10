import sqlite3
import json

conn = sqlite3.connect("contract_reviews.db")
cursor = conn.cursor()

cursor.execute("SELECT id, filename, raw_text FROM contracts WHERE id = 'cnt_e4c72e86'")
contract = cursor.fetchone()
if not contract:
    print("Contract not found")
    exit()

print(f"Contract: {contract[0]}, {contract[1]}, text len: {len(contract[2])}")
print("--- FIRST 1000 CHARACTERS ---")
print(contract[2][:1000])

cursor.execute("SELECT clause_id, heading, substr(full_text, 1, 100), category FROM clauses WHERE contract_id = 'cnt_e4c72e86'")
clauses = cursor.fetchall()
print(f"\nTotal clauses extracted: {len(clauses)}")
for c in clauses[:10]:
    print(c)

cursor.execute("SELECT * FROM findings WHERE contract_id = 'cnt_e4c72e86'")
findings = cursor.fetchall()
print(f"\nTotal findings: {len(findings)}")

cursor.execute("SELECT * FROM missing_checks WHERE contract_id = 'cnt_e4c72e86'")
missing = cursor.fetchall()
print(f"\nMissing checks: {len(missing)}")
for m in missing:
    print(m)
