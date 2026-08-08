"""Endpoint de salud del servicio."""

from fastapi import APIRouter

from src.application.schemas.common import HealthResponse

router = APIRouter()


@router.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Informa disponibilidad de la API sin consultar dependencias externas no configuradas."""
    return HealthResponse(status="ok", service="DocDaiWeb API")
