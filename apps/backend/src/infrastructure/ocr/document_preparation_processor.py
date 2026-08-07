"""Adaptador que selecciona el procesador adecuado para cada documento temporal."""

import logging
from pathlib import Path

from src.domain.interfaces.document_processor import (
    DocumentProcessor,
    InvalidDocumentError,
    UnsupportedDocumentError,
)
from src.infrastructure.ocr.image_processor import ImageProcessor
from src.infrastructure.ocr.pdf_processor import PdfProcessor

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
logger = logging.getLogger(__name__)


class LocalDocumentPreparationProcessor(DocumentProcessor):
    """Prepara localmente PDFs e imágenes sin ejecutar OCR."""

    def __init__(
        self,
        *,
        pdf_processor: PdfProcessor,
        image_processor: ImageProcessor,
        prepared_storage_directory: Path,
    ) -> None:
        self._pdf_processor = pdf_processor
        self._image_processor = image_processor
        self._prepared_storage_directory = prepared_storage_directory

    def prepare(self, *, document_id: str, document_path: Path) -> list[str]:
        """Detecta el formato y genera imágenes PNG listas para OCR posterior."""
        if Path(document_id).name != document_id:
            raise InvalidDocumentError("El identificador del documento no es válido.")

        output_directory = self._prepared_storage_directory / document_id
        file_extension = document_path.suffix.lower()
        logger.debug(
            "Seleccionando preparación de documento",
            extra={"document_id": document_id, "file_extension": file_extension},
        )

        if file_extension == ".pdf":
            return self._pdf_processor.prepare(
                document_id=document_id,
                document_path=document_path,
                output_directory=output_directory,
            )

        if file_extension in SUPPORTED_IMAGE_EXTENSIONS:
            output_path = output_directory / "page_1.png"
            logger.debug("Procesando página del documento", extra={"document_id": document_id, "page": 1})
            self._image_processor.prepare(
                source_path=document_path,
                output_path=output_path,
            )
            return [f"{document_id}/page_1.png"]

        raise UnsupportedDocumentError("El formato del documento no está soportado.")
