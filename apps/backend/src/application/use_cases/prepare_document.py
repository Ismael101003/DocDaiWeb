"""Caso de uso para preparar documentos antes de ejecutar OCR."""

import logging
from time import perf_counter

from src.application.schemas.document import PreparedDocumentResponse
from src.domain.interfaces.document_processor import DocumentProcessor
from src.domain.interfaces.temporary_document_storage import TemporaryDocumentStorage

logger = logging.getLogger(__name__)


class DocumentNotFoundError(Exception):
    """Indica que no existe el documento temporal solicitado."""


class PrepareDocumentUseCase:
    """Coordina la localización y preparación de un documento sin conocer su formato."""

    def __init__(
        self,
        *,
        storage: TemporaryDocumentStorage,
        processor: DocumentProcessor,
    ) -> None:
        self._storage = storage
        self._processor = processor

    def execute(self, *, document_id: str) -> PreparedDocumentResponse:
        """Obtiene el archivo temporal y devuelve sus imágenes preparadas."""
        started_at = perf_counter()
        logger.info("Iniciando preparación del documento", extra={"document_id": document_id})
        try:
            document_path = self._storage.get_path(document_id=document_id)
        except FileNotFoundError as exc:
            raise DocumentNotFoundError("El documento temporal no existe.") from exc

        images = self._processor.prepare(
            document_id=document_id,
            document_path=document_path,
        )
        logger.info(
            "Documento preparado correctamente",
            extra={
                "document_id": document_id,
                "pages": len(images),
                "duration_seconds": round(perf_counter() - started_at, 4),
            },
        )

        return PreparedDocumentResponse(
            document_id=document_id,
            pages=len(images),
            images=images,
        )
