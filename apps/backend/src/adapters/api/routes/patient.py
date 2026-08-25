"""Endpoints HTTP para recursos de pacientes."""

from fastapi import APIRouter, HTTPException, status
from uuid import UUID

from src.application.schemas.finalization import ClinicalPatientResponse, PatientMedicalRecordResponse
from src.application.schemas.patients import PatientListResponse, PatientResponse
from src.adapters.api.routes.document import _medical_record_repository, _patient_repository

router = APIRouter()


@router.get("/", response_model=PatientListResponse)
async def get_patients() -> PatientListResponse:
    return PatientListResponse(items=[PatientResponse(id=item.id, full_name=item.name or "Sin nombre") for item in _patient_repository.list()])


@router.get("/{patient_id}", response_model=ClinicalPatientResponse)
async def get_patient(patient_id: UUID) -> ClinicalPatientResponse:
    patient = _patient_repository.get(patient_id=patient_id)
    if patient is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El paciente no existe.")
    return ClinicalPatientResponse(**patient.__dict__)


@router.get("/{patient_id}/medical-record", response_model=PatientMedicalRecordResponse)
async def get_medical_record(patient_id: UUID) -> PatientMedicalRecordResponse:
    record = _medical_record_repository.get(patient_id=patient_id)
    if record is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El expediente no existe.")
    return PatientMedicalRecordResponse(**{**record.__dict__, "medications": [item.__dict__ for item in record.medications]})
