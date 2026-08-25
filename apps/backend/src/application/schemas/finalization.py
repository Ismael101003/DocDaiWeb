from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from src.application.schemas.medical_information import MedicationResponse


class ClinicalPatientResponse(BaseModel):
    id: UUID
    name: str | None
    age: int | None
    date_of_birth: date | None
    curp: str | None
    nss: str | None
    created_at: datetime
    updated_at: datetime


class PatientMedicalRecordResponse(BaseModel):
    patient_id: UUID
    diagnoses: list[str]
    medications: list[MedicationResponse]
    dates: list[str]
    doctors: list[str]
    institutions: list[str]
    documents: list[str]
    updated_at: datetime | None


class FinalizeDocumentResponse(BaseModel):
    document_id: str
    patient: ClinicalPatientResponse | None = None
    record: PatientMedicalRecordResponse | None = None
    action: Literal["created", "updated", "ambiguous_match"]
    status: Literal["finalized", "ambiguous_match"]
    match_identifier: str | None = None


class FinalizeDocumentRequest(BaseModel):
    """Selección opcional de un expediente ya conocido para finalizar un documento."""

    patient_id: UUID | None = None
