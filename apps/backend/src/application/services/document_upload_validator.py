"""Validación de archivos recibidos para carga documental."""

from pathlib import Path


ALLOWED_DOCUMENT_TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}

FILE_SIGNATURES = {
    ".pdf": b"%PDF-",
    ".jpg": b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
    ".png": b"\x89PNG\r\n\x1a\n",
}


class InvalidDocumentUploadError(ValueError):
    """Indica que un archivo no cumple las reglas de carga."""


class DocumentUploadValidator:
    """Valida los metadatos y el contenido de un documento."""

    def validate(
        self,
        *,
        filename: str | None,
        content_type: str | None,
        content: bytes,
        max_size_bytes: int,
    ) -> None:
        
        """Comprueba nombre, formato, tipo MIME, tamaño y firma del archivo."""
        if not filename:
            raise InvalidDocumentUploadError("El archivo debe incluir un nombre.")

        if not content:
            raise InvalidDocumentUploadError("El archivo no puede estar vacío.")

        if len(content) > max_size_bytes:
            raise InvalidDocumentUploadError(
                f"El archivo excede el límite de {max_size_bytes} bytes."
            )

        file_extension = Path(filename).suffix.lower()

        if file_extension not in ALLOWED_DOCUMENT_TYPES:
            raise InvalidDocumentUploadError(
                "Formato no permitido. Solo se aceptan PDF, JPG, JPEG y PNG."
            )

        normalized_content_type = (content_type or "").split(";", maxsplit=1)[0].lower()

        if normalized_content_type != ALLOWED_DOCUMENT_TYPES[file_extension]:
            raise InvalidDocumentUploadError(
                "El tipo de contenido no coincide con la extensión del archivo."
            )

        expected_signature = FILE_SIGNATURES[file_extension]

        if not content.startswith(expected_signature):
            raise InvalidDocumentUploadError(
                "El contenido del archivo no corresponde al formato declarado."
            )