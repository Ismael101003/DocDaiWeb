"""Pruebas del caso de uso de parseo sin OCR ni HTTP reales."""

import unittest

from src.application.services.medical_information_parser import MedicalInformationParser
from src.application.use_cases.parse_medical_information import (
    OcrResultNotAvailableError,
    ParseMedicalInformationUseCase,
)
from src.infrastructure.storage.in_memory_ocr_result_storage import InMemoryOcrResultStorage


class ParseMedicalInformationUseCaseTest(unittest.TestCase):
    def setUp(self) -> None:
        self.storage = InMemoryOcrResultStorage()
        self.use_case = ParseMedicalInformationUseCase(
            parser=MedicalInformationParser(),
            ocr_result_storage=self.storage,
        )

    def test_parses_previously_stored_ocr_text(self) -> None:
        self.storage.save(document_id="doc-1", text="Paciente: Laura Ruiz\nEdad: 30 años\n")

        response = self.use_case.execute(document_id="doc-1")

        self.assertEqual(response.patient.name if response.patient else None, "Laura Ruiz")
        self.assertEqual(response.patient.age if response.patient else None, 30)
        self.assertEqual(response.evidence[0].field, "patient.name")

    def test_rejects_missing_ocr_result_without_running_ocr(self) -> None:
        with self.assertRaises(OcrResultNotAvailableError):
            self.use_case.execute(document_id="missing")
