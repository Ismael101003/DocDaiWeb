"""Lista y autoriza documentos originales asociados a un expediente."""

from pathlib import Path
from uuid import UUID

from src.domain.interfaces.medical_record_repository import MedicalRecordRepository
from src.domain.interfaces.patient_repository import PatientRepository
from src.domain.interfaces.temporary_document_storage import TemporaryDocumentStorage


class PatientDocumentsNotFoundError(Exception):
    pass


class ListPatientDocumentsUseCase:
    def __init__(self, *, patient_repository: PatientRepository, medical_record_repository: MedicalRecordRepository, document_storage: TemporaryDocumentStorage) -> None:
        self._patient_repository = patient_repository
        self._medical_record_repository = medical_record_repository
        self._document_storage = document_storage

    def execute(self, *, patient_id: UUID) -> list[tuple[str, Path]]:
        patient = self._patient_repository.get(patient_id=patient_id)
        if patient is None or not patient.is_active:
            raise PatientDocumentsNotFoundError("El paciente no existe.")
        record = self._medical_record_repository.get(patient_id=patient_id)
        if record is None:
            return []
        documents: list[tuple[str, Path]] = []
        for document_id in record.documents:
            try:
                documents.append((document_id, self._document_storage.get_path(document_id=document_id)))
            except FileNotFoundError:
                continue
        return documents

    def get_original(self, *, patient_id: UUID, document_id: str) -> Path:
        documents = dict(self.execute(patient_id=patient_id))
        document = documents.get(document_id)
        if document is None:
            raise PatientDocumentsNotFoundError("El documento no pertenece al expediente o ya no está disponible.")
        return document
