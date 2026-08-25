from __future__ import annotations

from threading import Lock
import unicodedata
from datetime import date
from uuid import UUID

from src.domain.entities.clinical_patient import ClinicalPatient


def normalize_name(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.casefold())
    return " ".join("".join(char for char in normalized if not unicodedata.combining(char)).split())


class InMemoryPatientRepository:
    def __init__(self) -> None:
        self._patients: dict[UUID, ClinicalPatient] = {}
        self._lock = Lock()

    def save(self, *, patient: ClinicalPatient) -> None:
        with self._lock: self._patients[patient.id] = patient
    def get(self, *, patient_id: UUID) -> ClinicalPatient | None:
        with self._lock: return self._patients.get(patient_id)
    def list(self) -> list[ClinicalPatient]:
        with self._lock: return list(self._patients.values())
    def find_by_curp(self, *, curp: str) -> list[ClinicalPatient]:
        return [item for item in self.list() if item.curp == curp]
    def find_by_nss(self, *, nss: str) -> list[ClinicalPatient]:
        return [item for item in self.list() if item.nss == nss]
    def find_by_name_and_date_of_birth(self, *, name: str, date_of_birth: date) -> list[ClinicalPatient]:
        normalized = normalize_name(name)
        return [item for item in self.list() if item.date_of_birth == date_of_birth and item.name and normalize_name(item.name) == normalized]
    def find_by_normalized_name(self, *, name: str) -> list[ClinicalPatient]:
        normalized = normalize_name(name)
        return [item for item in self.list() if item.name and normalize_name(item.name) == normalized]
