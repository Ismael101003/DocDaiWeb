from threading import Lock
from uuid import UUID

from src.domain.entities.patient_medical_record import PatientMedicalRecord


class InMemoryMedicalRecordRepository:
    def __init__(self) -> None:
        self._records: dict[UUID, PatientMedicalRecord] = {}
        self._lock = Lock()
    def save(self, *, record: PatientMedicalRecord) -> None:
        with self._lock: self._records[record.patient_id] = record
    def get(self, *, patient_id: UUID) -> PatientMedicalRecord | None:
        with self._lock: return self._records.get(patient_id)
