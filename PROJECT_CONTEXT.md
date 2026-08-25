# Contexto técnico de DocDaiWeb

> **Propósito de este archivo.** Este documento describe el repositorio tal como está implementado al momento de su creación. Es contexto para agentes y personas que continúen el desarrollo. `FUNCIONANDO` significa que existe una implementación ejecutable dentro del alcance actual; no implica que sea apta para producción clínica. `PARCIAL` significa que hay código, contrato o interfaz, pero faltan piezas necesarias. `PENDIENTE` significa que no existe una implementación en este repositorio.

## 1. Qué es DocDaiWeb

DocDaiWeb es un monorepo para una plataforma web de digitalización de documentos médicos. Su flujo actual permite cargar temporalmente un PDF o una imagen, prepararlo como PNG, ejecutar PaddleOCR, transformar de forma determinista parte del texto OCR en datos médicos provisionales y mostrarlos para revisión humana.

El objetivo final declarado en `Readme.md` es convertir recetas, estudios y otros documentos médicos no estructurados en historiales clínicos estructurados, sin sustituir el juicio clínico. En el código actual ese objetivo solo está implementado para una extracción textual/regex limitada y no hay expediente clínico persistente.

El principio que debe preservarse es: **ni OCR ni parsing constituyen aprobación clínica. Todo dato extraído permanece pendiente de validación humana.**

## 2. Estado ejecutivo

| Área | Estado | Estado real |
|---|---|---|
| API FastAPI versionada | FUNCIONANDO | App, routers, OpenAPI, CORS y manejo de errores están presentes. |
| Carga segura básica de PDF/JPG/JPEG/PNG | FUNCIONANDO | Valida extensión, MIME, firma, contenido y tamaño; guarda localmente de forma temporal. |
| Preparación de PDF/imágenes | FUNCIONANDO | PDF a PNG por página con PyMuPDF; imágenes normalizadas con Pillow. |
| OCR local PaddleOCR | FUNCIONANDO | Endpoint síncrono y adaptador con carga diferida; depende de que Paddle/modelos estén instalados y disponibles. |
| Parsing médico determinista | FUNCIONANDO | Extrae un subconjunto explícitamente etiquetado y genera evidencia pendiente de revisión. |
| Revisión humana visual | PARCIAL | UI permite aprobar/corregir/rechazar localmente; no envía ni persiste decisiones. |
| Autenticación/autorización | PENDIENTE | API responde 501; frontend simula sesión en `localStorage`. |
| Pacientes, médicos y expedientes persistentes | PENDIENTE | Endpoints devuelven listas vacías; UI clínica usa mocks. |
| Base de datos y repositorios | PENDIENTE | Hay dependencias, pero no modelos, migraciones, conexiones ni adaptadores de persistencia. |
| Flujo OCR asíncrono/jobs/WebSockets/LangGraph | PENDIENTE | Hay dependencias de LangGraph, pero no código que lo use. |
| Aprobación clínica y auditoría | PENDIENTE | No existe endpoint, entidad ni almacenamiento de revisiones. |

## 3. Estructura y arquitectura

```text
apps/
├── backend/
│   ├── src/
│   │   ├── domain/          Entidades provisionales y puertos (Protocol)
│   │   ├── application/     Casos de uso, servicios puros y schemas Pydantic
│   │   ├── infrastructure/  PaddleOCR, PDF/imágenes y almacenamiento local
│   │   ├── adapters/api/    Rutas FastAPI y composición de dependencias
│   │   ├── core/            Logging
│   │   └── main.py          Aplicación FastAPI
│   ├── tests/               30 pruebas unitarias actuales
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/             Router y providers locales
    │   ├── features/        Pantallas de doctor, paciente y auth
    │   ├── components/      Componentes reutilizables
    │   ├── services/        Cliente HTTP documental
    │   ├── data/mockData.ts Datos de demostración clínica
    │   └── types/           Tipos del frontend
    └── package.json
```

La arquitectura backend sigue en gran parte Clean Architecture/hexagonal:

```text
FastAPI adapters → application use cases/services → domain entities/ports
infrastructure adapters ────────────────────────────┘
```

- `domain/` no importa FastAPI, PaddleOCR ni filesystem. Contiene `MedicalRecord`, `Patient`, `Medication`, `ExtractionEvidence` y puertos para OCR, almacenamiento y procesamiento documental.
- `application/` coordina reglas de caso de uso y expone schemas Pydantic. `MedicalInformationParser` es puro y determinista.
- `infrastructure/` implementa los puertos con disco local, PyMuPDF, Pillow y PaddleOCR.
- `adapters/api/` compone implementaciones concretas y traduce errores de aplicación a HTTP.

Esto es **PARCIAL** como arquitectura completa: falta composición centralizada/inyección de dependencias, repositorios y persistencia. No introducir reglas clínicas en routers ni en infraestructura.

## 4. Tecnologías comprobadas

| Capa | Tecnología realmente usada |
|---|---|
| Backend | Python, FastAPI, Pydantic v2, Uvicorn (dependencia) |
| OCR | `paddlepaddle==3.2.1`, `paddleocr[all]==3.5.0` |
| Documento | PyMuPDF (`fitz`), Pillow |
| Persistencia temporal | Filesystem local del sistema y diccionario en memoria de proceso |
| Frontend | React 18, TypeScript, Vite 5, React Router 6, Bootstrap 5 |
| Pruebas | `unittest` estándar; no hay `pytest` instalado en `apps/backend/.venv` |

`requirements.txt` además declara LangGraph, LangChain, OpenCV, SQLAlchemy, asyncpg, httpx y dotenv. **No debe asumirse que están integrados**: no hay código de LangGraph, OpenCV, SQLAlchemy, asyncpg, base de datos ni LLM en `src/`.

## 5. Backend y endpoints actuales

La API se monta con prefijo `/api/v1`; la raíz `/` no se versiona y devuelve identidad del servicio. `APP_VERSION` es `0.1.0`.

| Método y ruta | Estado | Comportamiento |
|---|---|---|
| `GET /` | FUNCIONANDO | `{name, version}`; fuera de OpenAPI. |
| `GET /api/v1/health/` | FUNCIONANDO | Devuelve `{"status":"ok","service":"DocDaiWeb API"}` sin verificar dependencias. |
| `POST /api/v1/auth/login` | PENDIENTE | Valida el schema y responde 501; no verifica credenciales ni entrega token. |
| `POST /api/v1/auth/register` | PENDIENTE | Valida el schema y responde 501; no crea usuarios. |
| `GET /api/v1/patients/` | PARCIAL | Responde `{"items":[]}`; no hay repositorio. |
| `GET /api/v1/doctors/` | PARCIAL | Responde `{"items":[]}`; no hay repositorio. |
| `POST /api/v1/documents/upload` | FUNCIONANDO | Recibe multipart `file`, valida y guarda temporalmente; 201. |
| `POST /api/v1/documents/{document_id}/prepare` | FUNCIONANDO | Genera PNG preparados; no hace OCR. |
| `POST /api/v1/documents/{document_id}/ocr` | FUNCIONANDO | Ejecuta OCR síncrono para un documento preparado y deja el texto en memoria de proceso. |
| `POST /api/v1/documents/{document_id}/parse` | FUNCIONANDO | Parsea exclusivamente el resultado OCR temporal; no vuelve a OCR ni persiste. |
| `POST /api/v1/ocr/extract` | PARCIAL/LEGADO | Acepta UUID y responde 202 `pending_human_review`; no encola ni ejecuta OCR. |

Errores globales:

- `HTTPException` se normaliza a `{detail, errors?}`.
- Errores de validación responden 422 y exponen `exc.errors()`. Esto puede incluir valores de entrada; debe revisarse antes de procesar datos clínicos reales.
- Errores no esperados se registran y responden 500 genérico.

No hay autenticación aplicada a ninguna ruta. CORS solo permite `http://localhost:5173`, métodos `GET`, `POST`, `OPTIONS` y encabezados `Authorization`, `Content-Type`.

## 6. Pipeline documental real

```text
Archivo multipart
  → POST /documents/upload
  → almacenamiento temporal local
  → POST /documents/{id}/prepare
  → PNG(s) temporal(es)
  → POST /documents/{id}/ocr
  → texto + confianza media en memoria
  → POST /documents/{id}/parse
  → información estructurada provisional + evidencia
  → revisión humana solo local en React
```

### 6.1 Carga

`RequestDocumentUploadUseCase` usa `DocumentUploadValidator` y `LocalTemporaryDocumentStorage`.

- Acepta exclusivamente `.pdf`, `.jpg`, `.jpeg`, `.png`.
- Exige coincidencia exacta entre extensión y MIME (`application/pdf`, `image/jpeg`, `image/png`).
- Comprueba firmas iniciales de PDF, JPEG o PNG.
- El límite por defecto es 10 MiB (`DOCDIA_MAX_UPLOAD_SIZE_BYTES` permite cambiarlo).
- Genera un identificador `UUID hex + extensión` y escribe en `%TEMP%/docdaiweb/uploads` por defecto; `DOCDIA_TEMP_STORAGE_DIR` permite cambiar el directorio.
- El ID se valida al recuperarse para no salir del directorio de almacenamiento.

Limitaciones: el contenido se lee completo en memoria antes de validar tamaño; no hay antivirus, cifrado, TTL, limpieza ni asociación con usuario/paciente.

### 6.2 Preparación PDF e imágenes

`LocalDocumentPreparationProcessor` selecciona el procesador por extensión.

- PDFs: `PdfProcessor` abre con PyMuPDF, rechaza cifrados o vacíos, renderiza cada página a 300 DPI y la guarda como `page_N.png`.
- Imágenes: `ImageProcessor` aplica `ImageOps.exif_transpose`, convierte a RGB, limita dimensiones a 2500×3500 conservando proporción, elimina metadatos al guardar PNG y fija DPI 300×300.
- Las páginas se guardan bajo `%TEMP%/docdaiweb/prepared/{document_id}/` por defecto y se devuelven como referencias relativas, no URLs públicas.

Limitaciones: no hay límite de páginas, control de píxeles/recursos de PDF, deskew, binarización, reducción de ruido, contraste adaptativo, detección de layout o cola de procesamiento. Los archivos preparados tampoco se limpian.

### 6.3 PaddleOCR

`PaddleOcrProvider` es el adaptador de infraestructura del puerto `OcrProvider`.

- Se instancia al componer cada solicitud OCR.
- Inicializa PaddleOCR de forma diferida en la primera página de esa solicitud con `lang="es"` y desactiva clasificación de orientación del documento, unwarping y orientación de línea.
- Procesa las imágenes preparadas una por una mediante `engine.predict(path)`.
- Soporta resultados serializables de PaddleOCR 3.x y un formato heredado: recoge `rec_texts` y `rec_scores`, concatena las líneas con saltos de línea y calcula confianza media de todas las líneas.
- El endpoint devuelve `document_id`, `status: "processed"`, número de páginas, texto agregado, confianza media de 0 a 1 y segundos de procesamiento.

No hay caché/singleton de modelo entre solicitudes: el caché `_engine` solo vive dentro de la instancia del proveedor de esa solicitud. No se devuelven cajas, texto por página, puntuaciones por línea ni imágenes anotadas. Un fallo de Paddle se traduce a 500 con mensaje seguro. La primera ejecución puede requerir descarga de modelos y exceder el timeout del cliente.

### 6.4 Resultado OCR temporal y parsing

Tras OCR, `ExtractTextUseCase` guarda solo el texto agregado en el singleton de módulo `_ocr_result_storage`, una instancia de `InMemoryOcrResultStorage`.

- Es proceso-local, sin TTL, sin persistencia, sin cifrado y sin metadatos de página/confianza.
- Se pierde al reiniciar el backend y no funciona de forma confiable con múltiples workers/instancias.
- `POST /parse` devuelve 409 si no existe ese texto. No comprueba explícitamente que el documento exista, porque depende de la presencia del resultado OCR.

`MedicalInformationParser` es un parser regex conservador. No usa LLM, NLP externo, LangGraph, FHIR ni inferencia clínica. Normaliza saltos de línea y solo extrae evidencia explícitamente etiquetada:

- paciente y edad (`Paciente`, `Datos del paciente`, `Edad`),
- diagnósticos en secciones de diagnóstico,
- medicamentos en secciones de medicamentos/tratamiento/receta, con dosis, frecuencia, presentación e indicación cuando son textuales,
- fechas con etiqueta y formatos españoles acotados,
- médico e institución con etiquetas reconocidas.

El resultado es `MedicalRecord`, no una entidad de base de datos ni FHIR. Cada valor obtiene `ExtractionEvidence` con línea de origen, tipo de coincidencia, página cuando se invoca el parser con páginas y `status="pending_review"`. En el flujo HTTP se pierde la procedencia de página porque OCR guarda texto agregado, no páginas. La confianza de evidencia se deja `null`; no se inventa una confianza clínica.

El parser evita inferir valores faltantes, elimina duplicados exactos y tiene pruebas sintéticas para ruido, etiquetas, secciones y evidencia. Aun así, las regex no sustituyen una validación médica y su cobertura es limitada a los patrones implementados.

## 7. Human-in-the-loop (HITL)

**FUNCIONANDO como barrera conceptual y visual; PARCIAL como flujo de negocio.**

- Backend: describe OCR/parsing como no aprobados, no persiste información clínica y las evidencias nacen con `pending_review`.
- Frontend: tras `parse`, cambia el documento local a `pending_human_review` y presenta evidencia, texto OCR y controles Aprobar/Corregir/Rechazar.
- Las decisiones de `MedicalRecordReviewPage` existen únicamente en estado React del componente. Corregir no actualiza `DocumentsProvider`; aprobar/rechazar no cambia el backend, no actualiza el expediente, no registra auditoría y se pierde al salir/refrescar.
- No hay endpoint de aprobación, rechazo, edición, asignación de revisor, control de concurrencia, firma, historial ni auditoría.

Nunca se debe convertir `pending_human_review` en una aprobación automática por confianza OCR o por datos extraídos.

## 8. Frontend actual

El frontend es una SPA React/Vite. La variable `VITE_API_URL` (ejemplo `http://127.0.0.1:8001`) recibe automáticamente `/api/v1` si no está incluido. El único servicio HTTP real es `src/services/documents.ts` y llama de forma secuencial a upload, prepare, OCR y parse. Timeouts: 120 s general y 10 min para OCR.

### Funcionalidad conectada a la API

- La ruta de doctor `/doctor/uploads` permite arrastrar/seleccionar PDF, PNG, JPG/JPEG y ejecuta la secuencia completa.
- Muestra un stepper, eventos locales, texto OCR, confianza, datos estructurados y evidencia recibida del backend.
- `/doctor/documents` lista los documentos procesados de la sesión local.
- `/doctor/review/:recordId` ofrece la revisión humana local explicada arriba.

`DocumentsProvider` persiste en `localStorage` metadatos, OCR y parsing, omitiendo solo `previewUrl`. Esto facilita la demo, pero **no es aceptable para PHI real**: datos clínicos legibles quedan en el navegador y, tras recargar, el frontend puede mostrar un resultado cuyo respaldo temporal en backend ya no existe.

### Funcionalidad de demostración/mocks

- `AuthProvider` no usa la API: crea usuarios doctor/paciente desde el formulario y los persiste en `localStorage`.
- Login y registro son simulados; las contraseñas no se validan ni se guardan, pero tampoco existe sesión segura.
- Listas de pacientes, perfiles, timelines, expedientes, dashboard y detalle de paciente usan `src/data/mockData.ts`.
- La navegación de revisión en el sidebar/dashboard apunta al ID ficticio `rec-404`; no existe en `DocumentsProvider`, por lo que muestra “Documento no disponible” salvo que se navegue desde un documento real.

La UI usa Bootstrap y CSS propio, conserva adaptación móvil y `prefers-reduced-motion`. Parte del copy está en inglés y parte en español; no hay i18n.

## 9. Inconsistencias frontend ↔ backend

| Inconsistencia | Impacto |
|---|---|
| Frontend usa sesión local; backend auth responde 501 y no protege rutas. | Roles de doctor/paciente son solo apariencia de UI. |
| UI de pacientes y expedientes muestra mocks; `/patients` y `/doctors` devuelven arrays vacíos. | No hay datos clínicos reales integrados. |
| El frontend marca `pending_human_review` al completar parse, pero backend responde `status: processed` para OCR y parse no incluye estado documental. | El estado de revisión es una convención local, no una máquina de estados respaldada por servidor. |
| Revisión permite decisiones locales, backend no tiene contrato para recibirlas. | Ninguna aprobación, corrección o rechazo tiene efecto duradero. |
| `Medication` en TypeScript solo declara `name`, `dose`, `frequency`; backend también envía `presentation` e `indication`. | La respuesta es consumible, pero esos campos se ignoran y no se muestran. |
| Evidencia HTTP no tiene páginas porque se guarda un solo texto OCR; la UI muestra “no disponible”. | La trazabilidad página a página no funciona en la integración actual. |
| `.env.example` apunta a `127.0.0.1:8001`, mientras CORS solo permite frontend en `http://localhost:5173`. | No impide por sí mismo la petición (el origen es el frontend), pero host/puerto deben configurarse de forma coherente. |
| `/api/v1/ocr/extract` existe como stub 202 y el frontend no lo usa. | Es un contrato legado que puede confundir; el flujo real usa `/documents/{id}/ocr`. |

## 10. Logging, seguridad y privacidad

`src/core/logging.py` configura logging de consola una vez durante el lifespan. El nivel viene de `LOG_LEVEL` (INFO por defecto), añade emoji por severidad y reduce logs de Paddle a ERROR salvo en DEBUG. Los casos de carga/preparación/OCR registran ID, extensión, tamaño, páginas, confianza y duración; no registran intencionalmente texto OCR.

Riesgos conocidos antes de producción:

- No hay autenticación, autorización, aislamiento por tenant/usuario ni asociación documento-paciente.
- No hay cifrado en reposo, claves, borrado/retención, auditoría, consentimiento ni políticas de privacidad.
- Archivos y PNG quedan en directorios temporales hasta intervención externa.
- Resultado OCR y datos parseados viven en memoria del proceso; la UI los replica en `localStorage`.
- El handler de validación devuelve la estructura Pydantic completa, que puede contener `input`; evitar exponer valores sensibles.
- No hay rate limit, antivirus, escaneo de malware, límite de páginas, ni protección contra PDFs de consumo excesivo.
- CORS y configuración son adecuados solo para desarrollo local.

Las referencias a NOM-004/NOM-024/LFPDPPP del README son una intención de producto, **no evidencia de cumplimiento implementado**.

## 11. Pruebas y validación conocida

- `apps/backend/tests/` contiene 17 pruebas `unittest` para `MedicalInformationParser` y `ParseMedicalInformationUseCase`; fueron ejecutadas correctamente con `python -m unittest discover -s tests -v`.
- Las pruebas cubren extracción conservadora, ruido OCR, evidencia, páginas pasadas directamente al parser y ausencia de OCR temporal.
- No hay pruebas de rutas FastAPI, carga, preparación PDF, adaptador PaddleOCR, limpieza temporal, persistencia, autorización ni integración frontend-backend.
- `pytest` no está instalado en el entorno virtual actual; usar el ejecutor estándar mientras no se añada como dependencia de desarrollo.
- El frontend declara `npm run build` (`tsc -b && vite build`) y no declara suite de pruebas.

## 12. Documentación existente y confiabilidad

| Archivo | Estado frente al código |
|---|---|
| `Readme.md` | PARCIAL/DESACTUALIZADO. Describe el objetivo correcto, pero afirma LangGraph, PostgreSQL y seguimiento terapéutico que no están implementados. |
| `OCR_MIGRATION_PLAN.md` | PLAN. Es útil para orientar evolución OCR; describe explícitamente fases no implementadas, como layout detection. |
| `MEDICAL_INFORMATION_EXTRACTION_PLAN.md` | PLAN HISTÓRICO. Gran parte de contratos/parser ya fue implementada, pero el plan aún dice que no existe endpoint ni store. |
| `MEDICAL_EXTRACTION_PLAN.md` | PLAN HISTÓRICO. El código difiere: usa `/documents/{id}/parse` y store sin TTL, no el endpoint `/extract` propuesto. |
| `OCR_PROJECT_ANALYSIS.md` | NO APLICABLE como descripción del estado actual. Documenta otro proyecto SEMAR con Flutter, jobs, WebSockets, PostgreSQL/pgvector, LayoutDetection, clasificación naval y rutas inexistentes en este repositorio. Debe tratarse como material de migración externo, no como funcionalidad DocDaiWeb. |

## 13. Pendientes prioritarios para alcanzar el objetivo

1. Diseñar entidades y repositorios de documento, paciente, resultado OCR, revisión humana y auditoría; implementar persistencia segura con migraciones.
2. Implementar autenticación real y autorización por rol/relación clínica antes de exponer PHI.
3. Formalizar una máquina de estados persistente: cargado, preparado, OCR procesado/fallido, parseado, pendiente de revisión, corregido, aprobado/rechazado.
4. Crear casos de uso y endpoints de revisión humana que persistan correcciones y decisiones con evidencia/auditoría, sin autoaprobación.
5. Sustituir mocks y `localStorage` de datos clínicos por servicios autenticados; eliminar PHI del almacenamiento del navegador.
6. Definir retención, limpieza garantizada, cifrado y almacenamiento de objetos/archivos seguro; reemplazar el store OCR en memoria por una solución compartida y con vencimiento.
7. Robustecer OCR: lifecycle/caché de modelos, pruebas con versión instalada, salida por página/bloque, límites de recursos y, solo si se justifica, preprocesamiento/layout como puertos separados.
8. Agregar pruebas de integración y contratos frontend-backend. No mezclar en un mismo cambio una migración de OCR con reglas clínicas o persistencia.

## 14. Flujo final esperado (objetivo, no implementación)

```text
Usuario autenticado y autorizado
  → carga validada, cifrada y asociada a un documento/paciente autorizado
  → preparación segura con límites y trazabilidad
  → job OCR observable y recuperable
  → resultado por página/bloque con confianza técnica y evidencia
  → parsing determinista/provisional sin inferencia clínica
  → cola de revisión humana autorizada
  → corrección/aprobación/rechazo con auditoría inmutable
  → persistencia del expediente aprobado y acceso controlado
```

Cada transición debe conservar procedencia, timestamp, actor y reglas de acceso. La confianza OCR es una señal técnica y nunca debe ser una condición suficiente para aprobar datos clínicos.

## 15. Restricciones para futuras modificaciones

- Mantener la dirección de dependencias hacia el dominio; los routers deben ser delgados y PaddleOCR/PyMuPDF/Pillow deben quedarse en infraestructura.
- No hacer que el parser importe FastAPI, almacenamiento, OCR o LLMs. Mantenerlo determinista y conservador.
- No reejecutar OCR desde parse/review para esconder ausencia de estado; recuperar un resultado explícito y trazable.
- No persistir ni mostrar datos clínicos como “aprobados” sin una acción humana persistida y auditada.
- No copiar al producto reglas SEMAR, clasificación naval, Flutter, LangGraph o rutas del `OCR_PROJECT_ANALYSIS.md` sin una decisión explícita de producto.
- No eliminar validación de firma/MIME, corrección EXIF, normalización RGB ni límites de imagen existentes sin reemplazo equivalente y pruebas.
- No tratar los mocks, `localStorage` o filesystem temporal como fuente de verdad clínica.
- Mantener datos de prueba sintéticos y evitar PHI en logs, fixtures, Swagger, documentación y errores.

## 16. Archivos de referencia principales

- Backend: `apps/backend/src/main.py`, `adapters/api/routes/document.py`, `application/use_cases/extract_text.py`, `application/services/medical_information_parser.py`.
- OCR/preparación: `infrastructure/ocr/paddle_provider.py`, `pdf_processor.py`, `image_processor.py`, `document_preparation_processor.py`.
- Puertos/entidades: `domain/interfaces/`, `domain/entities/medical_record.py`.
- Frontend conectado: `apps/frontend/src/services/documents.ts`, `features/doctor/processing/useDocumentProcessing.ts`, `features/doctor/pages/UploadDocumentPage.tsx`, `MedicalRecordReviewPage.tsx`.
- Mocks: `apps/frontend/src/data/mockData.ts`.
