"""Contratos compartidos de respuesta de la API."""

from typing import Any

from pydantic import BaseModel


class ServiceInfoResponse(BaseModel):
    """Respuesta de identidad del servicio."""

    name: str
    version: str


class HealthResponse(BaseModel):
    """Respuesta de salud sin verificaciones de dependencias."""

    status: str
    service: str


class ErrorResponse(BaseModel):
    """Formato de error de API sin datos sensibles."""

    detail: str
    errors: list[dict[str, Any]] | None = None
