"""Contratos Pydantic para información médica provisional extraída de OCR."""

from pydantic import BaseModel, Field


class PatientInformationResponse(BaseModel):
    """Datos demográficos explícitos, sin completar valores faltantes."""

    name: str | None = Field(
        default=None,
        description="Nombre del paciente solo cuando aparece explícitamente en el texto OCR.",
        examples=["Juan Pérez"],
    )
    age: int | None = Field(
        default=None,
        ge=0,
        le=130,
        description="Edad en años solo cuando el texto OCR la expresa explícitamente.",
        examples=[54],
    )


class MedicationResponse(BaseModel):
    """Medicamento extraído de forma determinista y pendiente de revisión humana."""

    name: str = Field(
        min_length=1,
        description="Nombre explícitamente detectado del medicamento.",
        examples=["Metformina"],
    )
    dose: str | None = Field(
        default=None,
        description="Dosis textual explícita; es nula si no fue encontrada.",
        examples=["850 mg"],
    )
    frequency: str | None = Field(
        default=None,
        description="Frecuencia textual explícita; es nula si no fue encontrada.",
        examples=["Cada 12 horas"],
    )


class ExtractionEvidenceResponse(BaseModel):
    """Evidencia OCR para revisión humana, sin confianza de parser inventada."""

    field: str = Field(description="Ruta del campo estructurado que la evidencia respalda.")
    value: str = Field(description="Valor estructurado propuesto por el parser.")
    source_text: str = Field(description="Texto OCR literal empleado por la regla.")
    match_type: str = Field(description="Tipo de regla determinista aplicada.")
    page: int | None = Field(default=None, description="Página OCR si el origen la proporciona.")
    confidence: float | None = Field(
        default=None,
        description="No se calcula para reglas regex; no equivale a confianza OCR.",
    )
    status: str = Field(
        default="pending_review",
        description="Estado inicial de la evidencia, siempre pendiente de revisión humana.",
    )


class MedicalInformationResponse(BaseModel):
    """Representación intermedia sin aprobación clínica, FHIR ni persistencia."""

    patient: PatientInformationResponse | None = Field(
        default=None,
        description="Datos de paciente detectados explícitamente.",
    )
    diagnoses: list[str] = Field(
        default_factory=list,
        description="Diagnósticos explícitamente detectados; no son una interpretación clínica.",
        examples=[["Hipertensión arterial"]],
    )
    medications: list[MedicationResponse] = Field(
        default_factory=list,
        description="Medicamentos detectados; cada campo opcional conserva la ausencia de evidencia.",
    )
    dates: list[str] = Field(
        default_factory=list,
        description="Fechas textuales explícitamente presentes en el OCR, sin normalización clínica todavía.",
        examples=[["12/03/2026"]],
    )
    doctor: str | None = Field(
        default=None,
        description="Profesional explícitamente identificado en el texto OCR.",
        examples=["Dra. Ana Gómez"],
    )
    institution: str | None = Field(
        default=None,
        description="Institución explícitamente identificada en el texto OCR.",
        examples=["Clínica Central"],
    )
    evidence: list[ExtractionEvidenceResponse] = Field(
        default_factory=list,
        description="Evidencia trazable de cada dato detectado para revisión humana.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "patient": {"name": "Juan Pérez", "age": 54},
                    "diagnoses": ["Hipertensión arterial"],
                    "medications": [
                        {
                            "name": "Metformina",
                            "dose": "850 mg",
                            "frequency": "Cada 12 horas",
                        },
                        {"name": "Losartán", "dose": "50 mg", "frequency": None},
                    ],
                    "dates": [],
                    "doctor": None,
                    "institution": None,
                }
            ]
        }
    }
