"""Contrato para el almacenamiento temporal de documentos."""

from pathlib import Path
from typing import Protocol


class TemporaryDocumentStorage(Protocol):
    """Define cómo la aplicación guarda un documento temporal."""

    def save(self, *, content: bytes, original_filename: str) -> str:
        """Guarda el contenido y devuelve un identificador seguro del archivo."""
        ...

    def get_path(self, *, document_id: str) -> Path:
        """Obtiene la ruta local de un documento temporal existente."""
        ...
