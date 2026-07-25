"""Límite del caso de uso para solicitudes de carga documental."""

from src.application.schemas.document import DocumentUploadResponse


class RequestDocumentUploadUseCase:
    """Confirma una carga sin leer ni persistir su contenido."""

    def execute(self, filename: str | None) -> DocumentUploadResponse:
        """Devuelve un resultado de almacenamiento pendiente sin datos sensibles."""
        return DocumentUploadResponse(
            filename=filename or "unnamed-document",
            detail="La persistencia documental aún no está configurada.",
        )
