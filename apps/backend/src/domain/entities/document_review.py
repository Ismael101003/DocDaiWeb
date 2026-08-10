"""Entidades de dominio para la revisión humana de documentos clínicos."""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass(frozen=True)
class ReviewedField:
    """Representa un campo revisado conservando el valor original y el final."""

    field: str
    original_value: str
    value: str
    status: str
    source_text: str
    match_type: str
    page: int | None = None
    confidence: float | None = None


@dataclass(frozen=True)
class DocumentReview:
    """Snapshot auditable de una revisión humana para un documento concreto."""

    document_id: str
    status: str
    reviewed_at: datetime
    reviewed_fields: tuple[ReviewedField, ...] = field(default_factory=tuple)
    reviewed_by: str | None = None
    patient_name: str | None = None
