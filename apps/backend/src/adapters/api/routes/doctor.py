"""Endpoints HTTP para recursos de profesionales de la salud."""

from fastapi import APIRouter

from src.application.schemas.doctor import DoctorListResponse
from src.application.use_cases.list_doctors import ListDoctorsUseCase

router = APIRouter()


@router.get("/", response_model=DoctorListResponse)
async def get_doctors() -> DoctorListResponse:
    """Lista profesionales cuando se configure un adaptador de repositorio."""
    return ListDoctorsUseCase().execute()
