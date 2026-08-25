"""Casos de uso para guardar o aprobar la revisión humana de un documento."""

from datetime import datetime, timezone

from src.application.schemas.document_review import (
    DocumentReviewRequest,
    DocumentReviewResponse,
    DocumentReviewSummaryResponse,
)
from src.application.schemas.medical_information import (
    ExtractionEvidenceResponse,
    MedicalInformationResponse,
    MedicationResponse,
    PatientInformationResponse,
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


def _apply_corrections_to_parsed_information(
    parsed: MedicalInformationResponse,
    fields: list[ReviewedField],
) -> MedicalInformationResponse:
    field_map = {f.field: f for f in fields}

    name = parsed.patient.name if parsed.patient else None
    age = parsed.patient.age if parsed.patient else None

    if "patient.name" in field_map:
        f = field_map["patient.name"]
        name = None if f.status == "rejected" else f.value

    if "patient.age" in field_map:
        f = field_map["patient.age"]
        age = None if f.status == "rejected" else (int(f.value) if f.value.isdigit() else age)

    patient_response = (
        PatientInformationResponse(name=name, age=age)
        if (name is not None or age is not None)
        else None
    )

    diagnoses: list[str] = []
    for index, original in enumerate(parsed.diagnoses):
        fkey = f"diagnoses[{index}]"
        if fkey in field_map:
            f = field_map[fkey]
            if f.status != "rejected":
                diagnoses.append(f.value)
        else:
            diagnoses.append(original)

    medications: list[MedicationResponse] = []
    for index, orig_med in enumerate(parsed.medications):
        name_key = f"medications[{index}].name"
        if name_key in field_map and field_map[name_key].status == "rejected":
            continue

        med_name = field_map[name_key].value if name_key in field_map else orig_med.name

        def _get_med_val(prop: str, default: str | None) -> str | None:
            pkey = f"medications[{index}].{prop}"
            if pkey in field_map:
                return None if field_map[pkey].status == "rejected" else field_map[pkey].value
            return default

        medications.append(
            MedicationResponse(
                name=med_name,
                dose=_get_med_val("dose", orig_med.dose),
                frequency=_get_med_val("frequency", orig_med.frequency),
                presentation=_get_med_val("presentation", orig_med.presentation),
                indication=_get_med_val("indication", orig_med.indication),
            )
        )

    dates: list[str] = []
    for index, original in enumerate(parsed.dates):
        fkey = f"dates[{index}]"
        if fkey in field_map:
            f = field_map[fkey]
            if f.status != "rejected":
                dates.append(f.value)
        else:
            dates.append(original)

    doctor = parsed.doctor
    if "doctor" in field_map:
        f = field_map["doctor"]
        doctor = None if f.status == "rejected" else f.value

    institution = parsed.institution
    if "institution" in field_map:
        f = field_map["institution"]
        institution = None if f.status == "rejected" else f.value

    updated_evidence: list[ExtractionEvidenceResponse] = []
    for ev in parsed.evidence:
        if ev.field in field_map:
            f = field_map[ev.field]
            updated_evidence.append(
                ExtractionEvidenceResponse(
                    field=ev.field,
                    value=f.value,
                    source_text=ev.source_text,
                    match_type=ev.match_type,
                    page=ev.page,
                    confidence=ev.confidence,
                    status=f.status,
                )
            )
        else:
            updated_evidence.append(ev)

    return MedicalInformationResponse(
        patient=patient_response,
        diagnoses=diagnoses,
        medications=medications,
        dates=dates,
        doctor=doctor,
        institution=institution,
        evidence=updated_evidence,
    )


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

        corrected_information = _apply_corrections_to_parsed_information(
            parsed_information, reviewed_fields
        )

        reviewed_at = datetime.now(timezone.utc)
        review = DocumentReview(
            document_id=document_id,
            status=self._review_status,
            reviewed_at=reviewed_at,
            reviewed_fields=tuple(reviewed_fields),
            reviewed_by=request.reviewed_by,
            patient_name=corrected_information.patient.name if corrected_information.patient else None,
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
            parsed_information=corrected_information,
        )
