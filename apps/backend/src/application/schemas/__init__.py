"""Esquemas Pydantic de la capa de aplicación."""

from src.application.schemas.medical_information import (
    ExtractionEvidenceResponse,
    MedicalInformationResponse,
    MedicationResponse,
    PatientInformationResponse,
)

__all__ = [
    "ExtractionEvidenceResponse",
    "MedicalInformationResponse",
    "MedicationResponse",
    "PatientInformationResponse",
]
