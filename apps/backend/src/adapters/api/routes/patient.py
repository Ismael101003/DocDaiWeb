"""Endpoints HTTP para recursos de pacientes."""

from fastapi import APIRouter

from src.application.schemas.patients import PatientListResponse
from src.application.use_cases.list_patients import ListPatientsUseCase

router = APIRouter()


@router.get("/", response_model=PatientListResponse)
async def get_patients() -> PatientListResponse:
    """Lista pacientes cuando se configure un adaptador de repositorio."""
    return ListPatientsUseCase().execute()
