"""Endpoints HTTP para recursos de pacientes."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import FileResponse
from uuid import UUID

from src.application.schemas.finalization import ClinicalPatientResponse, PatientMedicalRecordResponse
from src.application.schemas.patients import PatientDocumentListResponse, PatientDocumentResponse, PatientListResponse, PatientResponse, PatientUpdateRequest
from src.application.use_cases.deactivate_patient import DeactivatePatientUseCase
from src.application.use_cases.list_patient_documents import ListPatientDocumentsUseCase, PatientDocumentsNotFoundError
from src.application.use_cases.update_patient import PatientNotFoundError, UpdatePatientUseCase
from src.adapters.api.routes.document import _medical_record_repository, _patient_repository
from src.infrastructure.storage.local_temporary_document_storage import LocalTemporaryDocumentStorage

router = APIRouter()


def get_update_patient_use_case() -> UpdatePatientUseCase:
    return UpdatePatientUseCase(patient_repository=_patient_repository)


def get_deactivate_patient_use_case() -> DeactivatePatientUseCase:
    return DeactivatePatientUseCase(patient_repository=_patient_repository)


def get_patient_documents_use_case() -> ListPatientDocumentsUseCase:
    return ListPatientDocumentsUseCase(patient_repository=_patient_repository, medical_record_repository=_medical_record_repository, document_storage=LocalTemporaryDocumentStorage())


@router.get("/", response_model=PatientListResponse)
async def get_patients() -> PatientListResponse:
    return PatientListResponse(items=[PatientResponse(id=item.id, full_name=item.name or "Sin nombre", age=item.age, date_of_birth=item.date_of_birth, curp=item.curp, nss=item.nss) for item in _patient_repository.list()])


@router.get("/{patient_id}", response_model=ClinicalPatientResponse)
async def get_patient(patient_id: UUID) -> ClinicalPatientResponse:
    patient = _patient_repository.get(patient_id=patient_id)
    if patient is None or not patient.is_active: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El paciente no existe.")
    return ClinicalPatientResponse(**patient.__dict__)


@router.patch("/{patient_id}", response_model=ClinicalPatientResponse)
async def update_patient(patient_id: UUID, payload: PatientUpdateRequest, use_case: UpdatePatientUseCase = Depends(get_update_patient_use_case)) -> ClinicalPatientResponse:
    try:
        return ClinicalPatientResponse(**use_case.execute(patient_id=patient_id, request=payload).__dict__)
    except PatientNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_patient(patient_id: UUID, use_case: DeactivatePatientUseCase = Depends(get_deactivate_patient_use_case)) -> Response:
    try:
        use_case.execute(patient_id=patient_id)
    except PatientNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{patient_id}/medical-record", response_model=PatientMedicalRecordResponse)
async def get_medical_record(patient_id: UUID) -> PatientMedicalRecordResponse:
    patient = _patient_repository.get(patient_id=patient_id)
    if patient is None or not patient.is_active: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El paciente no existe.")
    record = _medical_record_repository.get(patient_id=patient_id)
    if record is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El expediente no existe.")
    return PatientMedicalRecordResponse(**{**record.__dict__, "medications": [item.__dict__ for item in record.medications]})


@router.get("/{patient_id}/documents", response_model=PatientDocumentListResponse)
async def get_patient_documents(patient_id: UUID, use_case: ListPatientDocumentsUseCase = Depends(get_patient_documents_use_case)) -> PatientDocumentListResponse:
    try:
        items = [PatientDocumentResponse(document_id=document_id, filename=path.name) for document_id, path in use_case.execute(patient_id=patient_id)]
        return PatientDocumentListResponse(items=items)
    except PatientDocumentsNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{patient_id}/documents/{document_id}/original", response_class=FileResponse)
async def get_patient_document_original(patient_id: UUID, document_id: str, use_case: ListPatientDocumentsUseCase = Depends(get_patient_documents_use_case)) -> FileResponse:
    try:
        path = use_case.get_original(patient_id=patient_id, document_id=document_id)
    except PatientDocumentsNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return FileResponse(path, filename=path.name)
