import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BASE_DIR.parent

RULES_PATH = Path(os.getenv("RULES_PATH", str(BASE_DIR / "rules.json")))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'contract_reviews.db'}")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

LEGAL_DISCLAIMER = "This tool highlights clauses for human review. It is not legal advice."
