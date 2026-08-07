# Medical Information Extraction Plan

## 1. Current state

The backend already supports this working and unchanged processing path:

```text
Document upload → temporary storage → document preparation (PDF → PNG) → PaddleOCR
```

`POST /api/v1/documents/{document_id}/ocr` returns OCR text, page count, confidence, and processing time. The existing upload, preparation, and OCR endpoints—and their public response models—are out of scope for this initiative.

The next module consumes the resulting plain text. It does not improve OCR and does not approve or persist clinical information. Extracted values are provisional and must remain available for later physician review.

## 2. Objectives

Build an extensible, deterministic intermediate representation of medical information from OCR text.

- Extract only evidence explicitly present in the text.
- Use regexes, labels, dictionaries, line/section boundaries, and conservative normalization.
- Return missing scalar values as `null` and missing collections as empty lists.
- Never complete, correct, infer, translate, or clinically interpret missing data.
- Keep parsing independent from FastAPI, Swagger, PaddleOCR, storage, databases, LLMs, LangGraph, FHIR, and machine-learning packages.
- Preserve a future path from structured extraction to LLM assistance, human validation, FHIR mapping, and PostgreSQL without making this representation a database or FHIR model.

## 3. Proposed architecture

```text
HTTP / Swagger adapter (future)
        │ validates request, maps controlled errors
        ▼
ExtractMedicalInformationUseCase
        │ orchestration only
        ▼
MedicalInformationParser application service
        │ invokes independent deterministic extractors
        ▼
MedicalRecord domain entity
        │ framework-free structured representation
        ▼
MedicalInformationResponse application schema
        │ API serialization contract (future endpoint)
```

Dependency direction is inward:

```text
adapters → application → domain
infrastructure → application/domain interfaces (only when a future integration needs it)
```

`MedicalInformationParser` is a pure application service. It receives a text string and returns a domain entity; it imports no FastAPI, Pydantic, OCR, filesystem, or storage code. Its independently testable extractors include:

- `extract_patient(text)`
- `extract_diagnoses(text)`
- `extract_medications(text)`
- `extract_dates(text)`
- `extract_doctor(text)`
- `extract_institution(text)`

Additional extractors such as allergies, vital signs, and laboratory results will be added without changing existing extractor contracts.

### Boundary for future endpoint integration

The existing OCR response is returned to the caller and is not currently persisted as a reusable result. A later API phase must define a dedicated OCR-result retrieval port (with a privacy-conscious temporary adapter) before an endpoint can reliably extract by `document_id`. This is intentionally deferred: it avoids modifying the existing OCR contract or re-running OCR implicitly.

## 4. New files

```text
apps/backend/src/
├── domain/
│   └── entities/
│       └── medical_record.py
├── application/
│   ├── services/
│   │   └── medical_information_parser.py
│   ├── use_cases/
│   │   └── extract_medical_information.py
│   └── schemas/
│       └── medical_information.py
└── adapters/
    └── api/
        └── routes/
            └── document.py              # extended only in the later endpoint phase
```

No files in the existing upload, preparation, or OCR pipeline are changed during the parser component phase.

## 5. Responsibilities of every class

| Component | Layer | Responsibility |
|---|---|---|
| `Patient` | Domain | Immutable patient facts found explicitly: name and age, with nullable fields. |
| `Medication` | Domain | Explicit medication name plus independently optional dose and frequency. |
| `MedicalRecord` | Domain | Framework-free aggregate of extracted patient, diagnoses, medications, dates, doctor, and institution. |
| `MedicalInformationParser` | Application service | Coordinates pure, modular extraction functions, applies conservative normalization, and assembles `MedicalRecord`. |
| `ExtractMedicalInformationUseCase` | Application | Receives OCR text as input, calls the parser, and maps its domain result to an application response model. It contains no regex rules. |
| `PatientResponse`, `MedicationResponse`, `MedicalInformationResponse` | Application schema | Pydantic v2 response contracts and OpenAPI examples; no business extraction logic. |
| Future document extraction route | Adapter | Resolves dependencies, calls the use case, and maps only expected errors to HTTP responses. |

## 6. Data flow

1. An existing client runs the unchanged upload, preparation, and OCR flow.
2. A future integration retrieves the OCR text through an explicit OCR-result access boundary.
3. The adapter supplies that text to `ExtractMedicalInformationUseCase`.
4. The use case calls `MedicalInformationParser`.
5. Each extractor searches only its own labels, patterns, and bounded sections.
6. The parser removes exact duplicates, normalizes whitespace and known units without changing meaning, and creates `MedicalRecord`.
7. The use case serializes the result through `MedicalInformationResponse`.
8. The response is presented as provisional structured information for a later human-review step.

## 7. Sequence diagram

```text
Client        Existing OCR endpoint      Future result access       Extraction use case       Pure parser
  │                    │                         │                         │                     │
  │ POST /ocr          │                         │                         │                     │
  │───────────────────>│ PaddleOCR (unchanged)   │                         │                     │
  │<───────────────────│ text/confidence/pages   │                         │                     │
  │                    │                         │                         │                     │
  │ POST /extract (future)                       │                         │                     │
  │─────────────────────────────────────────────>│ retrieve OCR text       │                     │
  │                                               │────────────────────────>│ parse(text)         │
  │                                               │                         │────────────────────>│
  │                                               │                         │<────────────────────│ MedicalRecord
  │<─────────────────────────────────────────────│ structured JSON         │                     │
```

## 8. Development phases

1. **Domain model and schemas** — add `MedicalRecord`, nested domain types, and Pydantic output schemas. No parser rules and no endpoint changes.
2. **Pure parser foundation** — add `MedicalInformationParser` and `extract_patient`; establish explicit-null and normalization rules using synthetic test fixtures.
3. **Core clinical-text extractors** — add diagnoses, medications (name/dose/frequency), dates, doctor, and institution as separate functions.
4. **Extended fields** — add allergies, vital signs, laboratory results, and bounded notes with individual tests.
5. **Use case and OCR-result access port** — introduce the orchestration use case and a temporary result-retrieval abstraction without changing the public OCR response contract.
6. **Document extraction endpoint and OpenAPI** — add the new endpoint, documented response/error models, examples, and dependency wiring.
7. **Hardening and review readiness** — improve rule coverage from anonymized/synthetic fixtures, add PHI-safe observability, define data-retention rules, and document the human validation handoff.

Each phase requires approval before proceeding. The first approved implementation will be one component only.

## 9. Validation strategy

- Unit-test each extractor independently with synthetic Spanish OCR strings.
- Verify accents, line breaks, repeated whitespace, label variants, and common OCR spacing artifacts.
- Assert that absent evidence produces `null` or an empty list—not a guessed value.
- Assert that medication dose/frequency are omitted when not explicit.
- Assert that only text contained in a relevant labeled section is returned, preventing accidental capture of unrelated notes.
- Assert deterministic, duplicate-free output for identical input.
- Test the use case with a parser fake and the API adapter with dependency overrides once those components are implemented.
- Use no real patient data in fixtures, logs, Swagger examples, or error messages.
- Include regression tests confirming the existing upload, preparation, and OCR routes retain their paths, response models, and behavior.

## 10. Swagger testing plan

Swagger work is deferred until the endpoint phase. At that time:

1. Open `/docs` and verify the existing upload, prepare, and OCR operations remain unchanged.
2. Use a synthetic document containing explicit labels such as `Paciente`, `Edad`, `Diagnóstico`, and `Medicamentos`.
3. Run the existing pipeline through OCR and verify its current response unchanged.
4. Invoke the documented extraction operation with the OCR-associated document identifier.
5. Verify a `200` response with the typed structure below; values absent from the OCR text must be `null` or empty arrays.
6. Verify a nonexistent document returns documented `404`.
7. Verify a document with no available OCR result returns documented `422`.
8. Verify unexpected failures return a safe documented `500` that does not expose OCR text, PHI, or stack traces.
9. Inspect `/openapi.json` to confirm response schemas, examples, and error models are correctly published.

Expected future JSON example:

```json
{
  "patient": {
    "name": "Juan Pérez",
    "age": 54
  },
  "diagnoses": ["Hipertensión arterial"],
  "medications": [
    {"name": "Metformina", "dose": "850 mg", "frequency": "Cada 12 horas"},
    {"name": "Losartán", "dose": "50 mg", "frequency": null}
  ],
  "dates": [],
  "doctor": null,
  "institution": null
}
```

## Approval gate

This document is architecture only. No application code, dependency, route, response contract, OCR behavior, or existing endpoint has been modified. After approval, implementation will begin with **Phase 1: the domain model and schemas** only.
