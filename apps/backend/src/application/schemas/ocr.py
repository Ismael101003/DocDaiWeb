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


class OcrExtractionResponse(BaseModel):
    """Resultado no persistido de OCR sobre un documento preparado."""

    document_id: str
    status: str = "processed"
    pages: int
    text: str
    confidence: float
    processing_time: float
    page_results: list["OcrPageResponse"] = []


class OcrBlockResponse(BaseModel):
    """Bloque OCR técnico; no representa un dato clínico aprobado."""

    text: str
    confidence: float | None = None
    polygon: list[tuple[float, float]] = []


class OcrPageResponse(BaseModel):
    """Texto y bloques detectados en una página preparada."""

    page: int
    text: str
    confidence: float | None = None
    blocks: list[OcrBlockResponse] = []
