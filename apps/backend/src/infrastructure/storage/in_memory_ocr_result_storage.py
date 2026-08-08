"""Almacenamiento local en memoria para resultados OCR transitorios."""

from threading import Lock


class InMemoryOcrResultStorage:
    """Mantiene texto OCR únicamente durante la vida del proceso de la API."""

    def __init__(self) -> None:
        self._results: dict[str, str] = {}
        self._lock = Lock()

    def save(self, *, document_id: str, text: str) -> None:
        with self._lock:
            self._results[document_id] = text

    def get(self, *, document_id: str) -> str | None:
        with self._lock:
            return self._results.get(document_id)
