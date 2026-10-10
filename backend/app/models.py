import json
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class ContractModel(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    clauses = relationship("ClauseModel", back_populates="contract", cascade="all, delete-orphan")
    findings = relationship("FindingModel", back_populates="contract", cascade="all, delete-orphan")
    missing_items = relationship("MissingCheckModel", back_populates="contract", cascade="all, delete-orphan")


class ClauseModel(Base):
    __tablename__ = "clauses"

    id = Column(String, primary_key=True, index=True)
    contract_id = Column(String, ForeignKey("contracts.id"), nullable=False)
    clause_id = Column(String, nullable=False)
    heading = Column(String, nullable=False)
    full_text = Column(Text, nullable=False)
    start_char = Column(Integer, nullable=False)
    end_char = Column(Integer, nullable=False)
    category = Column(String, default="Unclassified")
    confidence = Column(String, default="0.0")

    contract = relationship("ContractModel", back_populates="clauses")


class FindingModel(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, index=True)
    contract_id = Column(String, ForeignKey("contracts.id"), nullable=False)
    rule_id = Column(String, nullable=False)
    rule_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # High, Medium, Low
    clause_id = Column(String, nullable=False)
    clause_heading = Column(String, nullable=False)
    evidence_quote = Column(Text, nullable=False)
    start_char = Column(Integer, nullable=False, default=0)
    end_char = Column(Integer, nullable=False, default=0)
    explanation = Column(Text, nullable=False)
    also_appears_in = Column(Text, default="[]")  # JSON string of list of clause refs
    
    # Review details
    review_status = Column(String, default="Unreviewed")  # Unreviewed, Confirmed risk, Needs legal review, Not a concern
    reviewer_note = Column(Text, default="")
    reviewed_at = Column(DateTime, nullable=True)

    contract = relationship("ContractModel", back_populates="findings")

    def get_also_appears_in(self):
        try:
            return json.loads(self.also_appears_in) if self.also_appears_in else []
        except Exception:
            return []

    def set_also_appears_in(self, items):
        self.also_appears_in = json.dumps(items)


class MissingCheckModel(Base):
    __tablename__ = "missing_checks"

    id = Column(String, primary_key=True, index=True)
    contract_id = Column(String, ForeignKey("contracts.id"), nullable=False)
    item_name = Column(String, nullable=False)
    is_present = Column(Boolean, default=False)
    severity = Column(String, default="Medium")
    rationale = Column(Text, default="")

    contract = relationship("ContractModel", back_populates="missing_items")
