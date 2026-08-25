"""Contratos de aplicación para pacientes."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PatientResponse(BaseModel):
    """Resumen seguro del paciente; los detalles clínicos quedan fuera del contrato de transporte."""

    id: UUID
    full_name: str = Field(min_length=2, max_length=120)
    age: int | None = None
    date_of_birth: date | None = None
    curp: str | None = None
    nss: str | None = None


class PatientListResponse(BaseModel):
    """Respuesta de colección usada hasta implementar un repositorio de pacientes."""

    items: list[PatientResponse] = Field(default_factory=list)


class PatientUpdateRequest(BaseModel):
    """Datos administrativos que un profesional puede corregir tras validar OCR."""

    name: str | None = Field(default=None, min_length=2, max_length=120)
    age: int | None = Field(default=None, ge=0, le=130)
    date_of_birth: date | None = None
    curp: str | None = Field(default=None, max_length=18)
    nss: str | None = Field(default=None, max_length=20)


class PatientDocumentResponse(BaseModel):
    document_id: str
    filename: str
    created_at: datetime | None = None


class PatientDocumentListResponse(BaseModel):
    items: list[PatientDocumentResponse] = Field(default_factory=list)
