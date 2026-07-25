"""Puerto de dominio para implementaciones de proveedores OCR."""

from pathlib import Path
from typing import Protocol


class OcrProvider(Protocol):
    """Capacidad OCR abstracta implementada únicamente por adaptadores de infraestructura."""

    def extract_text(self, document_path: Path) -> str:
        """Extrae texto de un documento local sin aprobar su resultado."""
        ...
