"""Endpoints HTTP para solicitudes de procesamiento OCR."""

from fastapi import APIRouter, status

from src.application.schemas.ocr import OcrExtractionRequest, OcrProcessingResponse
from src.application.use_cases.extract_text import ExtractTextUseCase

router = APIRouter()


@router.post("/extract", response_model=OcrProcessingResponse, status_code=status.HTTP_202_ACCEPTED)
async def request_text_extraction(payload: OcrExtractionRequest) -> OcrProcessingResponse:
    """Encola una futura solicitud OCR; ningún resultado se aprueba sin revisión humana."""
    return ExtractTextUseCase().execute(payload)
