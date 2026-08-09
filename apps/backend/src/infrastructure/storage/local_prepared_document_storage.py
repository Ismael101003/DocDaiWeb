"""Recuperación local de imágenes temporales preparadas para OCR."""

import logging
from pathlib import Path

from src.infrastructure.config.document_storage import get_prepared_storage_directory

logger = logging.getLogger(__name__)


class LocalPreparedDocumentStorage:
    """Obtiene imágenes preparadas sin exponer rutas arbitrarias del sistema."""

    def get_image_paths(self, *, document_id: str) -> list[Path]:
        """Devuelve archivos PNG de página en orden o informa que no están preparados."""
        prepared_root = get_prepared_storage_directory().resolve()
        document_directory = (prepared_root / document_id).resolve()

        if document_directory.parent != prepared_root or not document_directory.is_dir():
            raise FileNotFoundError(document_id)

        image_paths = sorted(document_directory.glob("page_*.png"))

        if not image_paths:
            raise FileNotFoundError(document_id)

        logger.debug(
            "Imágenes preparadas localizadas",
            extra={"document_id": document_id, "pages": len(image_paths)},
        )
        return image_paths

    def get_image_path(self, *, document_id: str, page: int) -> Path:
        """Devuelve una página preparada concreta sin aceptar rutas arbitrarias."""
        if page < 1:
            raise FileNotFoundError(document_id)
        image_paths = self.get_image_paths(document_id=document_id)
        try:
            return image_paths[page - 1]
        except IndexError as exc:
            raise FileNotFoundError(document_id) from exc
