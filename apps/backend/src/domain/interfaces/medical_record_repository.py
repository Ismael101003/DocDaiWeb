from typing import Protocol
from uuid import UUID

from src.domain.entities.patient_medical_record import PatientMedicalRecord


class MedicalRecordRepository(Protocol):
    def save(self, *, record: PatientMedicalRecord) -> None: ...
    def get(self, *, patient_id: UUID) -> PatientMedicalRecord | None: ...
