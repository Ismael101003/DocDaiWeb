"""Caso de uso para extraer texto de documentos ya preparados."""

import logging
from time import perf_counter

from src.application.schemas.ocr import (
    OcrExtractionRequest,
    OcrExtractionResponse,
    OcrProcessingResponse,
)
from src.domain.interfaces.ocr_provider import OcrProvider
from src.domain.interfaces.ocr_result_storage import OcrResultStorage
from src.domain.interfaces.prepared_document_storage import PreparedDocumentStorage
from src.domain.interfaces.temporary_document_storage import TemporaryDocumentStorage

logger = logging.getLogger(__name__)


class DocumentNotFoundError(Exception):
    """Indica que no existe el documento temporal solicitado."""


class DocumentNotPreparedError(Exception):
    """Indica que el documento aún no cuenta con imágenes para OCR."""


class ExtractTextUseCase:
    """Coordina recuperación de imágenes y OCR sin conocer el motor concreto."""

    def __init__(
        self,
        *,
        document_storage: TemporaryDocumentStorage | None = None,
        prepared_storage: PreparedDocumentStorage | None = None,
        ocr_provider: OcrProvider | None = None,
        ocr_result_storage: OcrResultStorage | None = None,
    ) -> None:
        self._document_storage = document_storage
        self._prepared_storage = prepared_storage
        self._ocr_provider = ocr_provider
        self._ocr_result_storage = ocr_result_storage

    def execute(
        self,
        request: OcrExtractionRequest | None = None,
        *,
        document_id: str | None = None,
    ) -> OcrExtractionResponse | OcrProcessingResponse:
        """Extrae texto del documento indicado o conserva el contrato OCR heredado."""
        if request is not None:
            return OcrProcessingResponse(
                document_id=request.document_id,
                detail="El OCR aún no está configurado; la aprobación requiere revisión humana.",
            )

        if document_id is None:
            raise ValueError("Se requiere un identificador de documento.")

        logger.info("Iniciando extracción OCR", extra={"document_id": document_id})

        if not all((self._document_storage, self._prepared_storage, self._ocr_provider)):
            raise RuntimeError("Las dependencias de OCR no están configuradas.")

        try:
            self._document_storage.get_path(document_id=document_id)
        except FileNotFoundError as exc:
            raise DocumentNotFoundError("El documento temporal no existe.") from exc

        try:
            image_paths = self._prepared_storage.get_image_paths(document_id=document_id)
        except FileNotFoundError as exc:
            raise DocumentNotPreparedError(
                "El documento debe prepararse antes de ejecutar OCR."
            ) from exc

        started_at = perf_counter()
        try:
            page_results = self._ocr_provider.extract(images=image_paths)
        except Exception:
            logger.exception("Error durante el procesamiento OCR", extra={"document_id": document_id})
            raise
        processing_time = perf_counter() - started_at
        confidences = [
            confidence
            for page_result in page_results
            for confidence in page_result.confidences
        ]

        result = OcrExtractionResponse(
            document_id=document_id,
            pages=len(page_results),
            text="\n".join(page_result.text for page_result in page_results if page_result.text),
            confidence=round(sum(confidences) / len(confidences), 4) if confidences else 0.0,
            processing_time=round(processing_time, 4),
        )
        if self._ocr_result_storage is not None:
            self._ocr_result_storage.save(document_id=document_id, text=result.text)
        logger.info(
            "OCR completado correctamente",
            extra={
                "document_id": document_id,
                "pages": result.pages,
                "average_confidence": result.confidence,
                "duration_seconds": result.processing_time,
                "status": result.status,
            },
        )
        return result
