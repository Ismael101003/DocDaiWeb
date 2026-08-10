"""Casos de uso para guardar o aprobar la revisión humana de un documento."""

from datetime import datetime, timezone

from src.application.schemas.document_review import (
    DocumentReviewRequest,
    DocumentReviewResponse,
    DocumentReviewSummaryResponse,
)
from src.application.use_cases.parse_medical_information import (
    OcrResultNotAvailableError,
    ParseMedicalInformationUseCase,
)
from src.domain.entities.document_review import DocumentReview, ReviewedField
from src.domain.interfaces.document_review_storage import DocumentReviewStorage
from src.domain.interfaces.temporary_document_storage import TemporaryDocumentStorage


class ReviewDocumentNotFoundError(Exception):
    """Indica que el documento revisado ya no existe en almacenamiento temporal."""


class ReviewDocumentValidationError(Exception):
    """Indica que la revisión enviada no coincide con la evidencia disponible."""


class ReviewDocumentUseCase:
    """Guarda snapshots de revisión con un estado final configurable."""

    def __init__(
        self,
        *,
        document_storage: TemporaryDocumentStorage,
        parse_use_case: ParseMedicalInformationUseCase,
        review_storage: DocumentReviewStorage,
        review_status: str,
    ) -> None:
        self._document_storage = document_storage
        self._parse_use_case = parse_use_case
        self._review_storage = review_storage
        self._review_status = review_status

    def execute(self, *, document_id: str, request: DocumentReviewRequest) -> DocumentReviewResponse:
        """Valida el documento, reusa el parser existente y persiste la revisión."""
        try:
            self._document_storage.get_path(document_id=document_id)
        except FileNotFoundError as exc:
            raise ReviewDocumentNotFoundError("El documento temporal no existe.") from exc

        try:
            parsed_information = self._parse_use_case.execute(document_id=document_id)
        except OcrResultNotAvailableError as exc:
            raise ReviewDocumentValidationError(
                "No existe un resultado OCR temporal para este documento. Ejecute OCR antes de revisar."
            ) from exc

        evidence_by_field = {evidence.field: evidence for evidence in parsed_information.evidence}
        reviewed_fields: list[ReviewedField] = []
        pending_fields = 0
        approved_fields = 0
        corrected_fields = 0
        rejected_fields = 0

        for field in request.fields:
            evidence = evidence_by_field.get(field.field)
            if evidence is None:
                raise ReviewDocumentValidationError(
                    f"El campo '{field.field}' no está presente en la evidencia parseada."
                )

            if field.original_value.strip() != evidence.value.strip():
                raise ReviewDocumentValidationError(
                    f"El valor original enviado para '{field.field}' no coincide con la evidencia del parser."
                )

            if self._review_status == "approved" and field.status == "pending_review":
                raise ReviewDocumentValidationError(
                    "No se puede aprobar un documento con campos pendientes de revisión."
                )

            if field.status == "pending_review":
                pending_fields += 1
            elif field.status == "approved":
                approved_fields += 1
            elif field.status == "corrected":
                corrected_fields += 1
            else:
                rejected_fields += 1

            reviewed_fields.append(
                ReviewedField(
                    field=field.field,
                    original_value=field.original_value,
                    value=field.value,
                    status=field.status,
                    source_text=field.source_text,
                    match_type=field.match_type,
                    page=field.page,
                    confidence=field.confidence,
                )
            )

        reviewed_at = datetime.now(timezone.utc)
        review = DocumentReview(
            document_id=document_id,
            status=self._review_status,
            reviewed_at=reviewed_at,
            reviewed_fields=tuple(reviewed_fields),
            reviewed_by=request.reviewed_by,
            patient_name=parsed_information.patient.name if parsed_information.patient else None,
        )
        self._review_storage.save(review=review)

        return DocumentReviewResponse(
            document_id=document_id,
            status=self._review_status,
            reviewed_at=reviewed_at,
            reviewed_by=request.reviewed_by,
            patient_name=review.patient_name,
            summary=DocumentReviewSummaryResponse(
                total_fields=len(reviewed_fields),
                pending_fields=pending_fields,
                approved_fields=approved_fields,
                corrected_fields=corrected_fields,
                rejected_fields=rejected_fields,
            ),
            parsed_information=parsed_information,
        )
