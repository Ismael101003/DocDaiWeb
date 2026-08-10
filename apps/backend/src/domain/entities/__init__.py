"""Entidades de dominio independientes de frameworks y transporte."""

from src.domain.entities.document_review import DocumentReview, ReviewedField
from src.domain.entities.medical_record import ExtractionEvidence, MedicalRecord, Medication, Patient

__all__ = [
	"DocumentReview",
	"ReviewedField",
	"ExtractionEvidence",
	"MedicalRecord",
	"Medication",
	"Patient",
]
