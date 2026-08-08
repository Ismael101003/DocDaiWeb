"""Contratos de aplicación para profesionales de la salud."""

from uuid import UUID

from pydantic import BaseModel, Field


class DoctorResponse(BaseModel):
    """Resumen mínimo del profesional."""

    id: UUID
    full_name: str = Field(min_length=2, max_length=120)


class DoctorListResponse(BaseModel):
    """Respuesta de colección para la futura integración del repositorio de profesionales."""

    items: list[DoctorResponse] = Field(default_factory=list)
