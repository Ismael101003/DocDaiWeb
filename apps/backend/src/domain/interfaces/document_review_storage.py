"""Puerto para conservar revisiones humanas de documentos."""

from typing import Protocol

from src.domain.entities.document_review import DocumentReview


class DocumentReviewStorage(Protocol):
    """Expone la persistencia mínima necesaria para la revisión clínica."""

    def save(self, *, review: DocumentReview) -> None:
        """Guarda una revisión humana para un documento."""
        ...

    def get(self, *, document_id: str) -> DocumentReview | None:
        """Obtiene la última revisión guardada o ``None`` si todavía no existe."""
        ...
