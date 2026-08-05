"""Contratos de aplicación para la recepción de documentos."""

from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    """Confirmación de un documento validado y almacenado temporalmente."""

    document_id: str = Field(min_length=1)
    filename: str = Field(min_length=1)
    status: str = "stored"
    detail: str


class PreparedDocumentResponse(BaseModel):
    """Confirmación de imágenes temporales preparadas para OCR futuro."""

    document_id: str = Field(min_length=1)
    status: str = "prepared"
    pages: int = Field(ge=1)
    images: list[str] = Field(min_length=1)
