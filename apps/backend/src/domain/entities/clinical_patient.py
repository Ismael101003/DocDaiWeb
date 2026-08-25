"""Entidad persistible de paciente para el expediente clínico en memoria."""

from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass(frozen=True)
class ClinicalPatient:
    id: UUID
    name: str | None
    age: int | None
    date_of_birth: date | None
    curp: str | None
    nss: str | None
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
