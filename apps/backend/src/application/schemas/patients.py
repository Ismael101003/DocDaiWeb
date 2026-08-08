"""Contratos de aplicación para pacientes."""

from uuid import UUID

from pydantic import BaseModel, Field


class PatientResponse(BaseModel):
    """Resumen seguro del paciente; los detalles clínicos quedan fuera del contrato de transporte."""

    id: UUID
    full_name: str = Field(min_length=2, max_length=120)


class PatientListResponse(BaseModel):
    """Respuesta de colección usada hasta implementar un repositorio de pacientes."""

    items: list[PatientResponse] = Field(default_factory=list)
