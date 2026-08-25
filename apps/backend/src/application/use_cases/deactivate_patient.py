"""Desactiva un paciente sin eliminar trazabilidad clínica."""

from dataclasses import replace
from datetime import datetime, timezone
from uuid import UUID

from src.application.use_cases.update_patient import PatientNotFoundError
from src.domain.interfaces.patient_repository import PatientRepository


class DeactivatePatientUseCase:
    def __init__(self, *, patient_repository: PatientRepository) -> None:
        self._patient_repository = patient_repository

    def execute(self, *, patient_id: UUID) -> None:
        patient = self._patient_repository.get(patient_id=patient_id)
        if patient is None or not patient.is_active:
            raise PatientNotFoundError("El paciente no existe.")
        self._patient_repository.save(patient=replace(patient, is_active=False, updated_at=datetime.now(timezone.utc)))
