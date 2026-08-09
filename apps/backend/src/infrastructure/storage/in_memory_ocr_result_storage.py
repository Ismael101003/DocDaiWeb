"""Almacenamiento local en memoria para resultados OCR transitorios."""

from threading import Lock


class InMemoryOcrResultStorage:
    """Mantiene texto OCR únicamente durante la vida del proceso de la API."""

    def __init__(self) -> None:
        self._results: dict[str, tuple[str, tuple[str, ...]]] = {}
        self._lock = Lock()

    def save(self, *, document_id: str, text: str, page_texts: tuple[str, ...] = ()) -> None:
        with self._lock:
            self._results[document_id] = (text, page_texts)

    def get(self, *, document_id: str) -> str | None:
        with self._lock:
            result = self._results.get(document_id)
            return result[0] if result is not None else None

    def get_page_texts(self, *, document_id: str) -> tuple[str, ...] | None:
        with self._lock:
            result = self._results.get(document_id)
            return result[1] if result is not None else None
