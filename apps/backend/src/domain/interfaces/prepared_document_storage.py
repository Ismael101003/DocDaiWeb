"""Contrato para recuperar imágenes temporales preparadas para OCR."""

from pathlib import Path
from typing import Protocol


class PreparedDocumentStorage(Protocol):
    """Expone las imágenes preparadas de un documento temporal."""

    def get_image_paths(self, *, document_id: str) -> list[Path]:
        """Devuelve las imágenes preparadas ordenadas por página."""
        ...
