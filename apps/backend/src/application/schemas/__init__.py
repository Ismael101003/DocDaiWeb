"""Esquemas Pydantic de la capa de aplicación."""

from src.application.schemas.medical_information import (
    ExtractionEvidenceResponse,
    MedicalInformationResponse,
    MedicationResponse,
    PatientInformationResponse,
)
from src.application.schemas.document_review import (
    DocumentReviewRequest,
    DocumentReviewResponse,
    DocumentReviewSummaryResponse,
    ReviewedFieldRequest,
)

__all__ = [
    "ExtractionEvidenceResponse",
    "DocumentReviewRequest",
    "DocumentReviewResponse",
    "DocumentReviewSummaryResponse",
    "MedicalInformationResponse",
    "MedicationResponse",
    "PatientInformationResponse",
    "ReviewedFieldRequest",
]
