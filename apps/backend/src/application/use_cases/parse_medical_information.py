"""Caso de uso para transformar texto OCR previamente obtenido en datos revisables."""

from src.application.schemas.medical_information import (
    ExtractionEvidenceResponse,
    MedicalInformationResponse,
    MedicationResponse,
    PatientInformationResponse,
)
from src.application.services.medical_information_parser import MedicalInformationParser
from src.domain.interfaces.ocr_result_storage import OcrResultStorage


class OcrResultNotAvailableError(Exception):
    """Indica que no hay texto OCR temporal disponible para el documento."""


class ParseMedicalInformationUseCase:
    """Coordina el parser puro sin conocer HTTP, OCR ni infraestructura concreta."""

    def __init__(
        self,
        *,
        parser: MedicalInformationParser,
        ocr_result_storage: OcrResultStorage,
    ) -> None:
        self._parser = parser
        self._ocr_result_storage = ocr_result_storage

    def execute(self, *, document_id: str) -> MedicalInformationResponse:
        """Convierte un resultado OCR existente, sin ejecutar OCR ni persistir información."""
        ocr_text = self._ocr_result_storage.get(document_id=document_id)
        if ocr_text is None:
            raise OcrResultNotAvailableError(
                "No existe un resultado OCR temporal para el documento. Ejecute OCR antes de parsear."
            )

        record = self._parser.parse(
            ocr_text,
            page_texts=self._ocr_result_storage.get_page_texts(document_id=document_id),
        )
        return MedicalInformationResponse(
            patient=(
                PatientInformationResponse(name=record.patient.name, age=record.patient.age)
                if record.patient is not None
                else None
            ),
            diagnoses=list(record.diagnoses),
            medications=[
                MedicationResponse(
                    name=medication.name,
                    dose=medication.dose,
                    frequency=medication.frequency,
                    presentation=medication.presentation,
                    indication=medication.indication,
                )
                for medication in record.medications
            ],
            dates=list(record.dates),
            doctor=record.doctor,
            institution=record.institution,
            evidence=[
                ExtractionEvidenceResponse(
                    field=evidence.field,
                    value=evidence.value,
                    source_text=evidence.source_text,
                    match_type=evidence.match_type,
                    page=evidence.page,
                    confidence=evidence.confidence,
                    status=evidence.status,
                )
                for evidence in record.evidence
            ],
        )
