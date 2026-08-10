"""Contratos de transporte para guardar y aprobar revisiones clínicas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from src.application.schemas.medical_information import MedicalInformationResponse

ReviewFieldStatus = Literal["pending_review", "approved", "corrected", "rejected"]
ReviewDocumentStatus = Literal["reviewing", "approved"]


class ReviewedFieldRequest(BaseModel):
    """Campo revisado por un profesional de salud."""

    field: str = Field(min_length=1)
    original_value: str = Field(min_length=1)
    value: str = Field(min_length=1)
    status: ReviewFieldStatus
    source_text: str = Field(min_length=1)
    match_type: str = Field(min_length=1)
    page: int | None = Field(default=None, ge=1)
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class DocumentReviewRequest(BaseModel):
    """Snapshot de revisión enviado desde la interfaz humana."""

    fields: list[ReviewedFieldRequest] = Field(min_length=1)
    reviewed_by: str | None = Field(default=None, min_length=1)


class DocumentReviewSummaryResponse(BaseModel):
    """Resumen clínico y operacional de la revisión guardada."""

    total_fields: int = Field(ge=0)
    pending_fields: int = Field(ge=0)
    approved_fields: int = Field(ge=0)
    corrected_fields: int = Field(ge=0)
    rejected_fields: int = Field(ge=0)


class DocumentReviewResponse(BaseModel):
    """Respuesta estable para la UI de revisión y para la futura persistencia real."""

    document_id: str
    status: ReviewDocumentStatus
    reviewed_at: datetime
    reviewed_by: str | None = None
    patient_name: str | None = None
    summary: DocumentReviewSummaryResponse
    parsed_information: MedicalInformationResponse
