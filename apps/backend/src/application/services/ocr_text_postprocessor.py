"""Postprocesado puro de texto OCR antes del parsing médico."""

from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class NormalizedOcrPage:
    """Texto OCR normalizado por página, preservando la procedencia."""

    page: int | None
    text: str


def normalize_ocr_text(text: str) -> str:
    """Normaliza saltos de línea y elimina blancos excesivos sin corregir el OCR."""
    if not isinstance(text, str):
        raise TypeError("El texto OCR debe ser una cadena.")

    normalized_text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines: list[str] = []
    blank_line_pending = False

    for raw_line in normalized_text.split("\n"):
        line = raw_line.rstrip()
        if not line.strip():
            if blank_line_pending:
                continue
            lines.append("")
            blank_line_pending = True
            continue

        lines.append(line)
        blank_line_pending = False

    return "\n".join(lines).strip("\n")


def normalize_ocr_pages(text_or_pages: str | Sequence[str]) -> tuple[NormalizedOcrPage, ...]:
    """Normaliza un texto OCR agregado o una secuencia de páginas OCR."""
    if isinstance(text_or_pages, str):
        raw_pages = text_or_pages.split("\f") if "\f" in text_or_pages else [text_or_pages]
    else:
        raw_pages = list(text_or_pages)

    normalized_pages: list[NormalizedOcrPage] = []
    has_multiple_pages = len(raw_pages) > 1

    for index, raw_page in enumerate(raw_pages, start=1):
        normalized_text = normalize_ocr_text(raw_page)
        if not normalized_text and not has_multiple_pages:
            normalized_pages.append(NormalizedOcrPage(page=None, text=""))
            continue

        normalized_pages.append(
            NormalizedOcrPage(
                page=index if has_multiple_pages else None,
                text=normalized_text,
            )
        )

    if not normalized_pages:
        normalized_pages.append(NormalizedOcrPage(page=None, text=""))

    return tuple(normalized_pages)