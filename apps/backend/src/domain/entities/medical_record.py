"""Representación intermedia y no persistida de información médica extraída."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Patient:
    """Datos del paciente obtenidos explícitamente de texto OCR."""

    name: str | None = None
    age: int | None = None


@dataclass(frozen=True)
class Medication:
    """Medicamento detectado sin inferir dosis ni frecuencia ausentes."""

    name: str
    dose: str | None = None
    frequency: str | None = None


@dataclass(frozen=True)
class ExtractionEvidence:
    """Referencia auditable a texto OCR; no representa una confianza clínica."""

    field: str
    value: str
    source_text: str
    match_type: str
    page: int | None = None
    confidence: float | None = None
    status: str = "pending_review"


@dataclass(frozen=True)
class MedicalRecord:
    """Agregado provisional para revisión humana; no es FHIR ni un modelo de base de datos."""

    patient: Patient | None = None
    diagnoses: tuple[str, ...] = field(default_factory=tuple)
    medications: tuple[Medication, ...] = field(default_factory=tuple)
    dates: tuple[str, ...] = field(default_factory=tuple)
    doctor: str | None = None
    institution: str | None = None
    evidence: tuple[ExtractionEvidence, ...] = field(default_factory=tuple)
