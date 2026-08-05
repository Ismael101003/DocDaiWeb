"""Contrato de dominio para preparar documentos antes de OCR."""

from pathlib import Path
from typing import Protocol


class DocumentPreparationError(Exception):
    """Indica un fallo controlado al preparar un documento."""


class UnsupportedDocumentError(DocumentPreparationError):
    """Indica que el formato del documento no puede prepararse."""


class InvalidDocumentError(DocumentPreparationError):
    """Indica que el documento está corrupto o no puede abrirse."""


class DocumentProcessor(Protocol):
    """Define la capacidad de preparar documentos para un motor OCR futuro."""

    def prepare(self, *, document_id: str, document_path: Path) -> list[str]:
        """Prepara el documento y devuelve referencias seguras de las imágenes generadas."""
        ...
