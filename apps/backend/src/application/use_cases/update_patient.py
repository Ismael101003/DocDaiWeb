"""Corrige datos administrativos de un paciente sin modificar su expediente clínico."""

from dataclasses import replace
from datetime import datetime, timezone
from uuid import UUID

from src.application.schemas.patients import PatientUpdateRequest
from src.domain.entities.clinical_patient import ClinicalPatient
from src.domain.interfaces.patient_repository import PatientRepository


class PatientNotFoundError(Exception):
    pass


class UpdatePatientUseCase:
    def __init__(self, *, patient_repository: PatientRepository) -> None:
        self._patient_repository = patient_repository

    def execute(self, *, patient_id: UUID, request: PatientUpdateRequest) -> ClinicalPatient:
        patient = self._patient_repository.get(patient_id=patient_id)
        if patient is None or not patient.is_active:
            raise PatientNotFoundError("El paciente no existe.")
        updates = request.model_dump(exclude_unset=True)
        updated_patient = replace(patient, **updates, updated_at=datetime.now(timezone.utc))
        self._patient_repository.save(patient=updated_patient)
        return updated_patient
