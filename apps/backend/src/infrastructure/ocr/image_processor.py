"""Normalización de imágenes para procesamiento OCR futuro."""

from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError

from src.domain.interfaces.document_processor import InvalidDocumentError

MAX_OCR_IMAGE_SIZE = (2500, 3500)
OCR_DPI = (300, 300)


class ImageProcessor:
    """Normaliza una imagen en PNG RGB sin metadatos para OCR posterior."""

    def prepare(self, *, source_path: Path, output_path: Path) -> None:
        """Corrige orientación, normaliza dimensiones y guarda una imagen PNG limpia."""
        try:
            with Image.open(source_path) as source_image:
                normalized_image = ImageOps.exif_transpose(source_image).convert("RGB")

                try:
                    normalized_image.thumbnail(MAX_OCR_IMAGE_SIZE, Image.Resampling.LANCZOS)
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    normalized_image.save(output_path, format="PNG", dpi=OCR_DPI)
                finally:
                    normalized_image.close()
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise InvalidDocumentError(
                "La imagen no es válida o no puede prepararse para OCR."
            ) from exc
