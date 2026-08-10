"""Alias explícito para aprobar una revisión humana de documento."""

from src.application.use_cases.review_document import ReviewDocumentUseCase


class ApproveDocumentReviewUseCase(ReviewDocumentUseCase):
    """Caso de uso especializado para el cierre final de la revisión."""

    def __init__(self, **kwargs) -> None:
        super().__init__(review_status="approved", **kwargs)
