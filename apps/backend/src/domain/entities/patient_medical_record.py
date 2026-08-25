"""Expediente acumulativo asociado a un paciente."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from src.domain.entities.medical_record import Medication


@dataclass(frozen=True)
class PatientMedicalRecord:
    patient_id: UUID
    diagnoses: tuple[str, ...] = field(default_factory=tuple)
    medications: tuple[Medication, ...] = field(default_factory=tuple)
    dates: tuple[str, ...] = field(default_factory=tuple)
    doctors: tuple[str, ...] = field(default_factory=tuple)
    institutions: tuple[str, ...] = field(default_factory=tuple)
    documents: tuple[str, ...] = field(default_factory=tuple)
    updated_at: datetime | None = None
