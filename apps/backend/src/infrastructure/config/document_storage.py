"""Configuración de almacenamiento temporal de documentos."""

from pathlib import Path
import os
import tempfile


DEFAULT_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024


def get_temp_storage_directory() -> Path:
    """Obtiene el directorio temporal destinado a documentos de DocDaiWeb."""
    configured_path = os.getenv("DOCDIA_TEMP_STORAGE_DIR")

    if configured_path:
        return Path(configured_path)

    return Path(tempfile.gettempdir()) / "docdaiweb" / "uploads"


def get_prepared_storage_directory() -> Path:
    """Obtiene el directorio temporal de imágenes preparadas para OCR."""
    return get_temp_storage_directory().parent / "prepared"


def get_max_upload_size_bytes() -> int:
    """Obtiene el límite máximo permitido para un archivo cargado."""
    configured_size = os.getenv("DOCDIA_MAX_UPLOAD_SIZE_BYTES")

    if configured_size is None:
        return DEFAULT_MAX_UPLOAD_SIZE_BYTES

    return int(configured_size)
