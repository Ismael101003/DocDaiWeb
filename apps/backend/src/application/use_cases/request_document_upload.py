"""Caso de uso para validar y almacenar temporalmente documentos."""

from src.application.schemas.document import DocumentUploadResponse
from src.application.services.document_upload_validator import DocumentUploadValidator
from src.domain.interfaces.temporary_document_storage import TemporaryDocumentStorage


class RequestDocumentUploadUseCase:
    """Coordina la validación y el almacenamiento temporal de un documento."""

    def __init__(
        self,
        *,
        storage: TemporaryDocumentStorage,
        validator: DocumentUploadValidator,
        max_upload_size_bytes: int,
    ) -> None:
        self._storage = storage
        self._validator = validator
        self._max_upload_size_bytes = max_upload_size_bytes

    def execute(
        self,
        *,
        filename: str | None,
        content_type: str | None,
        content: bytes,
    ) -> DocumentUploadResponse:
        """Valida el documento, lo guarda temporalmente y devuelve su referencia."""
        safe_filename = filename or ""

        self._validator.validate(
            filename=safe_filename,
            content_type=content_type,
            content=content,
            max_size_bytes=self._max_upload_size_bytes,
        )

        document_id = self._storage.save(
            content=content,
            original_filename=safe_filename,
        )

        return DocumentUploadResponse(
            document_id=document_id,
            filename=safe_filename,
            detail="Documento validado y almacenado temporalmente.",
        )
