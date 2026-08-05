"""Almacenamiento local y temporal de documentos."""

from pathlib import Path
from uuid import uuid4

from src.infrastructure.config.document_storage import get_temp_storage_directory


class LocalTemporaryDocumentStorage:
    """Guarda documentos temporalmente en el sistema de archivos local."""

    def save(self, *, content: bytes, original_filename: str) -> str:
        """Guarda el archivo con un nombre seguro y devuelve su identificador."""
        storage_directory = get_temp_storage_directory()
        storage_directory.mkdir(parents=True, exist_ok=True)

        file_extension = Path(original_filename).suffix.lower()
        stored_filename = f"{uuid4().hex}{file_extension}"
        stored_file_path = storage_directory / stored_filename

        stored_file_path.write_bytes(content)

        return stored_filename