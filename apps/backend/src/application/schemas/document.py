"""Contratos de aplicación para la recepción de documentos."""

from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    """Confirmación de una solicitud de recepción sin persistencia."""

    filename: str = Field(min_length=1)
    status: str = "pending_storage"
    detail: str
