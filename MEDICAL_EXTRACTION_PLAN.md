# Medical Information Extraction Plan

## 1. Architecture

This stage extends the OCR pipeline with deterministic extraction only. It does not use an LLM, database, FHIR, LangGraph, or any external NLP model.

```text
Upload (unchanged)
  ↓
Prepare (unchanged)
  ↓
OCR (unchanged API contract)
  ↓
Temporary OCR result store
  ↓
ExtractMedicalInformationUseCase
  ↓
MedicalInformationExtractor port
  ↓
RegexMedicalExtractor adapter
  ↓
MedicalParser (normalization and aggregation)
  ↓
MedicalInformationResponse
```

Dependency direction:

```text
FastAPI router -> application use case -> domain interfaces
infrastructure extraction adapters --------------------^ 
```

The router will only resolve dependencies, call the use case, and translate controlled errors to HTTP responses. Extraction rules will never be placed in FastAPI routes.

### Important prerequisite: transient OCR result access

The current OCR endpoint returns text but does not persist it. Therefore `POST /documents/{document_id}/extract` cannot reliably determine whether OCR ran without either re-running OCR or storing the result. Re-running OCR violates the required `422 OCR has not been executed` behavior.

The plan introduces an `OcrResultStore` domain port backed initially by a process-local, TTL-bound in-memory adapter. The existing OCR endpoint keeps the same path, request, and response shape; internally, its existing use case will place its response in this temporary store. This is not a database or clinical persistence mechanism. It is a short-lived handoff and must be replaced by a shared cache/queue before multi-worker deployment.

## 2. New Folders

```text
apps/backend/src/
├── application/
│   ├── schemas/
│   │   └── medical_information.py
│   ├── services/
│   │   └── medical_parser.py
│   └── use_cases/
│       └── extract_medical_information.py
├── domain/
│   └── interfaces/
│       ├── medical_information_extractor.py
│       └── ocr_result_store.py
└── infrastructure/
    └── extraction/
        ├── regex_medical_extractor.py
        └── in_memory_ocr_result_store.py
```

`medical_parser.py` is placed in `application/services/`, rather than a top-level `services/` folder, to respect the existing Clean Architecture layout. It remains framework-free and deterministic.

## 3. New Classes

| Class / model | Layer | Responsibility |
|---|---|---|
| `MedicalInformationExtractor` | Domain port | Defines `extract(text) -> MedicalInformation` without knowing regex, FastAPI, or storage. |
| `OcrResultStore` | Domain port | Retrieves and temporarily stores an OCR response by document ID. |
| `RegexMedicalExtractor` | Infrastructure | Finds candidate facts using compiled regexes, keywords, dictionaries, and explicit normalization. |
| `MedicalParser` | Application service | Merges candidates, removes exact duplicates, normalizes whitespace/units, calculates deterministic confidence, and lists unknown fields. |
| `ExtractMedicalInformationUseCase` | Application | Gets OCR text, delegates extraction/parser work, and returns the Pydantic response. |
| `InMemoryOcrResultStore` | Infrastructure | TTL-bound, non-persistent OCR handoff for the initial single-process implementation. |
| `MedicalInformationResponse` | Application schema | Public JSON contract for structured but unapproved information. |
| `Medication` / `LaboratoryResult` | Application schema | Typed nested response objects with nullable fields where evidence is incomplete. |

## 4. Data Flow

1. A client uploads and prepares a document through existing endpoints.
2. The existing OCR endpoint produces the current OCR response unchanged and places that response in the temporary OCR result store.
3. The client calls `POST /api/v1/documents/{document_id}/extract`.
4. `ExtractMedicalInformationUseCase` verifies the original document exists; otherwise it raises a controlled not-found error.
5. It obtains the temporary OCR response. If absent or expired, it raises `OCRNotExecutedError` for HTTP 422.
6. `RegexMedicalExtractor` produces only values explicitly supported by text patterns.
7. `MedicalParser` normalizes and aggregates candidates without inferring missing data.
8. The use case returns `MedicalInformationResponse` with `null` for undetected scalar fields and `unknown_fields` for unresolved categories.

## 5. Sequence Diagram

```text
Client          Documents Router     OCR Use Case     OCR Result Store
  | POST /ocr          |                   |                 |
  |------------------->|------------------>|                 |
  |                    |                   | put(result)     |
  |                    |                   |---------------->|
  |<-------------------|<------------------|                 |

Client          Documents Router     Extraction Use Case   Regex Extractor
  | POST /extract      |                    |                    |
  |------------------->|------------------->|                    |
  |                    |                    | get(document_id)   |
  |                    |                    |-------------------> OCR Result Store
  |                    |                    |<------------------- OCR text
  |                    |                    | extract(text)      |
  |                    |                    |------------------->|
  |                    |                    |<------------------- candidates
  |                    |                    | parse/normalize
  |<-------------------|<-------------------| structured JSON
```

## 6. Deterministic Extraction Scope

Initial patterns will target Spanish clinical-document labels and only return a value when the label and value are both present. Examples include `Paciente:`, `Edad:`, `Sexo:`, `Fecha:`, `Médico/Dr./Dra.`, `Cédula`, `Diagnóstico`, `Alergias`, and `Signos vitales`.

Medication extraction requires explicit evidence of a medication name and captures dose/frequency only when written. Laboratory extraction requires an analyte label plus numeric value; units remain `null` when absent. Notes retain only explicitly labeled free text. The parser will not translate, correct, complete, or clinically interpret OCR text.

Confidence is deterministic evidence coverage, not medical certainty: it is derived from validated pattern matches and OCR confidence already available in the temporary OCR result. It must be documented as a technical extraction signal and never used for automatic approval.

## 7. Phased Implementation

- [ ] **Phase 1 — Contracts and response schema:** introduce medical Pydantic models, `MedicalInformationExtractor`, and `OcrResultStore` ports. No endpoint behavior changes and no regex rules yet.
- [ ] **Phase 2 — OCR handoff:** add the TTL-bound in-memory result-store adapter and inject it into existing OCR composition without changing the public OCR endpoint contract.
- [ ] **Phase 3 — Core deterministic extractor:** implement patient demographics, date, doctor, license, diagnosis, allergies, and notes in `RegexMedicalExtractor`.
- [ ] **Phase 4 — Medication and laboratory rules:** add typed medication, vital-sign, and laboratory extraction with normalization and fixture tests.
- [ ] **Phase 5 — Extraction endpoint:** add documented `POST /api/v1/documents/{document_id}/extract`, controlled 404/422/500 mappings, and Swagger examples.
- [ ] **Phase 6 — Hardening:** expand dictionaries, define TTL/retention configuration, add observability without PHI, and document the future shared-store boundary.

Each phase is separately approved. No phase changes upload validation, temporary upload storage semantics, PDF/image preparation behavior, or the public OCR endpoint contract.

## 8. Testing Plan

Unit tests use non-clinical synthetic OCR strings and a fake `OcrResultStore`:

- Explicit demographics produce normalized values.
- Missing labels produce `null`, never guessed values.
- Medication with only a name yields `dose: null` and `frequency: null`.
- Laboratory values require numeric evidence; malformed values are ignored.
- Duplicate explicit matches collapse deterministically.
- OCR text with no known pattern returns empty lists, nullable fields, and populated `unknown_fields`.
- A missing source document raises the not-found application error.
- A document without a temporary OCR result raises `OCRNotExecutedError`.

Tests must include names with accents, common OCR whitespace errors, and noisy labels. No test fixture may contain real patient information.

## 9. Swagger Validation Plan

After Phase 5:

1. Open `/docs` using the project virtual environment.
2. Upload a synthetic PDF/PNG through the existing upload endpoint.
3. Call the existing prepare endpoint.
4. Call the existing OCR endpoint and confirm its current response remains unchanged.
5. Call `POST /api/v1/documents/{document_id}/extract` with the returned document ID.
6. Verify a `200` response includes `status: "structured"`, typed lists, nullable missing values, `unknown_fields`, and deterministic confidence.
7. Verify a nonexistent ID returns `404`.
8. Upload and prepare a second document but do not run OCR; verify `/extract` returns `422`.
9. Verify malformed internal extractor input is mapped to a safe `500` without OCR text or stack traces in the error body.
10. Inspect `/openapi.json` to confirm the upload, prepare, and OCR operations have unchanged paths and response models.

## 10. Proposed Public Response

```json
{
  "document_id": "...",
  "status": "structured",
  "patient_name": "Juan Pérez",
  "age": 42,
  "sex": "male",
  "date": "2026-08-05",
  "doctor": "Dra. Ana Gómez",
  "professional_license": "1234567",
  "diagnosis": ["Hipertensión"],
  "medications": [{"name": "Metformina", "dose": "850 mg", "frequency": "Cada 12 horas"}],
  "laboratory_results": [{"test": "Glucosa", "value": "110", "unit": "mg/dL"}],
  "allergies": [],
  "vital_signs": [],
  "notes": null,
  "unknown_fields": ["allergies", "notes"],
  "confidence": 0.76
}
```

All values in this response remain provisional and require later human review. This plan introduces no clinical decisions, persistence, or automatic approvals.

## Approval Gate

This plan is intentionally implementation-free. After approval, only **Phase 1 — Contracts and response schema** will be implemented, including code, technical rationale, Clean Architecture rationale, Swagger test instructions, and a suggested Git commit.
