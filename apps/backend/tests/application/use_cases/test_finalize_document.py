"""Pruebas del caso de uso de finalización de documento y matching de paciente."""

import unittest
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from src.application.schemas.document_review import ReviewedFieldRequest
from src.application.schemas.medical_information import (
    ExtractionEvidenceResponse,
    MedicalInformationResponse,
    PatientInformationResponse,
)
from src.application.use_cases.finalize_document import (
    FinalizeDocumentConflictError,
    FinalizeDocumentNotFoundError,
    FinalizeDocumentPatientNotFoundError,
    FinalizeDocumentUseCase,
)
from src.domain.entities.clinical_patient import ClinicalPatient
from src.domain.entities.document_review import DocumentReview, ReviewedField
from src.infrastructure.storage.in_memory_document_finalization_storage import (
    InMemoryDocumentFinalizationStorage,
)
from src.infrastructure.storage.in_memory_document_review_storage import (
    InMemoryDocumentReviewStorage,
)
from src.infrastructure.storage.in_memory_medical_record_repository import (
    InMemoryMedicalRecordRepository,
)
from src.infrastructure.storage.in_memory_patient_repository import (
    InMemoryPatientRepository,
)


class FakeDocumentStorage:
    def __init__(self, exists: bool = True) -> None:
        self.exists = exists

    def get_path(self, *, document_id: str) -> Path:
        if not self.exists or document_id not in {"doc-1", "doc-2"}:
            raise FileNotFoundError(document_id)
        return Path("C:/tmp/doc-1.pdf")


class FakeParseUseCase:
    def execute(self, *, document_id: str) -> MedicalInformationResponse:
        return MedicalInformationResponse(
            patient=PatientInformationResponse(name="Mariana López", age=40),
            diagnoses=["Hipertensión"],
            medications=[],
            dates=[],
            doctor=None,
            institution=None,
            evidence=[
                ExtractionEvidenceResponse(
                    field="patient.name",
                    value="Mariana López",
                    source_text="Paciente: Mariana López",
                    match_type="explicit_label_or_section",
                    page=1,
                    confidence=0.95,
                    status="pending_review",
                )
            ],
        )


class FinalizeDocumentUseCaseTest(unittest.TestCase):
    def setUp(self) -> None:
        self.document_storage = FakeDocumentStorage(exists=True)
        self.parse_use_case = FakeParseUseCase()
        self.review_storage = InMemoryDocumentReviewStorage()
        self.patient_repository = InMemoryPatientRepository()
        self.medical_record_repository = InMemoryMedicalRecordRepository()
        self.finalization_storage = InMemoryDocumentFinalizationStorage()

        self.use_case = FinalizeDocumentUseCase(
            document_storage=self.document_storage,
            parse_use_case=self.parse_use_case,
            review_storage=self.review_storage,
            patient_repository=self.patient_repository,
            medical_record_repository=self.medical_record_repository,
            finalization_storage=self.finalization_storage,
        )

    def _approve_review(self, document_id: str) -> None:
        now = datetime.now(timezone.utc)
        self.review_storage.save(
            review=DocumentReview(
                document_id=document_id,
                status="approved",
                reviewed_at=now,
                reviewed_fields=(
                    ReviewedField(
                        field="patient.name",
                        original_value="Mariana López",
                        value="Mariana López",
                        status="approved",
                        source_text="Paciente: Mariana López",
                        match_type="explicit_label_or_section",
                    ),
                ),
                reviewed_by="doctor-1",
                patient_name="Mariana López",
            )
        )

    def test_raises_not_found_when_document_missing(self) -> None:
        use_case = FinalizeDocumentUseCase(
            document_storage=FakeDocumentStorage(exists=False),
            parse_use_case=self.parse_use_case,
            review_storage=self.review_storage,
            patient_repository=self.patient_repository,
            medical_record_repository=self.medical_record_repository,
            finalization_storage=self.finalization_storage,
        )
        with self.assertRaises(FinalizeDocumentNotFoundError):
            use_case.execute(document_id="doc-1")

    def test_raises_conflict_when_document_not_approved(self) -> None:
        with self.assertRaises(FinalizeDocumentConflictError):
            self.use_case.execute(document_id="doc-1")

    def test_creates_new_patient_when_no_match(self) -> None:
        now = datetime.now(timezone.utc)
        self.review_storage.save(
            review=DocumentReview(
                document_id="doc-1",
                status="approved",
                reviewed_at=now,
                reviewed_fields=(
                    ReviewedField(
                        field="patient.name",
                        original_value="Mariana López",
                        value="Mariana López",
                        status="approved",
                        source_text="Paciente: Mariana López",
                        match_type="explicit_label_or_section",
                    ),
                ),
                reviewed_by="doc-1",
                patient_name="Mariana López",
            )
        )

        response = self.use_case.execute(document_id="doc-1")
        self.assertEqual(response.action, "created")
        self.assertEqual(response.status, "finalized")

    def test_updates_existing_patient_when_curp_matches(self) -> None:
        now = datetime.now(timezone.utc)
        existing_patient = ClinicalPatient(
            id=uuid4(),
            name="Mariana López",
            age=40,
            date_of_birth=None,
            curp="LOPM800101HDFRR01",
            nss=None,
            created_at=now,
            updated_at=now,
        )
        self.patient_repository.save(patient=existing_patient)

        self.review_storage.save(
            review=DocumentReview(
                document_id="doc-1",
                status="approved",
                reviewed_at=now,
                reviewed_fields=(
                    ReviewedField(
                        field="patient.name",
                        original_value="Mariana López",
                        value="Mariana López",
                        status="approved",
                        source_text="Paciente: Mariana López",
                        match_type="explicit_label_or_section",
                    ),
                    ReviewedField(
                        field="patient.curp",
                        original_value="",
                        value="LOPM800101HDFRR01",
                        status="corrected",
                        source_text="CURP: LOPM800101HDFRR01",
                        match_type="explicit_label_or_section",
                    ),
                ),
                reviewed_by="doc-1",
                patient_name="Mariana López",
            )
        )

        response = self.use_case.execute(document_id="doc-1")
        self.assertEqual(response.action, "updated")
        self.assertEqual(response.match_identifier, "CURP")

    def test_returns_ambiguous_match_when_name_exists_without_strong_identifier(self) -> None:
        now = datetime.now(timezone.utc)
        existing_patient = ClinicalPatient(
            id=uuid4(),
            name="Mariana López",
            age=40,
            date_of_birth=None,
            curp=None,
            nss=None,
            created_at=now,
            updated_at=now,
        )
        self.patient_repository.save(patient=existing_patient)

        self.review_storage.save(
            review=DocumentReview(
                document_id="doc-1",
                status="approved",
                reviewed_at=now,
                reviewed_fields=(
                    ReviewedField(
                        field="patient.name",
                        original_value="Mariana López",
                        value="Mariana López",
                        status="approved",
                        source_text="Paciente: Mariana López",
                        match_type="explicit_label_or_section",
                    ),
                ),
                reviewed_by="doc-1",
                patient_name="Mariana López",
            )
        )

        response = self.use_case.execute(document_id="doc-1")
        self.assertEqual(response.action, "ambiguous_match")
        self.assertEqual(response.status, "ambiguous_match")
        self.assertEqual(response.match_identifier, "nombre")

    def test_finalizes_directly_against_an_explicit_existing_patient(self) -> None:
        now = datetime.now(timezone.utc)
        patient = ClinicalPatient(uuid4(), "Paciente seleccionado", 50, None, None, None, now, now)
        self.patient_repository.save(patient=patient)
        self._approve_review("doc-1")

        response = self.use_case.execute(document_id="doc-1", patient_id=patient.id)

        self.assertEqual(response.action, "updated")
        self.assertEqual(response.patient.id, patient.id)
        self.assertEqual(response.match_identifier, "explicit_patient_selection")
        self.assertEqual(self.medical_record_repository.get(patient_id=patient.id).documents, ("doc-1",))
        self.assertEqual(len(self.patient_repository.list()), 1)

    def test_rejects_an_explicit_patient_that_does_not_exist(self) -> None:
        self._approve_review("doc-1")
        with self.assertRaises(FinalizeDocumentPatientNotFoundError):
            self.use_case.execute(document_id="doc-1", patient_id=uuid4())

    def test_checks_approval_before_an_explicit_patient_is_used(self) -> None:
        now = datetime.now(timezone.utc)
        patient = ClinicalPatient(uuid4(), "Paciente seleccionado", 50, None, None, None, now, now)
        self.patient_repository.save(patient=patient)
        with self.assertRaises(FinalizeDocumentConflictError):
            self.use_case.execute(document_id="doc-1", patient_id=patient.id)

    def test_two_documents_explicitly_update_the_same_patient_without_duplicates(self) -> None:
        now = datetime.now(timezone.utc)
        patient = ClinicalPatient(uuid4(), "Paciente seleccionado", 50, None, None, None, now, now)
        self.patient_repository.save(patient=patient)
        self._approve_review("doc-1")
        self._approve_review("doc-2")

        first = self.use_case.execute(document_id="doc-1", patient_id=patient.id)
        second = self.use_case.execute(document_id="doc-2", patient_id=patient.id)

        self.assertEqual((first.patient.id, second.patient.id), (patient.id, patient.id))
        self.assertEqual(self.medical_record_repository.get(patient_id=patient.id).documents, ("doc-1", "doc-2"))
        self.assertEqual(len(self.patient_repository.list()), 1)


if __name__ == "__main__":
    unittest.main()
