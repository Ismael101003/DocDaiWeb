# OCR Migration Plan

## Current State

DocDaiWeb already has a clean document pipeline:

```text
Upload -> temporary storage -> document preparation -> prepared PNG pages -> OCR endpoint
```

The upload and preparation stages validate input, store it temporarily, convert PDF pages to PNG, normalize images, and expose `POST /api/v1/documents/{document_id}/prepare`. These stages are out of scope and must remain unchanged.

The OCR layer already contains a first `OcrProvider` port, a `PaddleOcrProvider` adapter, `ExtractTextUseCase`, Pydantic OCR response models, local prepared-image lookup, and `POST /api/v1/documents/{document_id}/ocr`. Its next improvement should focus on predictable model lifecycle, richer page-level output, OCR-safe preprocessing, and deterministic post-processing. Results must remain unapproved until the future human-review stage.

## Components to Reuse

| Reference component | Purpose | Why migrate it | Destination | Difficulty | Required adaptation |
|---|---|---|---|---|---|
| OCRRunner | Coordinates an OCR invocation and page-level results | It isolates PaddleOCR calling conventions and normalizes provider output | `infrastructure/ocr/paddle_provider.py` | Medium | Keep it as an adapter implementing `OcrProvider`; remove jobs, HTTP, files outside prepared storage, and persistence concerns. |
| ModelLoader | Loads and caches PaddleOCR models with explicit configuration | Model initialization is expensive and was the source of the current first-run delay | `infrastructure/ocr/model_loader.py` plus an `OcrModelLoader` port if multiple runtimes are needed | Medium | Lazy-load once per process, expose Spanish model/configuration, surface controlled `OcrEngineError`, and avoid global mutable singletons. |
| ImagePreprocessor | Applies OCR-specific image cleanup | It can improve recognition of low-contrast scans after the existing general normalization stage | `infrastructure/ocr/ocr_image_preprocessor.py` | Medium | It must receive only prepared PNGs, produce temporary derived images, be configurable, and never replace `ImageProcessor` or alter `/prepare`. |
| LayoutDetector | Detects document regions and reading order | It is useful for multi-column reports, prescriptions, and clinical forms | `domain/interfaces/layout_detector.py`, `infrastructure/ocr/paddle_layout_detector.py` | High | Introduce only after basic OCR is stable; return neutral regions, make it optional by configuration, and keep fallback OCR for layout failures. |
| PostProcessor | Cleans, orders, and consolidates OCR lines | It makes output deterministic and preserves page boundaries for later clinical extraction and review | `application/services/ocr_post_processor.py` | Low | Keep it pure Python and domain-neutral; never infer, correct, or approve clinical facts. |

## Components NOT to Reuse

| Reference component | Reason not to migrate |
|---|---|
| LangGraph workflow and nodes | DocDaiWeb has not introduced workflow orchestration; adding it now would violate sprint scope and create premature coupling. |
| OCR job manager, WebSockets, cancellation, and subprocess runner | These are operational scaling features, not required for the synchronous OCR endpoint. They can be designed later around a queue. |
| PostgreSQL, pgvector, metadata JSON, audit persistence, and RAG | OCR results must not be persisted in this sprint and patient data must not be copied into a separate local metadata store. |
| SEMAR protection classification, duplicate detection, and naval rules | They are source-project business rules and do not belong to the medical domain. |
| PDF/DOCX/PPTX conversion utilities | DocDaiWeb already owns PDF-to-PNG preparation; duplicating it would break the established pipeline. |
| Flutter-specific UI and review implementation | DocDaiWeb's future review UI must be designed independently, while preserving the human-in-the-loop requirement. |

## New Architecture

```text
Upload (unchanged)
  ↓
Prepare Document (unchanged)
  ↓
PreparedDocumentStorage port
  ↓
Optional OCR Image Preprocessor
  ↓
Model Loader
  ↓
OcrProvider port ← PaddleOcrProvider
  ↓
OCR page results
  ↓
OCR Post Processor
  ↓
ExtractTextUseCase
  ↓
Pydantic OCR response (unapproved)
```

Dependency direction remains inward:

```text
FastAPI adapter -> application use case -> domain ports
infrastructure OCR adapters ----------------------^ 
```

The router only resolves dependencies, delegates to `ExtractTextUseCase`, and maps controlled errors to HTTP responses. The use case never imports PaddleOCR, OpenCV, FastAPI, or storage-path implementation details.

## Folder Mapping

| Old Project | DocDaiWeb destination | Role in DocDaiWeb |
|---|---|---|
| `services/ocr/ocr_runner.py` | `src/infrastructure/ocr/paddle_provider.py` | PaddleOCR adapter and result normalization. |
| `services/ocr/model_loader.py` | `src/infrastructure/ocr/model_loader.py` | Lazy, configured model lifecycle. |
| `services/ocr/image_preprocessor.py` | `src/infrastructure/ocr/ocr_image_preprocessor.py` | Optional OCR-specific cleanup of prepared images. |
| `services/ocr/layout_detector.py` | `src/infrastructure/ocr/paddle_layout_detector.py` | Optional layout adapter. |
| `services/ocr/postprocessor.py` | `src/application/services/ocr_post_processor.py` | Pure text/line consolidation. |
| `services/ocr/types.py` | `src/domain/interfaces/ocr_provider.py` and `src/application/schemas/ocr.py` | Domain result objects and API contracts. |
| `services/ocr/engine.py` | `src/application/use_cases/extract_text.py` plus dependency composition | Use-case orchestration, not a global engine singleton. |

## Migration Order

- [ ] **Phase 1 — Model lifecycle:** add `ModelLoader`, configuration, controlled initialization errors, and tests with a fake loader. Do not alter the OCR API shape.
- [ ] **Phase 2 — Page result contract:** extend the OCR port and Pydantic schema with page/line metadata required for review while preserving the current aggregate response fields.
- [ ] **Phase 3 — Post-processing:** add a pure `OcrPostProcessor` for line ordering, blank-line handling, page separation, and confidence aggregation. No medical interpretation.
- [ ] **Phase 4 — OCR-specific preprocessing:** add an optional adapter applied only after `/prepare`; compare baseline versus preprocessed OCR quality using non-clinical fixtures.
- [ ] **Phase 5 — Layout detection:** add an optional `LayoutDetector` port and Paddle implementation for complex forms; retain plain OCR as a fallback.
- [ ] **Phase 6 — Production hardening:** define model warm-up policy, concurrency limits, metrics, temporary-artifact retention, and a future asynchronous execution boundary.

Each phase is a separate approval and implementation. No phase changes upload, temporary storage semantics, PDF conversion, or preparation endpoint behavior.

## Risks

- **Cold start and model downloads:** PaddleOCR model initialization can exceed HTTP time limits. Model loader configuration and warm-up must be explicit.
- **PaddleOCR version drift:** v2 and v3 return different structures. The adapter must normalize results behind the `OcrProvider` port and be tested against the installed version.
- **CPU and memory pressure:** multi-page medical documents can be expensive. Concurrency and page limits need operational controls before production scale.
- **Image enhancement regression:** aggressive thresholding, denoising, or resizing can erase handwritten marks or clinical values. OCR preprocessing must be opt-in and quality-tested.
- **Layout model reliability:** layout detection can fail on uncommon templates; plain page OCR must remain the safe fallback.
- **Privacy:** logs, debug images, model errors, and metrics must not expose document contents or patient identifiers. Generated derivatives remain temporary.
- **Human review:** confidence is a signal, not approval. No component may auto-approve or persist a clinical conclusion.

## Validation Plan

For every approved phase, validation will use FastAPI's Swagger UI and non-clinical fixture documents:

1. Start the backend with the project virtual environment and open `/docs`.
2. Upload a valid PDF, PNG, and JPEG through `POST /api/v1/documents/upload`.
3. Prepare each returned document ID with `POST /api/v1/documents/{document_id}/prepare`.
4. Run `POST /api/v1/documents/{document_id}/ocr` and verify document ID, page count, text, confidence, processing time, and `processed` status.
5. Verify a nonexistent ID returns `404` and an uploaded-but-unprepared document returns `422`.
6. For ModelLoader failures, verify a controlled `500` response without model paths, document data, or stack traces.
7. Compare baseline and optional preprocessing outputs using fixed test fixtures; assert that page count and endpoint contracts do not change.
8. Inspect `/openapi.json` or Swagger after each phase to confirm existing upload and prepare operations remain unchanged.

## Approval Gate

This document is a plan only. No OCR component beyond the current implementation should be migrated until the plan is approved. The first implementation after approval will be **Phase 1: Model lifecycle**, limited to the model loader and its dependency injection path.
