"""Contrato para el almacenamiento temporal de documentos."""

from typing import Protocol


class TemporaryDocumentStorage(Protocol):
    """Define cómo la aplicación guarda un documento temporal."""

    def save(self, *, content: bytes, original_filename: str) -> str:
        """Guarda el contenido y devuelve un identificador seguro del archivo."""
        ...