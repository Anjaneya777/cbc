import re
from typing import Tuple, Dict, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


CATEGORIES = [
    "Termination",
    "Payment",
    "Penalties",
    "Renewal",
    "Liability",
    "Indemnity",
    "Confidentiality",
    "IP",
    "Non-compete/Exclusivity",
    "Governing law/Disputes",
    "Unilateral changes",
    "Data/Privacy",
]

CATEGORY_EXEMPLARS: Dict[str, List[str]] = {
    "Termination": [
        "termination cancellation terminate agreement termination without cause termination for convenience notice of termination expire expiry",
        "either party may terminate this agreement upon written notice right to cancel breach termination remedy end of term",
        "early termination grounds for termination survival upon termination immediate termination"
    ],
    "Payment": [
        "payment terms invoice invoices payable net 30 net 60 compensation fees rate expenses billing wire transfer taxes non-refundable",
        "fees and consideration client shall pay consultant agreed sum charges milestone payments reimbursement of expenses",
        "invoicing frequency late payment schedule payment instructions currency bank details"
    ],
    "Penalties": [
        "liquidated damages penalty delay penalties default interest late fee forfeiture of deposit financial deduction penalty clause",
        "breach penalty fee punitive assessment compensatory penalty per day delay payment penalty",
        "remedy and liquidated assessment fine for non-compliance forfeiture of advance"
    ],
    "Renewal": [
        "automatic renewal evergreen renew automatically successive terms renewal notice period extension of term roll over",
        "shall automatically renew for additional periods of one year unless notice of non-renewal is provided",
        "contract term extension evergreen renewal duration continued term"
    ],
    "Liability": [
        "limitation of liability limit of liability aggregate liability cap consequential damages indirect lost profits disclaimer of damages",
        "neither party shall be liable for special incidental punitive or indirect damages maximum total liability under this agreement",
        "exclusion of liability aggregate recovery monetary limitation no liability for indirect losses"
    ],
    "Indemnity": [
        "indemnification indemnify defend hold harmless against all claims losses damages liabilities attorneys fees third party demands",
        "party agrees to defend indemnify and hold harmless from and against any and all claims suits or damages",
        "indemnity obligation defense of claims third-party indemnification hold harmless"
    ],
    "Confidentiality": [
        "confidential information non-disclosure proprietary information trade secrets non-disclosure agreement disclosure restrictions perpetual confidentiality",
        "recipient shall keep confidential all non-public technical business proprietary data secret obligations",
        "duty of confidentiality return or destruction of materials survive termination indefinitely"
    ],
    "IP": [
        "intellectual property patent copyright trademark work made for hire inventions assignment of rights moral rights ownership of deliverables",
        "all rights title and interest in work product background ip pre-existing materials license grant proprietary assets",
        "ownership of inventions copyright assignment software code trademarks patents"
    ],
    "Non-compete/Exclusivity": [
        "non-compete non-solicitation covenant not to compete exclusivity exclusive provider restriction on competitive activities",
        "shall not directly or indirectly engage in competitive business solicit employees clients or customers",
        "restrictive covenants territorial restriction exclusive dealing sole vendor non-solicitation agreement"
    ],
    "Governing law/Disputes": [
        "governing law jurisdiction applicable law dispute resolution arbitration venue court litigation jury trial waiver laws of state",
        "this agreement shall be governed by and construed in accordance with the laws of jurisdiction courts shall have exclusive venue",
        "binding arbitration dispute settlement legal proceedings submission to jurisdiction"
    ],
    "Unilateral changes": [
        "unilateral amendment right to modify change terms amend agreement at sole discretion update terms without notice reservation of rights",
        "reserves the right to alter change or revise these terms and conditions from time to time at its discretion",
        "modification of terms unilateral changes periodic revision policy updates"
    ],
    "Data/Privacy": [
        "data protection personal data privacy gdpr security breach processing of data customer data controller processor privacy policy",
        "confidential personal information data subject rights data transfer safeguards security measures commercialization of data",
        "data privacy compliance data protection legislation processing activities"
    ],
}

CATEGORY_REGEX_RULES = {
    "Termination": re.compile(r'(?i)\b(terminat|cancell|expir|notice of termination|end of agreement)\b'),
    "Payment": re.compile(r'(?i)\b(fee|fees|payment|invoice|payable|remuneration|compensation|net \d+|pricing)\b'),
    "Penalties": re.compile(r'(?i)\b(liquidated damage|penalt|forfeit|late fee|default interest)\b'),
    "Renewal": re.compile(r'(?i)\b(auto(?:matic)?[- ]renew|evergreen|successive (?:term|year)|renew automatically)\b'),
    "Liability": re.compile(r'(?i)\b(limitation of liability|consequential damage|aggregate liability|cap on liability|unlimited liability)\b'),
    "Indemnity": re.compile(r'(?i)\b(indemnif|hold harmless|defend,? indemnify)\b'),
    "Confidentiality": re.compile(r'(?i)\b(confidential|non-disclosure|proprietary information|trade secret)\b'),
    "IP": re.compile(r'(?i)\b(intellectual property|work made for hire|patent|copyright|moral right|assignment of invention)\b'),
    "Non-compete/Exclusivity": re.compile(r'(?i)\b(non-compete|covenant not to compete|exclusiv|non-solicit)\b'),
    "Governing law/Disputes": re.compile(r'(?i)\b(governing law|jurisdiction|dispute resolution|arbitration|venue|jury trial)\b'),
    "Unilateral changes": re.compile(r'(?i)\b(unilateral|right to modify|amend (?:this|the) (?:agreement|terms)|change terms (?:at|without))\b'),
    "Data/Privacy": re.compile(r'(?i)\b(personal data|data protection|privacy|gdpr|data security|user data)\b'),
}


class HybridCategorizer:
    def __init__(self):
        corpus = []
        self.doc_categories = []
        for cat in CATEGORIES:
            exemplars = CATEGORY_EXEMPLARS[cat]
            combined = " ".join(exemplars)
            corpus.append(combined)
            self.doc_categories.append(cat)

        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        self.category_vectors = self.vectorizer.fit_transform(corpus)

    def categorize(self, heading: str, text: str) -> Tuple[str, float]:
        """
        Categorizes a clause using hybrid Regex + TF-IDF similarity.
        Returns: (category, confidence_score)
        """
        combined_text = f"{heading} {heading} {text}"
        
        # 1. First test headings for high-confidence regex match
        heading_matches = []
        for cat, regex in CATEGORY_REGEX_RULES.items():
            if regex.search(heading):
                heading_matches.append(cat)

        # 2. Compute TF-IDF similarity against all categories
        vec = self.vectorizer.transform([combined_text])
        sims = cosine_similarity(vec, self.category_vectors)[0]
        
        top_idx = sims.argmax()
        top_sim = float(sims[top_idx])
        top_cat = self.doc_categories[top_idx]

        # 3. Hybrid decision logic
        if heading_matches:
            # If the heading explicitly matched one of the categories
            if top_cat in heading_matches:
                # Strong match on both heading and body text
                return top_cat, round(max(top_sim, 0.85), 2)
            else:
                # Heading matched, give heading priority if body similarity isn't overwhelming
                return heading_matches[0], round(max(top_sim, 0.75), 2)

        # 4. Body regex checks if no heading match
        body_matches = [cat for cat, regex in CATEGORY_REGEX_RULES.items() if regex.search(text)]
        if top_sim >= 0.12:
            confidence = round(min(1.0, top_sim * 2.0), 2)
            return top_cat, confidence
        elif body_matches:
            return body_matches[0], 0.60
        else:
            return "Unclassified", 0.0


# Global singleton instance
categorizer = HybridCategorizer()
