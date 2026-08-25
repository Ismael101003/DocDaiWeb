from typing import Protocol

from src.domain.entities.document_finalization import DocumentFinalization


class DocumentFinalizationStorage(Protocol):
    def save(self, *, finalization: DocumentFinalization) -> None: ...
    def get(self, *, document_id: str) -> DocumentFinalization | None: ...
