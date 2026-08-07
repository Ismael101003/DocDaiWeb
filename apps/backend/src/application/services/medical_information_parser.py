"""Reglas deterministas para convertir texto OCR en entidades médicas provisionales."""

import re
import unicodedata

from src.domain.entities.medical_record import ExtractionEvidence, MedicalRecord, Medication, Patient


_AGE_PATTERN = re.compile(r"\b(\d{1,3})\s*(?:años?|anos?)\b", re.IGNORECASE)
_DATE_PATTERN = re.compile(
    r"\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|"
    r"\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|"
    r"septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+\d{2,4})\b",
    re.IGNORECASE,
)
_DOSE_PATTERN = re.compile(
    r"\b\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ug|ml|ui|u\.i\.)\b",
    re.IGNORECASE,
)
_FREQUENCY_PATTERN = re.compile(
    r"\b(?:cada\s+\d+\s*(?:h|hrs?|horas?)|"
    r"c/\s*\d+\s*(?:h|hrs?|horas?)|"
    r"\d+\s+ve(?:z|ces)\s+al\s+d[ií]a|"
    r"diari[ao])\b",
    re.IGNORECASE,
)
_INSTRUCTION_PATTERN = re.compile(
    r"^(?:tomar|tom[eé]|administrar|aplicar|ingerir|usar|dosis|indicaciones?)\b",
    re.IGNORECASE,
)

_SECTION_LABELS = {
    "patient": ("paciente", "nombre", "nombre del paciente"),
    "diagnoses": ("diagnostico", "diagnosticos", "dx"),
    "medications": ("medicamento", "medicamentos", "tratamiento", "farmacos"),
    "doctor": ("medico tratante", "medico", "doctora", "doctor", "medica", "profesional tratante"),
    "institution": ("institucion", "hospital", "clinica", "unidad medica"),
}


def _normalize_for_match(value: str) -> str:
    """Normaliza solo para comparar etiquetas; nunca altera valores devueltos."""
    decomposed_value = unicodedata.normalize("NFD", value.lower())
    return "".join(character for character in decomposed_value if not unicodedata.combining(character))


def _clean_value(value: str) -> str:
    """Elimina artefactos de espacio y viñetas sin reinterpretar el contenido."""
    return re.sub(r"\s+", " ", value).strip(" \t:-–—•*.")


def _get_lines(text: str) -> list[str]:
    return [_clean_value(line) for line in text.splitlines()]


def _split_label(line: str, labels: tuple[str, ...]) -> str | None:
    """Devuelve el valor que sigue a una etiqueta o ``None`` si no coincide."""
    normalized_line = _normalize_for_match(line)
    for label in labels:
        match = re.match(
            rf"^{re.escape(label)}(?=\s|:|\-|–|—|$)\s*[:\-–—]?\s*(.*)$",
            normalized_line,
        )
        if match is not None:
            value_start, value_end = match.span(1)
            return _clean_value(line[value_start:value_end])
    return None


def _is_known_header(line: str) -> bool:
    normalized_line = _normalize_for_match(line).rstrip(":")
    if normalized_line in {"edad", "fecha", "sexo", "alergias", "signos vitales"}:
        return True
    if _split_label(line, ("edad", "fecha", "sexo", "alergias", "signos vitales")) is not None:
        return True
    return any(
        normalized_line in labels or _split_label(line, labels) is not None
        for labels in _SECTION_LABELS.values()
    )


def _extract_section(lines: list[str], labels: tuple[str, ...]) -> list[str]:
    """Obtiene líneas explícitamente bajo una etiqueta hasta la siguiente sección."""
    section_lines: list[str] = []
    is_collecting = False

    for line in lines:
        inline_value = _split_label(line, labels)
        if inline_value is not None:
            is_collecting = True
            if inline_value:
                section_lines.append(inline_value)
            continue

        if is_collecting and _is_known_header(line):
            break

        if is_collecting and line:
            section_lines.append(line)

    return section_lines


def extract_age(text: str) -> int | None:
    """Extrae una edad solo de una etiqueta ``Edad`` y un valor explícito en años."""
    for line in _get_lines(text):
        age_value = _split_label(line, ("edad",))
        if age_value is None:
            continue
        match = _AGE_PATTERN.search(age_value)
        if match is not None:
            return int(match.group(1))
    return None


def extract_patient(text: str) -> Patient | None:
    """Extrae el nombre etiquetado y la edad, sin deducir identidad del paciente."""
    lines = _get_lines(text)
    name: str | None = None
    patient_values = _extract_section(lines, _SECTION_LABELS["patient"])
    if patient_values:
        candidate = patient_values[0]
        if not _AGE_PATTERN.search(candidate):
            name = candidate

    age = extract_age(text)
    if name is None and age is None:
        return None
    return Patient(name=name, age=age)


def extract_diagnoses(text: str) -> tuple[str, ...]:
    """Extrae diagnósticos únicamente desde una sección etiquetada de diagnóstico."""
    diagnoses: list[str] = []
    for line in _extract_section(_get_lines(text), _SECTION_LABELS["diagnoses"]):
        diagnoses.extend(value for value in (_clean_value(item) for item in line.split(";")) if value)
    return tuple(dict.fromkeys(diagnoses))


def _normalize_frequency(value: str) -> str:
    cleaned_value = _clean_value(value)
    if cleaned_value.lower().startswith("cada"):
        return f"Cada{cleaned_value[4:]}"
    return cleaned_value


def extract_medications(text: str) -> tuple[Medication, ...]:
    """Extrae medicamentos de su sección, adjuntando instrucciones al último fármaco explícito."""
    medications: list[Medication] = []
    for line in _extract_section(_get_lines(text), _SECTION_LABELS["medications"]):
        frequency_match = _FREQUENCY_PATTERN.search(line)
        if _INSTRUCTION_PATTERN.match(line):
            if medications and frequency_match is not None:
                latest = medications[-1]
                medications[-1] = Medication(
                    name=latest.name,
                    dose=latest.dose,
                    frequency=_normalize_frequency(frequency_match.group(0)),
                )
            continue

        dose_match = _DOSE_PATTERN.search(line)
        name_end = len(line)
        if dose_match is not None:
            name_end = dose_match.start()
        if frequency_match is not None:
            name_end = min(name_end, frequency_match.start())
        candidate_name = _clean_value(line[:name_end])
        if not candidate_name:
            continue

        medications.append(
            Medication(
                name=candidate_name,
                dose=_clean_value(dose_match.group(0)) if dose_match else None,
                frequency=(
                    _normalize_frequency(frequency_match.group(0))
                    if frequency_match is not None
                    else None
                ),
            )
        )
    return tuple(medications)


def extract_dates(text: str) -> tuple[str, ...]:
    """Extrae fechas textuales explícitas sin convertirlas a un calendario clínico."""
    return tuple(dict.fromkeys(_DATE_PATTERN.findall(text)))


def _extract_single_line_value(text: str, field_name: str) -> str | None:
    values = _extract_section(_get_lines(text), _SECTION_LABELS[field_name])
    return values[0] if values else None


def extract_doctor(text: str) -> str | None:
    """Extrae el profesional solo cuando existe una etiqueta reconocida."""
    return _extract_single_line_value(text, "doctor")


def extract_institution(text: str) -> str | None:
    """Extrae una institución solo cuando existe una etiqueta reconocida."""
    return _extract_single_line_value(text, "institution")


def _source_line(lines: list[str], value: str) -> str:
    """Obtiene la línea OCR que respalda un valor ya extraído sin reconstruirlo."""
    normalized_value = _normalize_for_match(value)
    return next(
        (line for line in lines if normalized_value in _normalize_for_match(line)),
        value,
    )


def _build_evidence(text: str, record: MedicalRecord) -> tuple[ExtractionEvidence, ...]:
    """Construye metadatos de procedencia sin asignar confianza probabilística."""
    lines = _get_lines(text)
    evidence: list[ExtractionEvidence] = []

    def append(field: str, value: str) -> None:
        evidence.append(
            ExtractionEvidence(
                field=field,
                source_text=_source_line(lines, value),
                match_type="explicit_label_or_section",
            )
        )

    if record.patient is not None:
        if record.patient.name is not None:
            append("patient.name", record.patient.name)
        if record.patient.age is not None:
            append("patient.age", str(record.patient.age))
    for index, diagnosis in enumerate(record.diagnoses):
        append(f"diagnoses[{index}]", diagnosis)
    for index, medication in enumerate(record.medications):
        append(f"medications[{index}].name", medication.name)
        if medication.dose is not None:
            append(f"medications[{index}].dose", medication.dose)
        if medication.frequency is not None:
            append(f"medications[{index}].frequency", medication.frequency)
    for index, date in enumerate(record.dates):
        append(f"dates[{index}]", date)
    if record.doctor is not None:
        append("doctor", record.doctor)
    if record.institution is not None:
        append("institution", record.institution)
    return tuple(evidence)


class MedicalInformationParser:
    """Coordina extractores deterministas y no depende de infraestructura ni transporte."""

    def parse(self, text: str) -> MedicalRecord:
        """Convierte texto OCR no aprobado en una representación estructurada provisional."""
        if not isinstance(text, str):
            raise TypeError("El texto OCR debe ser una cadena.")

        record = MedicalRecord(
            patient=extract_patient(text),
            diagnoses=extract_diagnoses(text),
            medications=extract_medications(text),
            dates=extract_dates(text),
            doctor=extract_doctor(text),
            institution=extract_institution(text),
        )
        return MedicalRecord(
            patient=record.patient,
            diagnoses=record.diagnoses,
            medications=record.medications,
            dates=record.dates,
            doctor=record.doctor,
            institution=record.institution,
            evidence=_build_evidence(text, record),
        )
