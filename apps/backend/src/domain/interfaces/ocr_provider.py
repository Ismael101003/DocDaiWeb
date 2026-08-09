"""Puerto de dominio para motores OCR intercambiables."""

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol, Sequence


class OcrEngineError(Exception):
    """Indica un fallo controlado del motor OCR."""


@dataclass(frozen=True)
class OcrBlock:
    """Una línea OCR con su ubicación técnica en la página preparada."""

    text: str
    confidence: float | None = None
    polygon: tuple[tuple[float, float], ...] = ()


@dataclass(frozen=True)
class OcrPageResult:
    """Resultado OCR no aprobado de una imagen preparada."""

    text: str
    confidences: tuple[float, ...]
    blocks: tuple[OcrBlock, ...] = ()


class OcrProvider(Protocol):
    """Define la capacidad de extraer texto de imágenes ya preparadas."""

    def extract(self, *, images: Sequence[Path]) -> list[OcrPageResult]:
        """Extrae texto y confianzas por página sin depender de HTTP ni FastAPI."""
        ...
