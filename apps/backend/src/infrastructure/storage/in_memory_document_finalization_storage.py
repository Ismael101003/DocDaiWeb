from threading import Lock

from src.domain.entities.document_finalization import DocumentFinalization


class InMemoryDocumentFinalizationStorage:
    def __init__(self) -> None:
        self._items: dict[str, DocumentFinalization] = {}
        self._lock = Lock()
    def save(self, *, finalization: DocumentFinalization) -> None:
        with self._lock: self._items[finalization.document_id] = finalization
    def get(self, *, document_id: str) -> DocumentFinalization | None:
        with self._lock: return self._items.get(document_id)
