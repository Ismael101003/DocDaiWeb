"""Límite del caso de uso para la futura extracción OCR."""

from src.application.schemas.ocr import OcrExtractionRequest, OcrProcessingResponse


class ExtractTextUseCase:
    """Prepara trabajo OCR sin seleccionar ni invocar un proveedor OCR."""

    def execute(self, request: OcrExtractionRequest) -> OcrProcessingResponse:
        """Devuelve el estado obligatorio de revisión humana para el documento solicitado."""
        return OcrProcessingResponse(
            document_id=request.document_id,
            detail="El OCR aún no está configurado; la aprobación requiere revisión humana.",
        )
