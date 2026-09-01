"""Resuelve una coincidencia de paciente únicamente con decisión humana explícita."""

from src.application.schemas.finalization import FinalizeDocumentResponse, ResolveAmbiguousPatientRequest
from src.application.use_cases.finalize_document import FinalizeDocumentUseCase


class ResolveAmbiguousPatientUseCase:
    def __init__(self, *, finalize_use_case: FinalizeDocumentUseCase) -> None:
        self._finalize_use_case = finalize_use_case

    def execute(self, *, document_id: str, request: ResolveAmbiguousPatientRequest) -> FinalizeDocumentResponse:
        if request.action == "existing_patient":
            if request.patient_id is None:
                raise ValueError("Selecciona un expediente para vincular el documento.")
            return self._finalize_use_case.execute(document_id=document_id, patient_id=request.patient_id)
        return self._finalize_use_case.execute(document_id=document_id, create_new_patient=True)
