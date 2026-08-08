"""Puerto para conservar transitoriamente texto OCR no aprobado."""

from typing import Protocol


class OcrResultStorage(Protocol):
    """Expone resultados OCR efímeros para etapas posteriores de revisión."""

    def save(self, *, document_id: str, text: str) -> None:
        """Guarda texto OCR en almacenamiento temporal no persistente."""
        ...

    def get(self, *, document_id: str) -> str | None:
        """Obtiene texto OCR temporal o ``None`` cuando no está disponible."""
        ...
