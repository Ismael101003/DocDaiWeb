"""Endpoints HTTP para la recepción de documentos."""

from fastapi import APIRouter, File, UploadFile, status

from src.application.schemas.document import DocumentUploadResponse
from src.application.use_cases.request_document_upload import RequestDocumentUploadUseCase

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(file: UploadFile = File(...)) -> DocumentUploadResponse:
    """Registra una solicitud de carga sin almacenar archivos clínicos todavía."""
    return RequestDocumentUploadUseCase().execute(filename=file.filename)
