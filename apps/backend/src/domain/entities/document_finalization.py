"""Resultado mínimo persistible de finalizar un documento."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID


@dataclass(frozen=True)
class DocumentFinalization:
    document_id: str
    action: Literal["created", "updated", "ambiguous_match"]
    status: Literal["finalized", "ambiguous_match"]
    patient_id: UUID | None
    match_identifier: str | None
    finalized_at: datetime
    match_source: str = "patient_matching"
    candidate_patient_ids: tuple[UUID, ...] = ()
