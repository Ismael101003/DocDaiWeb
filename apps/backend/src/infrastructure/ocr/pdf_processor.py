"""Conversión de documentos PDF a imágenes normalizadas para OCR futuro."""

from pathlib import Path

import fitz

from src.domain.interfaces.document_processor import (
    InvalidDocumentError,
    UnsupportedDocumentError,
)
from src.infrastructure.ocr.image_processor import ImageProcessor

PDF_RENDER_DPI = 300


class PdfProcessor:
    """Convierte cada página válida de un PDF en una imagen PNG preparada."""

    def __init__(self, *, image_processor: ImageProcessor) -> None:
        self._image_processor = image_processor

    def prepare(self, *, document_id: str, document_path: Path, output_directory: Path) -> list[str]:
        """Renderiza cada página del PDF y delega su normalización de imagen."""
        if document_path.suffix.lower() != ".pdf":
            raise UnsupportedDocumentError("El documento no es un PDF compatible.")

        try:
            pdf_document = fitz.open(document_path)
        except (fitz.FileDataError, OSError, RuntimeError, ValueError) as exc:
            raise InvalidDocumentError("El PDF es inválido o está corrupto.") from exc

        try:
            if pdf_document.needs_pass or pdf_document.page_count < 1:
                raise InvalidDocumentError("El PDF no puede prepararse para OCR.")

            output_directory.mkdir(parents=True, exist_ok=True)
            scale = PDF_RENDER_DPI / 72
            matrix = fitz.Matrix(scale, scale)
            image_references: list[str] = []

            for page_index, page in enumerate(pdf_document, start=1):
                rendered_path = output_directory / f".rendered_{page_index}.png"
                prepared_path = output_directory / f"page_{page_index}.png"

                try:
                    page.get_pixmap(matrix=matrix, alpha=False).save(rendered_path)
                    self._image_processor.prepare(
                        source_path=rendered_path,
                        output_path=prepared_path,
                    )
                finally:
                    rendered_path.unlink(missing_ok=True)

                image_references.append(f"{document_id}/page_{page_index}.png")

            return image_references
        except InvalidDocumentError:
            raise
        except (fitz.FileDataError, OSError, RuntimeError, ValueError) as exc:
            raise InvalidDocumentError("El PDF no puede prepararse para OCR.") from exc
        finally:
            pdf_document.close()
