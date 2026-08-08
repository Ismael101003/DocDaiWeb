# 1. Executive Summary

Este proyecto implementa una plataforma documental SEMAR para cargar documentos, convertirlos a imágenes, ejecutar OCR con PaddleOCR, detectar estructura visual mediante LayoutDetection, clasificar niveles de protección naval, generar metadatos revisables, aplicar revisión humana y persistir el resultado en PostgreSQL con `pgvector` para búsqueda semántica/RAG.

El objetivo principal es transformar documentos operativos en texto consultable, trazable y auditable, manteniendo control humano antes de consolidar documentos en la base documental.

El nivel de madurez actual es **intermedio-avanzado funcional**:

- Tiene backend FastAPI operativo, frontend Flutter, persistencia PostgreSQL, autenticación, auditoría, jobs asíncronos, WebSocket, cancelación y límites de concurrencia.
- Tiene defensas importantes para PaddleOCR v3, procesamiento en subprocess y tolerancia a fallos de layout.
- Todavía mezcla responsabilidades en routers y servicios, por lo que no está completamente alineado con Clean Architecture.
- El preprocesamiento óptico real es limitado; existe un nodo LangGraph llamado `limpieza_optica`, pero actualmente no aplica filtros de OpenCV.
- La revisión humana existe y es útil, pero está acoplada a archivos JSON locales y endpoints concretos del proyecto.

Motor OCR usado:

- Librería: `paddleocr[all]==3.5.0`
- Runtime base: `paddlepaddle==3.2.1`
- Modelo configurado: `PP-OCRv5`
- Idioma configurado: `es`
- Layout: `LayoutDetection` con modelo `PP-DocLayout_plus-L`
- GPU: desactivado por defecto (`OCR_USE_GPU=False`)

Frameworks y librerías externas relevantes:

- FastAPI, Uvicorn/Gunicorn
- PaddleOCR, PaddlePaddle, PaddleX/LayoutDetection
- OpenCV headless, NumPy, Pillow
- `pdf2image` y Poppler para PDF
- LibreOffice headless para Word/PPTX a PDF
- `python-pptx` para validar PPTX
- LangGraph para orquestación
- PostgreSQL, SQLAlchemy, psycopg2, pgvector
- SentenceTransformers u Ollama para embeddings
- Flutter/Dart para carga, monitoreo y revisión OCR

# 2. Project Architecture

La arquitectura actual es modular por carpetas, pero no es Clean Architecture estricta. La lógica de OCR reutilizable está principalmente en `backend/app/services/ocr`, mientras que la orquestación HTTP, persistencia y reglas de UI/revisión están mezcladas en `backend/app/api/routers/ocr.py`.

Árbol resumido:

```text
proyecto-semar-ocr/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── main.py
│   │   │   └── routers/
│   │   │       ├── auth.py
│   │   │       ├── ocr.py
│   │   │       ├── chat.py
│   │   │       ├── chat_documental.py
│   │   │       ├── chat_general.py
│   │   │       ├── stats_router.py
│   │   │       └── audit_router.py
│   │   ├── infrastructure/
│   │   │   ├── config/settings.py
│   │   │   ├── db/
│   │   │   │   ├── database.py
│   │   │   │   ├── database_orm.py
│   │   │   │   ├── orm_models.py
│   │   │   │   └── sql/init_db.sql
│   │   │   ├── external/convert.py
│   │   │   ├── logging/logging_config.py
│   │   │   └── security/
│   │   ├── services/
│   │   │   ├── ocr/
│   │   │   │   ├── engine.py
│   │   │   │   ├── model_loader.py
│   │   │   │   ├── ocr_runner.py
│   │   │   │   ├── layout_detector.py
│   │   │   │   ├── postprocessor.py
│   │   │   │   ├── image_preprocessor.py
│   │   │   │   ├── ocr_service.py
│   │   │   │   ├── job_manager.py
│   │   │   │   ├── job_events.py
│   │   │   │   ├── ocr_subprocess_entry.py
│   │   │   │   └── types.py
│   │   │   ├── document/
│   │   │   ├── chat/
│   │   │   ├── audit/
│   │   │   └── stats/
│   │   ├── workflows/
│   │   │   ├── ocr/
│   │   │   │   ├── workflow.py
│   │   │   │   ├── nodes.py
│   │   │   │   └── state.py
│   │   │   └── chat/
│   │   ├── repositories/
│   │   └── models/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── lib/
│   │   ├── services/api_service.dart
│   │   ├── services/ocr_job_socket.dart
│   │   ├── controllers/upload_queue_controller.dart
│   │   ├── models/upload_item.dart
│   │   └── screens/
│   │       ├── upload_screen.dart
│   │       ├── review_ocr_screen.dart
│   │       └── history_screen.dart
│   └── pubspec.yaml
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   ├── ollama/
│   └── scripts/
├── doc/
└── archivos_semar/
```

Responsabilidades principales:

| Carpeta | Responsabilidad |
|---|---|
| `backend/app/api` | Arranque FastAPI, routers HTTP, CORS, archivos estáticos, lifecycle de jobs OCR. |
| `backend/app/api/routers/ocr.py` | Orquesta carga, validación, conversión, workflow OCR, metadata, aprobación, rechazo, jobs, WebSocket y endpoints de layout. Es el archivo más acoplado. |
| `backend/app/services/ocr` | Núcleo técnico OCR: carga de modelos, ejecución OCR, layout, postproceso, tipos, jobs y subprocess. |
| `backend/app/workflows/ocr` | Grafo LangGraph que encadena limpieza, OCR, clasificación y duplicados. |
| `backend/app/infrastructure/external` | Conversión de PDF/DOCX/PPTX a páginas imagen. |
| `backend/app/infrastructure/db` | Conexiones SQL/ORM, modelos, DDL e inicialización de base de datos. |
| `backend/app/services/document` | Administración documental posterior a OCR: chunks, edición, borrado, renombrado. |
| `frontend/lib/services` | Cliente HTTP/WebSocket del backend. |
| `frontend/lib/controllers` | Control de cola de subida y seguimiento de jobs OCR. |
| `frontend/lib/screens` | UI de carga, revisión OCR, historial y dashboard. |
| `infra` | Docker Compose, PostgreSQL/pgvector, backend, frontend, Ollama opcional y scripts operativos. |
| `archivos_semar` | Almacenamiento operativo de archivos originales, previews, metadata JSON y artefactos. Es sensible y no debe modificarse sin autorización. |

Entry points:

- API principal: `backend/app/api/main.py`, objeto `app`.
- Router OCR: `backend/app/api/routers/ocr.py`.
- Motor OCR singleton: `backend/app/services/ocr/engine.py`, clase `OCREngine`.
- Workflow OCR: `backend/app/workflows/ocr/workflow.py`, variable `app_ocr`.
- Job runner aislado: `backend/app/services/ocr/ocr_subprocess_entry.py`.
- Frontend: `frontend/lib/main.dart`, con interacción OCR desde `UploadScreen`, `UploadQueueController` y `ApiService`.

Flujo de dependencias actual:

```text
Flutter UI
  ↓ HTTP/WebSocket
FastAPI router ocr.py
  ↓
Conversión de archivos / validación / almacenamiento temporal
  ↓
LangGraph workflow OCR
  ↓
OCREngine
  ↓
PaddleOCR + LayoutDetection + OpenCV
  ↓
Postprocesamiento OCR / clasificación NP / duplicados
  ↓
Metadata JSON local
  ↓
Revisión humana
  ↓
PostgreSQL + pgvector + auditoría
```

Flujo de datos:

1. El usuario selecciona PDF/DOCX/PPTX desde Flutter.
2. El backend recibe bytes por multipart.
3. El archivo se guarda temporalmente.
4. Se valida tamaño, tipo MIME/extensión y número de páginas.
5. Se convierte a imágenes por página.
6. Se aplican límites de seguridad a imágenes grandes.
7. Se ejecuta OCR por página.
8. Se agregan textos, bloques OCR, metadatos, previews y nivel de protección.
9. Se genera metadata JSON en `archivos_semar`.
10. Si requiere aprobación, queda pendiente.
11. El revisor edita bloques o texto completo.
12. Al aprobar, se persiste en `documentos` y `documento_chunks`.
13. Se generan embeddings y quedan disponibles para RAG/búsqueda semántica.

# 3. OCR Pipeline

Pipeline integral real de `/subir-oficios/` y jobs `/ocr/jobs/`:

```text
Documento
↓
Upload multipart
↓
Validación de usuario, tamaño, cantidad y formato
↓
Archivo temporal
↓
Conversión a páginas imagen
↓
Límites de seguridad de imagen
↓
Workflow LangGraph
↓
OCR por página
↓
LayoutDetection opcional
↓
OCR por regiones de texto o fallback OCR directo
↓
Agrupación de líneas y extracción de bloques
↓
Detección de nivel de protección
↓
Verificación de duplicado semántico
↓
Metadata JSON + previews
↓
Revisión humana
↓
Aprobación/rechazo
↓
Persistencia PostgreSQL + chunks + embeddings
```

Etapas detalladas:

1. **Documento**  
   El sistema acepta documentos operativos principalmente en PDF, DOCX y PPTX para el flujo de carga principal. Algunos endpoints técnicos aceptan JPG/PNG/PDF para análisis de layout u OCR combinado.

2. **Upload**  
   Flutter envía multipart a `/ocr/jobs/` para procesamiento asíncrono o a `/subir-oficios/` para procesamiento directo. Los campos relevantes son `tipo_documento`, `nombre_documento`, `requiere_aprobacion` y archivo(s).

3. **Validación inicial**  
   Se valida autenticación JWT, máximo de documentos activos por usuario, tipos MIME/extensiones, tamaño máximo y cantidad máxima de documentos por lote.

4. **Temporary storage**  
   Los bytes se escriben en un `NamedTemporaryFile`. En jobs asíncronos se usa `archivos_semar/_jobs` como área temporal para payloads `.in.json`/`.out.json`.

5. **PDF/document preprocessing**  
   `backend/app/infrastructure/external/convert.py` convierte:
   - PDF a JPG con `pdf2image`.
   - DOC/DOCX a PDF usando LibreOffice headless y luego a JPG.
   - PPTX a PDF usando LibreOffice, validando antes con `python-pptx`.
   - JPG/PNG se aceptan como página única en la función de conversión, aunque el endpoint principal de carga no los acepta.

6. **Image safety processing**  
   `_apply_image_safety_limits` recorre páginas convertidas y `_downscale_image_if_needed` usa OpenCV para reducir imágenes que superan límites de píxeles o lado máximo.

7. **LangGraph workflow**  
   `app_ocr.invoke(inputs)` ejecuta nodos:
   - `limpieza_optica`
   - `vigia_ocr`
   - router de calidad
   - `analista_seguridad`
   - `verificador_duplicado`

8. **OCR por página**  
   `nodo_lector_ocr` itera `paginas_procesadas` y llama `ocr_engine.procesar_documento` por imagen.

9. **LayoutDetection**  
   `OCREngine.procesar_documento` intenta detectar layout. Si no hay layout, ejecuta OCR directo. Si hay layout, solo procesa regiones cuyo `etiqueta_original` pertenece a `TIPOS_TEXTO`.

10. **PaddleOCR**  
   `OCRRunner.ejecutar_ocr` llama `self.ocr.ocr(input_data)`, parsea formatos antiguos y v3, extrae `rec_texts`, `rec_polys`/`rec_boxes`/`dt_polys`, `rec_scores`, y normaliza bloques.

11. **Text extraction**  
   Los bloques se agrupan por línea usando posición vertical y horizontal. Luego se concatena texto por región y por página.

12. **Confidence calculation**  
   Cada bloque conserva `confianza` promedio de los elementos agrupados. No existe hoy un cálculo global completo de `ocr_confidence_avg` en la persistencia, aunque la tabla incluye columna para ello.

13. **Structured output**  
   Se genera `texto_extraido`, `metadatos_ocr`, `resultados_por_pagina`, `paginas`, `nivel_proteccion`, `es_prioritario`, duplicados, previews y rutas.

14. **Human Review**  
   Si `requiere_aprobacion=True`, el documento queda con `db_guardado=False` y `status="Pendiente de aprobacion"`. Flutter abre `ReviewOcrScreen`, permite editar bloques espaciales o texto completo por página, y devuelve `ocr_blocks`.

15. **Persistence**  
   Al aprobar, `guardar_resultado_en_db` inserta en `documentos`, construye chunks, genera embeddings y guarda en `documento_chunks`. También registra auditoría.

# 4. PaddleOCR Configuration

Configuración central: `backend/app/services/ocr/model_loader.py` y `backend/app/infrastructure/config/settings.py`.

| Parámetro | Valor actual | Ubicación | Motivo/uso |
|---|---:|---|---|
| Librería PaddleOCR | `paddleocr[all]==3.5.0` | `backend/requirements.txt` | Motor OCR y LayoutDetection. |
| PaddlePaddle | `paddlepaddle==3.2.1` | `backend/requirements.txt` | Runtime de inferencia. |
| Modelo OCR | `PP-OCRv5` | `OCR_MODEL_VERSION` | Modelo OCR moderno de Paddle configurado por defecto. |
| Idioma | `es` | `OCR_LANG` | Reconocimiento de documentos en español. |
| Dispositivo OCR | `cpu` por defecto | `OCR_USE_GPU=False` | Evita dependencia CUDA; más portable en Docker/servidores CPU. |
| MKLDNN OCR | `False` por defecto | `OCR_ENABLE_MKLDNN=False` | Reduce problemas de compatibilidad nativa/oneDNN observados con Paddle. |
| Runtime kwargs | `use_doc_orientation_classify=False`, `use_doc_unwarping=False`, `use_textline_orientation=False` | `model_loader.py` | Desactiva orientación/deswarping automáticos para compatibilidad y menor costo. |
| Layout model | `PP-DocLayout_plus-L` | `LAYOUT_DETECTION_MODEL_NAME` | Detección de estructura documental. |
| Layout device | `cpu` | `model_loader.py` | Layout siempre intenta CPU, independiente de `OCR_USE_GPU`. |
| Layout MKLDNN/CINN | `False` en primer intento | `model_loader.py` | Evita fallos de inicialización; hay reintentos con firma reducida. |
| Layout threshold | `0.3` por defecto | `procesar_documento`, `detectar_layout` | Acepta detecciones relativamente sensibles. |
| Batch layout | `batch_size=1` | `layout_detector.py` | Procesamiento página por página; menor consumo de memoria. |
| NMS layout | `layout_nms=True` | `layout_detector.py` | Reduce cajas redundantes. |
| Workers OCR | `2`, máximo efectivo `4` | `OCR_MAX_WORKERS`, `ThreadPoolExecutor` | Limita CPU/memoria para OCR y layout. |
| Concurrencia jobs | `3` por defecto | `OCR_MAX_CONCURRENT_JOBS` | Controla OCR pesados simultáneos. |
| Tamaño máximo archivo | `80 MB` por defecto, `150 MB` en Compose | `OCR_MAX_UPLOAD_BYTES` | Evita cargas excesivas. |
| Páginas máximas | `40` por defecto | `OCR_MAX_PAGES_PER_DOC` | Evita PDFs muy largos. |
| Píxeles máximos | `12,000,000` | `OCR_MAX_IMAGE_PIXELS` | Redimensiona imágenes demasiado grandes. |
| Lado máximo | `4096 px` | `OCR_MAX_IMAGE_SIDE` | Reduce riesgo OOM y tiempos altos. |

Modelos de detección y reconocimiento:

- El proyecto no configura rutas explícitas a `det_model_dir`, `rec_model_dir` ni `cls_model_dir`.
- PaddleOCR selecciona internamente modelos compatibles con `lang="es"` y `ocr_version="PP-OCRv5"`.
- El “angle classifier” clásico no está configurado como `use_angle_cls`; en la API v3 se desactiva orientación con `use_textline_orientation=False` y `use_doc_orientation_classify=False`.

Batch processing:

- La conversión produce varias páginas, pero el OCR se ejecuta página por página.
- Layout usa `batch_size=1`.
- La concurrencia global se controla por `ThreadPoolExecutor`, `OcrJobManager` y semáforo.

Optimizaciones de rendimiento:

- Singleton `OCREngine` para no recargar modelos por request.
- Warmup en startup: `OCREngine()` y embeddings.
- OCR pesado en subprocess para aislar fallos nativos.
- Límite de workers y concurrencia.
- Downscale automático de imágenes grandes.
- Fallback de layout a OCR directo.
- Reintentos de inicialización de `LayoutDetection` con firmas reducidas.
- Fallback OCR ante error `ConvertPirAttribute2RuntimeAttribute`.

# 5. Image Processing

El procesamiento de imagen real está distribuido entre `ocr.py`, `image_preprocessor.py`, `engine.py` y `postprocessor.py`.

| Paso | Implementado | Ubicación | Detalle |
|---|---|---|---|
| Resize/downscale de seguridad | Sí | `backend/app/api/routers/ocr.py`, `_downscale_image_if_needed` | Redimensiona si excede `OCR_MAX_IMAGE_PIXELS` o `OCR_MAX_IMAGE_SIDE`, usando `cv2.INTER_AREA`. |
| Corrección EXIF | No explícita | No encontrada | Las imágenes de PDF salen de `pdf2image`; imágenes directas no tienen corrección EXIF dedicada. |
| Conversión RGB/BGR | Parcial/implícita | `cv2.imread` | OpenCV lee BGR; no hay normalización RGB explícita previa a OCR. |
| Noise removal | No | `nodo_limpieza_opencv` existe pero no filtra | El nodo solo incrementa `intento_actual`. |
| DPI normalization | Parcial | `convert.py` | PDF/DOCX se rasterizan con DPI fijo; imágenes directas no se normalizan. |
| Cropping | Sí | `image_preprocessor.py`, `postprocessor.py`, `engine.py` | Se recortan regiones de layout y ROI superior izquierda para reforzar NP. |
| Contrast enhancement | No | No encontrada | No hay CLAHE, histogram equalization ni contraste adaptativo. |
| Thresholding/binarización | No | No encontrada | No se aplica umbralización antes de OCR. |
| Rotation correction | No explícita | Desactivada en PaddleOCR kwargs | `use_doc_orientation_classify=False`; no hay deskew manual. |
| Unwarping | No | Desactivado | `use_doc_unwarping=False`. |
| Textline orientation | No | Desactivado | `use_textline_orientation=False`. |
| Clamp de bounding boxes | Sí | `image_preprocessor.py` | Evita coordenadas fuera de imagen. |
| ROI superior izquierda | Sí | `top_left_roi` | Refuerza detección de nivel de protección cuando layout/texto global no basta. |
| Visualización anotada | Sí | `postprocessor.py` | Dibuja cajas OCR/layout con OpenCV. |

Conclusión: el proyecto tiene **preprocesamiento documental y de seguridad**, pero no una etapa robusta de mejora óptica. Para DocDaiWeb conviene separar esto como un puerto/adaptador `ImagePreprocessor` y decidir si se mantiene el comportamiento actual o se agregan filtros controlados.

# 6. PDF Processing

La conversión de PDF está en `backend/app/infrastructure/external/convert.py`.

Librería:

- `pdf2image.convert_from_path`
- `pdf2image.pdfinfo_from_path`
- Requiere Poppler instalado en el sistema/contenedor.

DPI:

- PDF directo: `dpi_pdf=220`.
- DOC/DOCX convertido a PDF: `dpi_office=220`.
- PPTX convertido a PDF: `dpi_pptx=180`.

Multi-page handling:

- `_pdf_a_imagenes` convierte todas las páginas a `page_0001.jpg`, `page_0002.jpg`, etc.
- Cada página se representa como:

```json
{
  "page_index": 1,
  "image_path": "/tmp/semar_batch_x/page_0001.jpg",
  "source_file": "documento.pdf",
  "source_type": "pdf"
}
```

Límites:

- Antes de convertir, `pdfinfo_from_path` valida número de páginas si `max_pages` está definido.
- Después de convertir, el router vuelve a validar total de páginas.

Memory management:

- La conversión actual llama `convert_from_path(ruta_pdf, dpi=dpi)` sin `first_page/last_page`, por lo que puede cargar todas las páginas convertidas en memoria antes de guardarlas.
- El control de riesgo se basa en `max_pages`, DPI moderado y downscale posterior.
- Para DocDaiWeb se recomienda conversión por lotes o por página si se esperan documentos grandes.

Temporary files:

- Si no se pasa `work_dir`, se crea `tempfile.mkdtemp(prefix="semar_batch_")`.
- El archivo cargado originalmente se guarda en `NamedTemporaryFile`.
- Las imágenes de página pueden copiarse luego como previews a `archivos_semar/{tipo_documento}/{nivel}/`.
- La limpieza de temporales originales existe, pero los directorios de conversión pueden permanecer si no se gestionan externamente.

Office/PPT:

- DOC/DOCX/PPTX se convierten a PDF con `libreoffice --headless --convert-to pdf`.
- PPTX se valida con `Presentation(ruta_archivo)` y se rechaza si no tiene diapositivas o excede límite.

# 7. OCR Results

Objetos principales:

`BloqueOCR`:

- `texto`
- `confianza`
- `coordenadas`
- `seccion`

`ElementoLayout`:

- `etiqueta`
- `etiqueta_original`
- `confianza`
- `coordenadas`
- `orden_lectura`
- `seccion_naval`
- `contenido_ocr`

`ResultadoDocumento`:

- `archivo`
- `fecha`
- `total_elementos`
- `elementos`
- `texto_completo`
- `ruta_imagen_anotada`
- `nivel_proteccion_detectado`
- `error`

Metadata final de carga:

- `archivo_original`
- `nombre_documento_archivo`
- `fecha_procesamiento`
- `tipo_documento`
- `total_paginas`
- `paginas`
- `metadatos_ocr`
- `nivel_proteccion`
- `es_prioritario`
- `es_duplicado_semantico`
- `duplicado_semantico`
- `texto_extraido`
- `ruta_imagen`
- `ruta_preview`
- `preview_url`
- `ruta_anotada`
- `status`
- `error`
- `db_guardado`
- `requiere_aprobacion`

Organización del texto:

- El OCR por página produce `texto_extraido`.
- El texto consolidado agrega prefijos `[PAGINA N]`.
- Los bloques se enriquecen con `page_index`.
- En persistencia se generan chunks por página si `metadata["paginas"]` existe.

Cálculo de confianza:

- Cada línea normalizada obtiene promedio de `rec_scores`.
- Layout conserva confianza del detector.
- No hay cálculo global consolidado usado al insertar `documentos.ocr_confidence_avg`; la columna existe, pero no se alimenta en `guardar_resultado_en_db`.

Ejemplo JSON simplificado:

```json
{
  "archivo": "oficio.pdf",
  "nombre_documento_archivo": "Oficio operativo",
  "total_paginas": 2,
  "texto_detectado": "[PAGINA 1]\nARMADA DE MEXICO\nNP-CONF\n...\n\n[PAGINA 2]\n...",
  "nivel_proteccion": "NP-CONF",
  "es_prioritario": true,
  "es_duplicado_semantico": false,
  "duplicado_semantico": null,
  "requiere_aprobacion": true,
  "pendiente_aprobacion": true,
  "ruta_metadata": "/app/archivos_semar/Oficio/NP-CONF/oficio_metadata.json",
  "paginas": [
    {
      "page_index": 1,
      "preview_url": "/archivos/Oficio/NP-CONF/preview_oficio_p0001.jpg",
      "texto_detectado": "ARMADA DE MEXICO\nNP-CONF\n...",
      "metadatos_ocr": [
        {
          "etiqueta": "Texto",
          "etiqueta_original": "text",
          "confianza": 0.9342,
          "coordenadas": [120.0, 250.0, 900.0, 310.0],
          "orden_lectura": 3,
          "seccion_naval": "Cuerpo_del_Oficio",
          "contenido_ocr": "Texto reconocido",
          "page_index": 1
        }
      ],
      "error": null
    }
  ],
  "status": "Pendiente de aprobacion",
  "error": null
}
```

# 8. Human-in-the-Loop Workflow

El flujo humano inicia cuando `requiere_aprobacion=True` o cuando se detecta un duplicado semántico.

Cómo llega el texto al revisor:

1. `/subir-oficios/` o el subprocess del job genera metadata JSON.
2. El response incluye `ruta_metadata`, `paginas`, `preview_url`, `metadatos_ocr` y `texto_detectado`.
3. Flutter muestra la revisión en `frontend/lib/screens/review_ocr_screen.dart`.
4. La pantalla recibe páginas, previews y bloques espaciales.
5. El usuario puede editar bloques sobre la imagen o usar texto completo por página si no hay bloques válidos.

Campos editables:

- `contenido_ocr` por bloque OCR.
- Texto completo por página de respaldo (`fallback_text_{page_index}`).
- Nombre del documento (`nombre_documento`) al aprobar.

Approval flow:

1. Flutter construye `ocr_blocks` con `id`, `etiqueta`, `page_index`, `coordenadas`, `contenido_ocr`.
2. Llama `POST /documentos/aprobar-pendiente`.
3. Backend valida que `ruta_metadata` esté dentro de `BASE_UPLOAD_DIR` y termine en `_metadata.json`.
4. Si hay bloques editados, `_aplicar_edicion_ocr_en_metadata` reconstruye texto por página y `texto_extraido`.
5. Revalida duplicado semántico con umbral `0.90`.
6. Si hay duplicado y no hay confirmación, responde `409 DOCUMENT_DUPLICATE`.
7. Si se confirma o no hay duplicado, guarda en PostgreSQL.
8. Actualiza metadata con `db_guardado=True`, `db_documento_id`, usuario aprobador, fecha y status.
9. Registra auditoría `approve_document`.

Rejection flow:

1. Flutter/cliente llama `POST /documentos/rechazar-pendiente`.
2. Backend valida metadata.
3. Marca `rechazado=True`, `db_guardado=False`, `rechazado_por`, `fecha_rechazo`, `status="Rechazado"`.
4. No inserta en `documentos` ni `documento_chunks`.

Reglas de validación:

- La metadata debe existir y residir dentro de `BASE_UPLOAD_DIR`.
- La ruta debe terminar en `_metadata.json`.
- No se puede aprobar si no hay `texto_extraido` reconstruible.
- Un documento ya aprobado retorna éxito idempotente.
- Duplicados requieren confirmación explícita.
- Los bloques sin texto se descartan.

# 9. Domain Logic

Reglas de negocio identificadas:

| Regla | Implementación |
|---|---|
| Autenticación obligatoria | `get_current_user` en endpoints OCR/documentales. |
| Roles para administración | `require_role("admin")` y `require_role("super_admin")` en borrado/backfill. |
| Máximo de archivos por lote | `MAX_ACTIVE_UPLOADS_PER_USER = 5` en `/subir-oficios/`. |
| Máximo de jobs activos por usuario | `count_active_for_user >= 5` en `/ocr/jobs/`. |
| Formatos principales permitidos | PDF, DOCX, PPTX para carga principal. |
| Formatos técnicos de layout | JPG, JPEG, PNG, PDF para `/analizar-layout/`. |
| Tamaño máximo | `OCR_MAX_UPLOAD_BYTES`, 80 MB por defecto. |
| Máximo de páginas | `OCR_MAX_PAGES_PER_DOC`, 40 por defecto. |
| Seguridad de imagen | Reducción si supera 12M píxeles o 4096 px de lado. |
| Clasificación de nivel de protección | Niveles `NP-AS`, `NP-SEC`, `NP-CONF`, `NP-REST`, `NP-PUO`, `NP-DUP`. |
| Correcciones OCR de nivel | `LEVEL_CORRECTIONS`, por ejemplo `MP-CONF` -> `NP-CONF`. |
| Prioridad documental | `NP-AS`, `NP-SEC`, `NP-CONF` se consideran prioritarios en `nodo_analista_seguridad`. |
| Duplicado semántico | Embedding del texto inicial contra `documento_chunks`, umbral 0.90 en aprobación. |
| Persistencia diferida | Si requiere aprobación, no se guarda en DB hasta aprobación humana. |
| Auditoría | Upload, aprobación, edición/borrado documental registran eventos. |
| Cancelación jobs | El usuario puede cancelar; el manager mata el grupo de proceso del subprocess. |
| Heartbeat | Jobs sin heartbeat se cancelan por watchdog. |
| Fallback OCR | Si layout no retorna elementos, se ejecuta OCR directo. |
| Fallback embeddings | Si SentenceTransformers/Ollama falla, se usa embedding determinístico. |

Error handling:

- Errores OOM se transforman en HTTP 413 con mensaje operacional.
- Duplicados devuelven HTTP 409.
- Formatos inválidos devuelven HTTP 400.
- Fallos de subprocess devuelven status `error` y detalle.
- El OCR por página captura excepciones y permite resultado parcial si no fallan todas las páginas.

# 10. Dependencies

Dependencias OCR y relacionadas:

| Library | Version | Purpose | Mandatory? |
|---|---:|---|---|
| `paddlepaddle` | `3.2.1` | Runtime de inferencia Paddle. | Sí |
| `paddleocr[all]` | `3.5.0` | OCR principal y LayoutDetection. | Sí |
| `opencv-python-headless` | No fijada | Lectura/escritura de imagen, resize, recortes, anotaciones. | Sí |
| `numpy` | `1.24.4` | Cálculo numérico, agrupación, embeddings fallback. | Sí |
| `pdf2image` | No fijada | Conversión PDF a imágenes. | Sí para PDF |
| `Pillow` | No fijada | Backend de imágenes usado por `pdf2image`. | Sí para PDF |
| `python-pptx` | No fijada | Validación de PPTX antes de conversión. | Sí para PPTX |
| LibreOffice | Sistema | Conversión DOC/DOCX/PPTX a PDF. | Sí para Office |
| Poppler | Sistema | Requerido por `pdf2image`. | Sí para PDF |
| `langgraph` | No fijada | Orquestación del pipeline OCR. | Sí en arquitectura actual; opcional en migración inicial |
| `sentence-transformers` | No fijada | Embeddings locales para chunks/duplicados. | Sí si se migra RAG/duplicados |
| `httpx` | No fijada | Llamadas a Ollama embeddings. | Opcional |
| `pgvector` | No fijada | Tipo vector SQLAlchemy y búsquedas semánticas. | Sí si se migra RAG/duplicados |
| `psycopg2-binary` | No fijada | Acceso PostgreSQL directo. | Sí en arquitectura actual |
| `sqlalchemy` | No fijada | ORM para jobs OCR y modelos. | Sí en arquitectura actual |
| `fastapi` | No fijada | API HTTP/WebSocket. | Sí |
| `python-multipart` | No fijada | Upload multipart. | Sí |
| `websockets` | No fijada | Soporte WebSocket frontend/backend. | Sí para jobs en tiempo real |
| `pydantic-settings` | No fijada | Configuración por entorno. | Sí |
| `transformers` | No fijada | Dependencia IA indirecta. | Opcional según modelos |
| `safetensors` | No fijada | Pesos/modelos IA. | Opcional según modelos |

# 11. Reusable Components

Esta es la zona de mayor valor para DocDaiWeb. La recomendación es migrar el núcleo OCR como adaptadores de infraestructura, no como servicios de dominio.

| Componente actual | Responsabilidad | Dependencias | ¿Copiar directo? | Adaptación requerida | Dificultad |
|---|---|---|---|---|---|
| `backend/app/services/ocr/model_loader.py` | Inicializar PaddleOCR y LayoutDetection con configuración defensiva. | PaddleOCR, settings. | Parcialmente | Reemplazar import de `settings` por configuración inyectada. | Media |
| `backend/app/services/ocr/ocr_runner.py` | Ejecutar OCR y normalizar respuestas PaddleOCR v3/legacy. | NumPy, PaddleOCR object. | Sí, casi directo | Convertir dicts a DTOs si DocDaiWeb usa entidades tipadas. | Baja |
| `backend/app/services/ocr/layout_detector.py` | Ejecutar LayoutDetection, parsear cajas, ordenar lectura. | NumPy, settings, labels. | Parcialmente | Inyectar clasificación de sección y config; separar async executor. | Media |
| `backend/app/services/ocr/postprocessor.py` | Orden de lectura, clasificación de secciones, NP, ROI, visualizaciones y recortes. | OpenCV, NumPy. | Parcialmente | Dividir en servicios: `ProtectionLevelDetector`, `LayoutVisualizer`, `RegionCropper`. | Media |
| `backend/app/services/ocr/image_preprocessor.py` | Clamp/crop/ROI simple. | NumPy. | Sí | Puede ir como utilitario de infraestructura OCR. | Baja |
| `backend/app/services/ocr/types.py` | TypedDicts, labels de layout, colores, tipos de texto. | Typing. | Sí | Convertir a dataclasses/Pydantic/domain DTOs si aplica. | Baja |
| `backend/app/services/ocr/engine.py` | Fachada OCR: layout + OCR por regiones + fallback directo. | OpenCV, OCRRunner, LayoutDetector, PostProcessor, model_loader. | Parcialmente | Extraer interfaz de dominio `OcrProvider`; evitar singleton global rígido. | Media |
| `backend/app/infrastructure/external/convert.py` | Convertir PDF/DOCX/PPTX/JPG/PNG a páginas imagen. | pdf2image, LibreOffice, python-pptx. | Parcialmente | Aislar en `DocumentToImageConverter`; mejorar limpieza de temporales. | Media |
| `backend/app/workflows/ocr/state.py` | Contratos de estado OCR batch. | Typing. | Parcialmente | Convertir a DTOs de caso de uso; no depender de LangGraph al inicio. | Baja |
| `backend/app/workflows/ocr/nodes.py` | Nodos OCR, clasificación NP y duplicados. | ocr_service, LangGraph, OpenCV. | No directo | Separar casos de uso: OCR batch, clasificación, duplicados. | Alta |
| `backend/app/workflows/ocr/workflow.py` | Grafo LangGraph OCR. | LangGraph. | No inicialmente | Reimplementar como caso de uso o grafo futuro. | Media-Alta |
| `backend/app/services/ocr/job_manager.py` | Cola de jobs, concurrencia, cancelación, heartbeat, watchdog. | asyncio, SQLAlchemy model. | Parcialmente | Separar puerto `OcrJobRepository`; no acoplar a `OCRJobModel`. | Alta |
| `backend/app/services/ocr/job_events.py` | Eventos WebSocket de progreso. | FastAPI WebSocket. | Parcialmente | Separar publicador de eventos de infraestructura web. | Media |
| `backend/app/services/ocr/ocr_subprocess_entry.py` | Ejecutar OCR en proceso aislado. | Router actual, UploadFile. | No directo | Reescribir para invocar caso de uso, no router HTTP. | Alta |
| Funciones `_normalizar_ruido_ocr_documental`, `_extraer_entidades_documentales` | Normalización y entidades SEMAR. | Regex. | Sí | Mover a dominio o aplicación según reglas de negocio. | Baja |
| `_segmentar_texto_documental`, `_partir_texto_en_chunks` | Segmentación para chunks. | Regex/settings. | Parcialmente | Convertir en servicio de aplicación `ChunkDocumentUseCase`. | Media |
| `_generar_embeddings*` | Embeddings SentenceTransformers/Ollama/fallback. | NumPy, httpx, SentenceTransformers. | Parcialmente | Separar proveedores `EmbeddingProvider`. | Media |
| `verificar_duplicado_semantico` | Detección por similitud cosine en pgvector. | DB, embeddings, settings. | No directo | Reescribir con repositorio/puerto de búsqueda vectorial. | Alta |
| `guardar_resultado_en_db` | Persistencia documento + chunks + embeddings. | psycopg2, settings. | No | Debe ser caso de uso + repositorios en DocDaiWeb. | Alta |
| `_normalizar_bloques_editados`, `_aplicar_edicion_ocr_en_metadata` | Aplicar edición humana a metadata OCR. | JSON/dicts. | Parcialmente | Convertir a caso de uso `ApplyHumanOcrReview`. | Media |
| `sanitize_filename`, `sanitize_document_name` | Sanitización de nombres. | Regex/os. | Sí | Ubicar como utilitario compartido o value object. | Baja |
| `_validate_upload_size`, `_validate_total_pages` | Validaciones de carga. | FastAPI HTTPException/settings. | Parcialmente | Cambiar excepciones HTTP por errores de aplicación. | Baja-Media |
| `_downscale_image_if_needed` | Seguridad de memoria para imágenes. | OpenCV/settings. | Parcialmente | Mover a `ImageSafetyAdapter` con config inyectada. | Baja-Media |
| `frontend/lib/controllers/upload_queue_controller.dart` | UX de cola OCR, polling, WebSocket, heartbeat. | Flutter, ApiService. | Solo si DocDaiWeb reutiliza Flutter | Adaptar endpoints y modelos. | Media |
| `frontend/lib/screens/review_ocr_screen.dart` | Editor visual de bloques OCR por página. | Flutter UI. | Parcialmente | Reapuntar contratos y corregir textos/estilo de DocDaiWeb. | Media |

# 12. Components that SHOULD NOT be migrated

| Componente | Razón para no migrar directamente |
|---|---|
| `backend/app/api/routers/ocr.py` completo | Mezcla HTTP, auth, validación, filesystem, workflow, DB, auditoría, jobs y lógica de negocio. Es incompatible con Clean Architecture si se copia tal cual. |
| `guardar_resultado_en_db` tal cual | Usa `psycopg2`, SQL inline y settings globales. Debe reescribirse detrás de repositorios. |
| `verificar_duplicado_semantico` tal cual | Acopla embeddings, conexión DB y SQL pgvector en un servicio OCR. Debe separarse en puerto de búsqueda semántica. |
| `ocr_subprocess_entry.py` tal cual | Importa el router y llama `upload_files` directamente. En DocDaiWeb debe invocar un caso de uso. |
| Modelos ORM actuales sin adaptación | `Documento`, `DocumentoChunk`, `OCRJobModel` están diseñados para este esquema y no necesariamente para el dominio de DocDaiWeb. |
| Rutas `/dashboard`, `/documentos`, `/chunks` del router OCR | Son administración documental/UI, no núcleo OCR. |
| `archivos_semar/` | Datos operativos sensibles; no debe migrarse como código. |
| Configuración SEMAR completa | Variables como rutas, CORS y credenciales pertenecen al entorno actual. |
| Frontend Flutter completo | DocDaiWeb usa FastAPI; salvo que también use este Flutter, la UI no debe migrarse como dependencia del backend. |
| Docker Compose completo | Contiene servicios y credenciales de desarrollo SEMAR; migrar conceptos, no el archivo literal. |
| `nodo_limpieza_opencv` actual | No aporta preprocesamiento real; solo incrementa intentos. |
| `detectar_documentos_duplicados` legacy | Consulta una columna `embeddings` en `documentos` que no aparece en el DDL principal; preferir la verificación semántica por chunks. |

# 13. Migration Guide

Step 1: Inventariar el contrato objetivo de DocDaiWeb.

- Definir entidades: `Document`, `OcrPage`, `OcrBlock`, `OcrResult`, `HumanReview`, `ProtectionLevel`.
- Definir puertos: `OcrProvider`, `DocumentConverter`, `ImagePreprocessor`, `OcrJobRepository`, `DocumentRepository`, `VectorSearchRepository`, `EmbeddingProvider`, `EventPublisher`.

Step 2: Migrar configuración mínima OCR.

- Copiar valores conceptuales de `settings.py`: modelo, idioma, GPU, MKLDNN, workers, límites de archivo, límites de imagen, DPI y modelo layout.
- No copiar secretos ni rutas SEMAR.

Step 3: Migrar conversión documental.

- Tomar `convert.py`.
- Convertirlo en adaptador `PdfOfficeDocumentConverter`.
- Inyectar DPI y `max_pages`.
- Añadir limpieza explícita de directorios temporales.

Step 4: Migrar núcleo PaddleOCR.

- Migrar `model_loader.py`, `ocr_runner.py`, `layout_detector.py`, `postprocessor.py`, `image_preprocessor.py` y `types.py`.
- Sustituir imports relativos de `settings` por configuración inyectada.
- Mantener fallbacks de PaddleOCR v3 porque los tests muestran que son críticos.

Step 5: Crear caso de uso de extracción OCR.

- Encapsular el flujo: convertir documento, limitar imágenes, ejecutar OCR por página, consolidar texto, detectar NP y devolver DTO.
- No llamar routers desde servicios.

Step 6: Migrar clasificación SEMAR como dominio o aplicación.

- Extraer patrones NP y correcciones OCR.
- Definir `ProtectionLevelDetector`.
- Mantener niveles `NP-AS`, `NP-SEC`, `NP-CONF`, `NP-REST`, `NP-PUO`, `NP-DUP`.

Step 7: Migrar revisión humana.

- Convertir `_normalizar_bloques_editados` y `_aplicar_edicion_ocr_en_metadata` en caso de uso `ApplyOcrReviewUseCase`.
- Persistir estado pendiente en repositorio, no en JSON local salvo que DocDaiWeb lo use como adapter temporal.

Step 8: Migrar persistencia.

- Reimplementar `guardar_resultado_en_db` como caso de uso que use repositorios.
- Insertar documentos, páginas, bloques y chunks según el modelo DocDaiWeb.
- Separar generación de embeddings de inserción SQL.

Step 9: Migrar jobs si DocDaiWeb necesita OCR asíncrono.

- Reusar ideas de `job_manager.py`: cola, semáforo, heartbeat, cancelación, watchdog.
- Reescribir store contra repositorio propio.
- Reescribir subprocess para invocar caso de uso.

Step 10: Migrar duplicados semánticos.

- Crear `EmbeddingProvider`.
- Crear `VectorSearchRepository`.
- Portar lógica de umbral `0.90`, filtro por nivel y similitud `1 - distancia`.

Step 11: Agregar pruebas antes de integrar.

- Tests para parsing PaddleOCR v3.
- Tests para conversión multipágina.
- Tests para NP y correcciones.
- Tests para revisión humana y reconstrucción de texto.
- Tests para límites de tamaño/páginas.
- Tests para jobs/cancelación si se migran.

Step 12: Integrar con LangGraph como fase posterior.

- No migrar el grafo primero.
- Una vez estable el caso de uso OCR, envolverlo en nodos LangGraph si DocDaiWeb lo requiere.

# 14. Compatibility with DocDaiWeb

DocDaiWeb usa FastAPI, Clean Architecture, Hexagonal Architecture, use cases, dependency injection, domain interfaces, PaddleOCR y futura integración LangGraph. La migración debe ubicar cada pieza según su responsabilidad.

Mapa recomendado:

| Proyecto actual | DocDaiWeb destino recomendado | Motivo |
|---|---|---|
| `backend/app/services/ocr/types.py` | `src/domain/ocr/entities.py` o `src/application/ocr/dtos.py` | Contratos de bloques, páginas y resultados. |
| `backend/app/services/ocr/model_loader.py` | `src/infrastructure/ocr/paddle_model_loader.py` | Carga concreta de PaddleOCR. |
| `backend/app/services/ocr/ocr_runner.py` | `src/infrastructure/ocr/paddle_ocr_runner.py` | Adaptador específico PaddleOCR. |
| `backend/app/services/ocr/layout_detector.py` | `src/infrastructure/ocr/paddle_layout_detector.py` | Adaptador de LayoutDetection. |
| `backend/app/services/ocr/postprocessor.py` | `src/application/ocr/services/ocr_postprocessor.py` y `src/infrastructure/ocr/ocr_visualizer.py` | Separar reglas de texto de visualización OpenCV. |
| `backend/app/services/ocr/image_preprocessor.py` | `src/infrastructure/image/image_preprocessor.py` | Utilidad técnica de imagen. |
| `backend/app/services/ocr/engine.py` | `src/infrastructure/ocr/paddle_provider.py` | Implementación del puerto `OcrProvider`. |
| `backend/app/infrastructure/external/convert.py` | `src/infrastructure/document_conversion/pdf_office_converter.py` | Adaptador para convertir documentos a páginas imagen. |
| `_validate_upload_size`, `_validate_total_pages` | `src/application/documents/validators.py` | Validaciones de caso de uso, sin `HTTPException`. |
| `sanitize_filename`, `sanitize_document_name` | `src/application/shared/sanitizers.py` o value objects | Reglas de limpieza reutilizables. |
| Patrones `VALID_LEVELS`, `LEVEL_CORRECTIONS`, NP regex | `src/domain/documents/protection_level.py` | Regla de dominio documental. |
| `nodo_analista_seguridad` | `src/application/ocr/services/protection_level_detector.py` | Servicio de aplicación/dominio. |
| `_normalizar_ruido_ocr_documental` | `src/application/documents/services/document_text_normalizer.py` | Normalización documental. |
| `_extraer_entidades_documentales` | `src/application/documents/services/document_entity_extractor.py` | Extracción heurística de entidades. |
| `_segmentar_texto_documental`, `_partir_texto_en_chunks` | `src/application/chunking/document_chunker.py` | Caso de uso o servicio de chunking. |
| `_generar_embeddings_sentence_transformers` | `src/infrastructure/embeddings/sentence_transformers_provider.py` | Adaptador concreto. |
| `_generar_embeddings_ollama` | `src/infrastructure/embeddings/ollama_embedding_provider.py` | Adaptador concreto. |
| `verificar_duplicado_semantico` | `src/application/documents/use_cases/check_duplicate_document.py` | Caso de uso con puertos de embeddings/vector search. |
| `guardar_resultado_en_db` | `src/application/documents/use_cases/approve_ocr_document.py` | Caso de uso; repositorios inyectados. |
| `_normalizar_bloques_editados` | `src/application/ocr/services/human_review_normalizer.py` | Limpieza de payload humano. |
| `_aplicar_edicion_ocr_en_metadata` | `src/application/ocr/use_cases/apply_human_review.py` | Reconstrucción de texto revisado. |
| `backend/app/workflows/ocr/state.py` | `src/application/ocr/dtos.py` o `src/infrastructure/workflows/ocr_state.py` | DTO si no se usa LangGraph; state si se usa. |
| `backend/app/workflows/ocr/nodes.py` | `src/infrastructure/workflows/ocr_nodes.py` | Solo cuando se active LangGraph. |
| `backend/app/workflows/ocr/workflow.py` | `src/infrastructure/workflows/ocr_workflow.py` | Orquestación externa a dominio. |
| `backend/app/services/ocr/job_manager.py` | `src/application/ocr/jobs/ocr_job_manager.py` + `src/domain/ocr/repositories.py` | Separar manager de store. |
| `backend/app/services/ocr/job_events.py` | `src/infrastructure/events/websocket_ocr_event_publisher.py` | Publicación de eventos fuera del dominio. |
| `backend/app/services/ocr/ocr_subprocess_entry.py` | `src/infrastructure/ocr/subprocess_worker.py` | Invocar use case, no router. |
| `backend/app/api/routers/ocr.py` endpoints upload/job | `src/interfaces/http/routers/ocr_router.py` | Router delgado que llama use cases. |
| `backend/app/infrastructure/db/sql/init_db.sql` tablas OCR | Migraciones DocDaiWeb | Adaptar a esquema propio. |
| `backend/app/infrastructure/db/orm_models.py::OCRJobModel` | `src/infrastructure/db/models/ocr_job_model.py` | Si se mantiene jobs persistentes. |
| `backend/app/infrastructure/db/orm_models.py::DocumentoChunk` | `src/infrastructure/db/models/document_chunk_model.py` | Si se migra RAG/pgvector. |
| `frontend/lib/screens/review_ocr_screen.dart` | UI DocDaiWeb correspondiente | Solo si DocDaiWeb reutiliza Flutter o requiere una UI similar. |

Estructura hexagonal sugerida:

```text
src/
├── domain/
│   ├── documents/
│   │   ├── entities.py
│   │   ├── protection_level.py
│   │   └── repositories.py
│   └── ocr/
│       ├── entities.py
│       └── ports.py
├── application/
│   ├── ocr/
│   │   ├── use_cases/extract_document_text.py
│   │   ├── use_cases/apply_human_review.py
│   │   ├── services/protection_level_detector.py
│   │   └── dtos.py
│   ├── documents/
│   │   └── use_cases/approve_ocr_document.py
│   └── chunking/
│       └── document_chunker.py
├── infrastructure/
│   ├── ocr/
│   │   ├── paddle_provider.py
│   │   ├── paddle_model_loader.py
│   │   ├── paddle_ocr_runner.py
│   │   └── paddle_layout_detector.py
│   ├── document_conversion/
│   ├── embeddings/
│   ├── db/
│   └── events/
└── interfaces/
    └── http/
        └── routers/ocr_router.py
```

# 15. Risks During Migration

Breaking dependencies:

- `model_loader.py`, `engine.py`, `layout_detector.py` y `ocr_service.py` dependen de `settings` globales.
- `ocr_service.py` depende directamente de PostgreSQL y embeddings.
- `ocr_subprocess_entry.py` depende del router, lo cual rompe inversión de dependencias.
- `job_manager.py` depende de `OCRJobModel` y `SessionLocal` en `DbOcrJobStore`.

Hidden coupling:

- `layout_engine = ocr_engine` conserva compatibilidad antigua.
- `ocr.py` contiene utilidades que parecen genéricas pero lanzan `HTTPException`.
- La metadata JSON local es parte del contrato real con la UI.
- El frontend espera `ruta_metadata`, `paginas`, `preview_url`, `metadatos_ocr` y duplicados con estructura específica.

Performance issues:

- `convert_from_path` puede convertir todas las páginas en memoria.
- `PP-DocLayout_plus-L` puede ser pesado en CPU.
- `paddleocr[all]` descarga/carga modelos pesados.
- OCR por regiones multiplica llamadas cuando hay muchos elementos de layout.
- SentenceTransformers puede consumir memoria alta.
- Subprocess mejora estabilidad, pero aumenta costo de arranque.

Platform differences:

- LibreOffice debe estar instalado y disponible en PATH.
- Poppler debe estar instalado para `pdf2image`.
- Docker necesita fuentes compatibles con Paddle/PaddleX.
- GPU requiere CUDA compatible, no basta con cambiar `OCR_USE_GPU=True`.
- `preexec_fn=os.setsid` es Unix/Linux específico; no funciona igual en Windows.

Configuration issues:

- `BASE_UPLOAD_DIR` cambia entre local y Docker.
- `OCR_MAX_UPLOAD_BYTES` difiere entre settings default y Docker Compose.
- `EMBEDDING_DIMENSION` debe coincidir con el modelo y la columna `vector(768)`.
- `OCR_ENABLE_MKLDNN=True` puede reactivar errores nativos.
- CORS y rutas estáticas `/archivos` son contratos visibles para frontend.

Version incompatibilities:

- PaddleOCR v3 cambió formatos de respuesta; el parser actual ya cubre varios casos.
- `LayoutDetection.predict` cambia firmas; el código actual reintenta con kwargs reducidos.
- SQLAlchemy/pgvector pueden requerir cambios si DocDaiWeb usa Alembic o async SQLAlchemy.
- Flutter y backend tienen estados de job normalizados a mano; cambios de status rompen UX.

Riesgos de dominio:

- Los niveles de protección y correcciones OCR son reglas SEMAR; deben validarse antes de trasladarlas a otro dominio.
- La detección de personas/folios/dependencias es regex heurística, no NER robusto.
- El sistema actual no calcula confianza global aunque el esquema sugiere que podría hacerlo.

# 16. Final Recommendations

1. Migrar primero el **núcleo OCR técnico**: `model_loader`, `ocr_runner`, `layout_detector`, `image_preprocessor`, partes de `postprocessor` y `convert.py`.

2. No copiar `ocr.py` completo. Reescribirlo como router delgado en DocDaiWeb, delegando todo a casos de uso.

3. Definir puertos de dominio antes de adaptar PaddleOCR:

- `OcrProvider`
- `DocumentConverter`
- `ImagePreprocessor`
- `EmbeddingProvider`
- `VectorSearchRepository`
- `DocumentRepository`
- `OcrJobRepository`
- `OcrEventPublisher`

4. Mantener las defensas de PaddleOCR v3. Los tests del proyecto demuestran que el parser robusto de `OCRRunner` es una pieza crítica y muy reutilizable.

5. Convertir la revisión humana en un caso de uso independiente. DocDaiWeb no debería depender de metadata JSON local como fuente de verdad; puede usarla solo como adaptador temporal si se necesita compatibilidad.

6. Separar clasificación de nivel de protección del motor OCR. OCR extrae texto; la clasificación `NP-*` es regla documental.

7. Separar RAG/duplicados del OCR. La detección semántica es una capacidad posterior al OCR y debe depender de embeddings/vector search por interfaces.

8. Mejorar el preprocesamiento antes o durante la migración. Actualmente faltan deskew, EXIF, binarización, denoise y contraste; si DocDaiWeb necesita calidad superior, implementar estos pasos como estrategia configurable.

9. Mantener subprocess para producción si se usará PaddleOCR local. Es una buena decisión arquitectónica para aislar fallos nativos, OOM y cancelaciones.

10. Usar migraciones formales en DocDaiWeb. No portar SQL inline directamente; modelar tablas de documentos, páginas, bloques, chunks, revisiones y jobs según el dominio objetivo.

11. Probar con documentos reales representativos antes de declarar paridad. La migración debe validar PDF multipágina, DOCX, PPTX, layouts sin detección, textos cortos, documentos duplicados, documentos sin NP, OOM y cancelación.

12. Integrar LangGraph al final. Primero estabilizar casos de uso puros; después envolverlos en nodos para flujos más sofisticados.

Resumen arquitectónico final: el proyecto actual contiene un núcleo OCR valioso y migrable, pero está envuelto en una capa de aplicación acoplada a SEMAR. Para DocDaiWeb, la estrategia correcta es **extraer adaptadores técnicos de OCR y conversión**, **reconstruir casos de uso limpios**, y **preservar reglas de negocio solo cuando apliquen al nuevo dominio**.
