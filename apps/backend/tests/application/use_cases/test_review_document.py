"""Pruebas del caso de uso de revisión humana de documentos."""

import unittest
from pathlib import Path

from src.application.schemas.document_review import DocumentReviewRequest, ReviewedFieldRequest
from src.application.schemas.medical_information import (
    ExtractionEvidenceResponse,
    MedicalInformationResponse,
    PatientInformationResponse,
)
from src.application.use_cases.review_document import (
    ReviewDocumentNotFoundError,
    ReviewDocumentUseCase,
    ReviewDocumentValidationError,
)
from src.infrastructure.storage.in_memory_document_review_storage import InMemoryDocumentReviewStorage


class FakeDocumentStorage:
    def __init__(self, exists: bool = True) -> None:
        self.exists = exists

    def get_path(self, *, document_id: str) -> Path:
        if not self.exists or document_id != "document-1":
            raise FileNotFoundError(document_id)
        return Path("C:/tmp/document-1.pdf")


class FakeParseUseCase:
    def execute(self, *, document_id: str) -> MedicalInformationResponse:
        return MedicalInformationResponse(
            patient=PatientInformationResponse(name="Mariana López Hernández", age=54),
            diagnoses=["Hipertensión arterial"],
            medications=[],
            dates=[],
            doctor=None,
            institution=None,
            evidence=[
                ExtractionEvidenceResponse(
                    field="patient.name",
                    value="Mariana López Hernández",
                    source_text="Paciente: Mariana López Hernández",
                    match_type="explicit_label_or_section",
                    page=1,
                    confidence=0.98,
                    status="pending_review",
                )
            ],
        )


class ReviewDocumentUseCaseTest(unittest.TestCase):
    def setUp(self) -> None:
        self.document_storage = FakeDocumentStorage()
        self.parse_use_case = FakeParseUseCase()
        self.review_storage = InMemoryDocumentReviewStorage()

    def test_saves_review_snapshot_without_approving_it(self) -> None:
        use_case = ReviewDocumentUseCase(
            document_storage=self.document_storage,
            parse_use_case=self.parse_use_case,
            review_storage=self.review_storage,
            review_status="reviewing",
        )

        response = use_case.execute(
            document_id="document-1",
            request=DocumentReviewRequest(
                reviewed_by="doctor-1",
                fields=[
                    ReviewedFieldRequest(
                        field="patient.name",
                        original_value="Mariana López Hernández",
                        value="Mariana López Hernandez",
                        status="corrected",
                        source_text="Paciente: Mariana López Hernández",
                        match_type="explicit_label_or_section",
                        page=1,
                        confidence=0.98,
                    )
                ],
            ),
        )

        self.assertEqual(response.status, "reviewing")
        self.assertEqual(response.summary.total_fields, 1)
        self.assertEqual(response.summary.corrected_fields, 1)
        self.assertEqual(self.review_storage.get(document_id="document-1").status, "reviewing")

    def test_rejects_pending_fields_when_approving(self) -> None:
        use_case = ReviewDocumentUseCase(
            document_storage=self.document_storage,
            parse_use_case=self.parse_use_case,
            review_storage=self.review_storage,
            review_status="approved",
        )

        with self.assertRaises(ReviewDocumentValidationError):
            use_case.execute(
                document_id="document-1",
                request=DocumentReviewRequest(
                    fields=[
                        ReviewedFieldRequest(
                            field="patient.name",
                            original_value="Mariana López Hernández",
                            value="Mariana López Hernández",
                            status="pending_review",
                            source_text="Paciente: Mariana López Hernández",
                            match_type="explicit_label_or_section",
                            page=1,
                            confidence=0.98,
                        )
                    ]
                ),
            )

    def test_raises_when_document_is_missing(self) -> None:
        use_case = ReviewDocumentUseCase(
            document_storage=FakeDocumentStorage(exists=False),
            parse_use_case=self.parse_use_case,
            review_storage=self.review_storage,
            review_status="approved",
        )

        with self.assertRaises(ReviewDocumentNotFoundError):
            use_case.execute(
                document_id="document-1",
                request=DocumentReviewRequest(
                    fields=[
                        ReviewedFieldRequest(
                            field="patient.name",
                            original_value="Mariana López Hernández",
                            value="Mariana López Hernández",
                            status="approved",
                            source_text="Paciente: Mariana López Hernández",
                            match_type="explicit_label_or_section",
                            page=1,
                            confidence=0.98,
                        )
                    ]
                ),
            )


if __name__ == "__main__":
    unittest.main()
