"""Pruebas del contrato HTTP de revisión documental."""

import unittest

from fastapi.testclient import TestClient

from src.adapters.api.routes import document as document_routes
from src.application.schemas.document_review import DocumentReviewResponse, DocumentReviewSummaryResponse
from src.application.schemas.medical_information import MedicalInformationResponse
from src.main import app


class FakeUseCase:
    def __init__(self, response: DocumentReviewResponse) -> None:
        self.response = response
        self.calls: list[tuple[str, object]] = []

    def execute(self, *, document_id: str, request):
        self.calls.append((document_id, request))
        return self.response


class DocumentReviewRouteTest(unittest.TestCase):
    def setUp(self) -> None:
        app.dependency_overrides.clear()
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_approve_review_endpoint_returns_persisted_snapshot(self) -> None:
        response_model = DocumentReviewResponse(
            document_id="document-1",
            status="approved",
            reviewed_at="2026-08-09T18:00:00Z",
            reviewed_by="doctor-1",
            patient_name="Mariana López Hernández",
            summary=DocumentReviewSummaryResponse(
                total_fields=1,
                pending_fields=0,
                approved_fields=1,
                corrected_fields=0,
                rejected_fields=0,
            ),
            parsed_information=MedicalInformationResponse(
                patient={"name": "Mariana López Hernández", "age": 54},
                diagnoses=["Hipertensión arterial"],
                medications=[],
                dates=[],
                doctor=None,
                institution=None,
                evidence=[],
            ),
        )
        fake_use_case = FakeUseCase(response_model)
        app.dependency_overrides[document_routes.get_approve_document_review_use_case] = lambda: fake_use_case

        response = self.client.post(
            "/api/v1/documents/document-1/review/approve",
            json={
                "reviewed_by": "doctor-1",
                "fields": [
                    {
                        "field": "patient.name",
                        "original_value": "Mariana López Hernández",
                        "value": "Mariana López Hernandez",
                        "status": "corrected",
                        "source_text": "Paciente: Mariana López Hernández",
                        "match_type": "explicit_label_or_section",
                        "page": 1,
                        "confidence": 0.98,
                    }
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "approved")
        self.assertEqual(fake_use_case.calls[0][0], "document-1")


if __name__ == "__main__":
    unittest.main()
