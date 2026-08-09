"""Puerto para conservar transitoriamente texto OCR no aprobado."""

from typing import Protocol


class OcrResultStorage(Protocol):
    """Expone resultados OCR efímeros para etapas posteriores de revisión."""

    def save(self, *, document_id: str, text: str, page_texts: tuple[str, ...] = ()) -> None:
        """Guarda texto OCR en almacenamiento temporal no persistente."""
        ...

    def get(self, *, document_id: str) -> str | None:
        """Obtiene texto OCR temporal o ``None`` cuando no está disponible."""
        ...

    def get_page_texts(self, *, document_id: str) -> tuple[str, ...] | None:
        """Obtiene el texto por página para conservar procedencia en el parser."""
        ...
