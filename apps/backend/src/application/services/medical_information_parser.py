"""Reglas deterministas para convertir texto OCR en entidades médicas provisionales."""

from dataclasses import dataclass
from typing import Sequence
import re
import unicodedata

from src.application.services.ocr_text_postprocessor import normalize_ocr_pages
from src.domain.entities.medical_record import ExtractionEvidence, MedicalRecord, Medication, Patient


@dataclass(frozen=True)
class _LineContext:
    page: int | None
    text: str


_AGE_PATTERN = re.compile(r"\b(\d{1,3})\b")
_DATE_PATTERN = re.compile(
    r"\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|"
    r"\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|"
    r"septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+\d{2,4})\b",
    re.IGNORECASE,
)
_DOSE_PATTERN = re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ug|ml|ui|u\.i\.)\b", re.IGNORECASE)
_FREQUENCY_PATTERN = re.compile(
    r"\b(?:cada\s+\d+\s*(?:h|hrs?|horas?)|c/\s*\d+\s*(?:h|hrs?|horas?)|"
    r"(?:una|dos)\s+ve(?:z|ces)\s+al\s+d[ií]a|diari[ao]|seg[uú]n\s+(?:necesidad|indicaci[oó]n\s+m[eé]dica))\b",
    re.IGNORECASE,
)
_PRESENTATION_PATTERN = re.compile(
    r"\b(?:tabletas?|c[aá]psulas?|jarabe|gotas?|spray(?:\s+nasal)?|crema|ung[uü]ento|inyecci[oó]n(?:es)?)\b",
    re.IGNORECASE,
)
_INDICATION_PATTERN = re.compile(r"^(?:para|indicado\s+para)\s+.+", re.IGNORECASE)

_STOPWORDS = {"de", "del", "la", "el", "los", "las", "y", "en", "al", "a", "da", "do", "dos", "das"}
_PERSON_PREFIXES = ("dr", "dra", "doctor", "doctora", "medico", "medica")
_DATE_LABELS = (
    "fecha de consulta",
    "fecha de nacimiento",
    "fecha de ingreso",
    "fecha de expediente",
    "fecha de emision",
    "fecha de emisión",
    "fecha",
    "consulta",
)
_PATIENT_LABELS = (
    "nombre completo del paciente",
    "nombre del paciente",
    "datos del paciente",
    "paciente",
)
_DIAGNOSIS_LABELS = (
    "impresion diagnostica",
    "impresión diagnostica",
    "diagnosticos",
    "diagnostico",
    "dx",
)
_SECTION_TERMINATORS = (
    "antecedentes y observaciones",
    "antecedentes",
    "observaciones",
    "recomendaciones",
    "aviso legal",
    "advertencias",
)
_NOISE_PATTERNS = (
    "documento de prueba",
    "ejemplo ficticio",
    "sin validez medica",
    "documento generado exclusivamente para pruebas",
    "no es una receta real",
)
_MEDICATION_LABELS = (
    "medicamentos",
    "medicamento",
    "tratamiento",
    "prescripcion",
    "prescripción",
    "receta",
    "indicaciones",
    "farmacos",
    "farmaco",
)
_DOCTOR_LABELS = (
    "medico tratante",
    "profesional tratante",
    "doctor",
    "doctora",
    "medico",
    "medica",
    "dra",
    "dr",
)
_INSTITUTION_LABELS = (
    "institucion",
    "hospital",
    "clinica",
    "centro medico",
    "centro de salud",
    "unidad medica",
    "servicio",
)
_KNOWN_HEADERS = (
    _DATE_LABELS
    + _PATIENT_LABELS
    + _DIAGNOSIS_LABELS
    + _MEDICATION_LABELS
    + _DOCTOR_LABELS
    + _INSTITUTION_LABELS
    + ("edad", "sexo", "alergias", "signos vitales")
)


def _normalize_for_match(value: str) -> str:
    """Normaliza solo para comparar etiquetas; nunca altera valores devueltos."""
    decomposed_value = unicodedata.normalize("NFD", value.lower())
    return "".join(character for character in decomposed_value if not unicodedata.combining(character))


def _clean_value(value: str) -> str:
    """Elimina artefactos de espacio y viñetas sin reinterpretar el contenido."""
    return re.sub(r"\s+", " ", value).strip(" \t:-–—•*.")


def _get_line_contexts(text: str, *, page_texts: Sequence[str] | None = None) -> list[_LineContext]:
    normalized_pages = normalize_ocr_pages(page_texts if page_texts is not None else text)
    line_contexts: list[_LineContext] = []
    for page in normalized_pages:
        for raw_line in page.text.splitlines():
            line_contexts.append(_LineContext(page=page.page, text=raw_line.rstrip()))
    return line_contexts


def _split_label(line: str, labels: tuple[str, ...]) -> str | None:
    """Devuelve el valor que sigue a una etiqueta o ``None`` si no coincide."""
    stripped_line = line.strip()
    normalized_line = _normalize_for_match(stripped_line)
    for label in labels:
        normalized_label = _normalize_for_match(label)
        if not normalized_line.startswith(normalized_label):
            continue
        remainder = stripped_line[len(label) :]
        if not remainder:
            return ""
        separator = remainder.lstrip()[:1]
        if separator not in {":", "-", "–", "—"}:
            continue
        return _clean_value(remainder.lstrip()[1:])
    return None


def _is_known_header(line: str) -> bool:
    normalized_line = _normalize_for_match(line).rstrip(":")
    if not normalized_line:
        return False
    if normalized_line in _SECTION_TERMINATORS or normalized_line in {"edad", "sexo", "alergias", "signos vitales"}:
        return True
    return _split_label(line, _KNOWN_HEADERS) is not None


def _extract_section(lines: list[_LineContext], labels: tuple[str, ...]) -> list[_LineContext]:
    """Obtiene líneas explícitamente bajo una etiqueta hasta la siguiente sección."""
    section_lines: list[_LineContext] = []
    is_collecting = False

    for line in lines:
        inline_value = _split_label(line.text, labels)
        if inline_value is not None:
            is_collecting = True
            if inline_value:
                section_lines.append(_LineContext(page=line.page, text=inline_value))
            continue

        if is_collecting and _is_known_header(line.text):
            break

        if is_collecting and line.text:
            section_lines.append(line)

    return section_lines


def _is_document_noise(value: str) -> bool:
    normalized_value = _normalize_for_match(value)
    return any(pattern in normalized_value for pattern in _NOISE_PATTERNS)


def _tokenize(value: str) -> list[str]:
    return [token for token in re.split(r"\s+", _clean_value(value)) if token]


def _is_person_name(value: str) -> bool:
    tokens = _tokenize(value)
    if len(tokens) < 2:
        return False

    normalized_tokens = [_normalize_for_match(token) for token in tokens]
    if any(token in _STOPWORDS for token in normalized_tokens):
        return False

    if normalized_tokens[0].rstrip(".") in _PERSON_PREFIXES:
        return len(tokens) >= 2

    alpha_tokens = [token for token in tokens if re.search(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]", token)]
    return len(alpha_tokens) >= 2


def _is_institution_name(value: str) -> bool:
    tokens = _tokenize(value)
    if len(tokens) < 2:
        return False

    normalized_value = _normalize_for_match(value)
    normalized_tokens = [_normalize_for_match(token) for token in tokens]
    if all(token in _STOPWORDS for token in normalized_tokens):
        return False

    if any(keyword in normalized_value for keyword in ("hospital", "clinica", "centro medico", "centro de salud", "unidad medica", "institucion", "laboratorio", "consultorio", "servicio", "sapi", "sa de cv", "s. a. de c. v.", "s.a. de c.v.")):
        return True

    return any(len(token) >= 4 for token in normalized_tokens)


def _meaningful_candidate(value: str) -> bool:
    tokens = _tokenize(value)
    if not tokens:
        return False
    normalized_tokens = [_normalize_for_match(token) for token in tokens]
    return any(token not in _STOPWORDS for token in normalized_tokens)


def extract_age(lines: list[_LineContext]) -> int | None:
    """Extrae una edad solo de una etiqueta explícita y un valor numérico visible."""
    for line in lines:
        age_value = _split_label(line.text, ("edad",))
        if age_value is None:
            continue

        match = _AGE_PATTERN.search(age_value)
        if match is not None:
            return int(match.group(1))
    return None


def extract_patient(lines: list[_LineContext]) -> Patient | None:
    """Extrae nombre y edad solo desde evidencia explícita de paciente."""
    name: str | None = None
    patient_values = _extract_section(lines, _PATIENT_LABELS)
    if patient_values:
        for candidate in patient_values:
            if _is_person_name(candidate.text):
                name = candidate.text
                break

    age = extract_age(lines)
    if name is None and age is None:
        return None
    return Patient(name=name, age=age)


def extract_diagnoses(lines: list[_LineContext]) -> tuple[str, ...]:
    """Extrae diagnósticos únicamente desde una sección etiquetada de diagnóstico."""
    diagnoses: list[str] = []
    for line in _extract_section(lines, _DIAGNOSIS_LABELS):
        for item in re.split(r"[;\n•]+", line.text):
            cleaned_item = _clean_value(item)
            if cleaned_item and _meaningful_candidate(cleaned_item):
                diagnoses.append(cleaned_item)
    return tuple(dict.fromkeys(diagnoses))


def _normalize_frequency(value: str) -> str:
    cleaned_value = _clean_value(value)
    if cleaned_value.lower().startswith("cada"):
        return f"Cada{cleaned_value[4:]}"
    return cleaned_value


def _prefer_frequency(current: str | None, candidate: str | None) -> str | None:
    """Conserva la frecuencia explícita más concreta sin inferir una combinación."""
    if candidate is None:
        return current
    if current is None:
        return candidate
    if _normalize_for_match(current).startswith("segun") and not _normalize_for_match(candidate).startswith("segun"):
        return candidate
    return current


def _is_medication_instruction(line: str) -> bool:
    normalized_line = _normalize_for_match(line)
    return normalized_line.startswith(("tomar", "administrar", "aplicar", "ingerir", "usar", "dosis", "indicaciones", "indicacion", "recomendaciones", "consultar", "mantener", "vigilar"))


def _is_medication_name_candidate(value: str) -> bool:
    if _is_document_noise(value) or _is_medication_instruction(value):
        return False
    tokens = _tokenize(value)
    if not tokens or len(tokens) > 5:
        return False
    normalized_value = _normalize_for_match(value)
    if _FREQUENCY_PATTERN.search(value) or _PRESENTATION_PATTERN.fullmatch(value.strip()):
        return False
    return bool(re.fullmatch(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s-]+", value.strip())) and "receta medica" not in normalized_value


def extract_medications(lines: list[_LineContext]) -> tuple[Medication, ...]:
    """Extrae medicamentos solo desde una sección explícita y con patrones claros."""
    medications: list[Medication] = []

    for line in _extract_section(lines, _MEDICATION_LABELS):
        text = line.text
        if not text:
            continue

        if _is_document_noise(text):
            continue
        frequency_match = _FREQUENCY_PATTERN.search(text)
        dose_match = _DOSE_PATTERN.search(text)
        presentation_match = _PRESENTATION_PATTERN.search(text)
        indication_match = _INDICATION_PATTERN.match(_clean_value(text))

        if medications and (frequency_match or presentation_match or indication_match) and not _is_medication_name_candidate(text):
            latest = medications[-1]
            medications[-1] = Medication(
                name=latest.name,
                dose=latest.dose or (_clean_value(dose_match.group(0)) if dose_match else None),
                frequency=_prefer_frequency(latest.frequency, _normalize_frequency(frequency_match.group(0)) if frequency_match else None),
                presentation=latest.presentation or (_clean_value(presentation_match.group(0)) if presentation_match else None),
                indication=latest.indication or (_clean_value(indication_match.group(0)) if indication_match else None),
            )
            continue

        name_end = min((match.start() for match in (dose_match, frequency_match, presentation_match) if match is not None), default=len(text))
        name_candidate = _clean_value(text[:name_end])
        if not _is_medication_name_candidate(name_candidate):
            continue
        medications.append(Medication(
            name=name_candidate,
            dose=_clean_value(dose_match.group(0)) if dose_match else None,
            frequency=_normalize_frequency(frequency_match.group(0)) if frequency_match else None,
            presentation=_clean_value(presentation_match.group(0)) if presentation_match else None,
            indication=_clean_value(indication_match.group(0)) if indication_match else None,
        ))

    return tuple(medications)


def extract_dates(lines: list[_LineContext]) -> tuple[str, ...]:
    """Extrae fechas solo cuando el texto ofrece una etiqueta explícita."""
    dates: list[str] = []
    for line in lines:
        date_value = _split_label(line.text, _DATE_LABELS)
        if date_value is None:
            continue

        match = _DATE_PATTERN.search(date_value)
        if match is not None:
            dates.append(match.group(0))
            continue

    return tuple(dict.fromkeys(dates))


def _extract_single_line_value(lines: list[_LineContext], labels: tuple[str, ...]) -> _LineContext | None:
    section_values = _extract_section(lines, labels)
    return section_values[0] if section_values else None


def extract_doctor(lines: list[_LineContext]) -> str | None:
    """Extrae el profesional solo cuando existe una etiqueta reconocida y un nombre plausible."""
    candidate = _extract_single_line_value(lines, _DOCTOR_LABELS)
    if candidate is None or not _is_person_name(candidate.text):
        return None
    return candidate.text


def extract_institution(lines: list[_LineContext]) -> str | None:
    """Extrae una institución solo cuando existe una etiqueta reconocida y el valor es plausible."""
    candidate = _extract_single_line_value(lines, _INSTITUTION_LABELS)
    if candidate is None or not _is_institution_name(candidate.text):
        return None
    return candidate.text


def _source_line(lines: list[_LineContext], value: str) -> _LineContext:
    """Obtiene la línea OCR que respalda un valor ya extraído sin reconstruirlo."""
    normalized_value = _normalize_for_match(value)
    return next(
        (line for line in lines if normalized_value in _normalize_for_match(line.text)),
        _LineContext(page=None, text=value),
    )


def _build_evidence(lines: list[_LineContext], record: MedicalRecord) -> tuple[ExtractionEvidence, ...]:
    """Construye metadatos de procedencia sin asignar confianza probabilística."""
    evidence: list[ExtractionEvidence] = []

    def append(field: str, value: str) -> None:
        source_line = _source_line(lines, value)
        evidence.append(
            ExtractionEvidence(
                field=field,
                value=value,
                source_text=source_line.text,
                match_type="explicit_label_or_section",
                page=source_line.page,
                status="pending_review",
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
        if medication.presentation is not None:
            append(f"medications[{index}].presentation", medication.presentation)
        if medication.indication is not None:
            append(f"medications[{index}].indication", medication.indication)
    for index, date in enumerate(record.dates):
        append(f"dates[{index}]", date)
    if record.doctor is not None:
        append("doctor", record.doctor)
    if record.institution is not None:
        append("institution", record.institution)
    return tuple(evidence)


class MedicalInformationParser:
    """Coordina extractores deterministas y no depende de infraestructura ni transporte."""

    def parse(self, text: str, *, page_texts: Sequence[str] | None = None) -> MedicalRecord:
        """Convierte texto OCR no aprobado en una representación estructurada provisional."""
        if not isinstance(text, str):
            raise TypeError("El texto OCR debe ser una cadena.")

        lines = _get_line_contexts(text, page_texts=page_texts)
        record = MedicalRecord(
            patient=extract_patient(lines),
            diagnoses=extract_diagnoses(lines),
            medications=extract_medications(lines),
            dates=extract_dates(lines),
            doctor=extract_doctor(lines),
            institution=extract_institution(lines),
        )
        return MedicalRecord(
            patient=record.patient,
            diagnoses=record.diagnoses,
            medications=record.medications,
            dates=record.dates,
            doctor=record.doctor,
            institution=record.institution,
            evidence=_build_evidence(lines, record),
        )
