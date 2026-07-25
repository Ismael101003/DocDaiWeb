"""Contratos de aplicación para la orquestación OCR."""

from uuid import UUID

from pydantic import BaseModel


class OcrExtractionRequest(BaseModel):
    """Hace referencia a un documento ya almacenado para su futuro procesamiento OCR."""

    document_id: UUID


class OcrProcessingResponse(BaseModel):
    """Rastrea una solicitud que debe revisarse por una persona antes de aprobarse."""

    document_id: UUID
    status: str = "pending_human_review"
    detail: str
