"""Almacenamiento local en memoria para revisiones humanas de documentos."""

from threading import Lock

from src.domain.entities.document_review import DocumentReview


class InMemoryDocumentReviewStorage:
    """Mantiene el último snapshot de revisión únicamente en memoria del proceso."""

    def __init__(self) -> None:
        self._reviews: dict[str, DocumentReview] = {}
        self._lock = Lock()

    def save(self, *, review: DocumentReview) -> None:
        with self._lock:
            self._reviews[review.document_id] = review

    def get(self, *, document_id: str) -> DocumentReview | None:
        with self._lock:
            return self._reviews.get(document_id)
