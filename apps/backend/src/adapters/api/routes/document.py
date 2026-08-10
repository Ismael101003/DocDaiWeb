"""Endpoints HTTP para la recepción de documentos."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from src.application.schemas.common import ErrorResponse
from src.application.schemas.document_review import DocumentReviewRequest, DocumentReviewResponse
from src.application.schemas.document import DocumentUploadResponse, PreparedDocumentResponse
from src.application.schemas.ocr import OcrExtractionResponse
from src.application.schemas.medical_information import MedicalInformationResponse
from src.application.services.medical_information_parser import MedicalInformationParser
from src.application.services.document_upload_validator import (
    DocumentUploadValidator,
    InvalidDocumentUploadError,
)
from src.application.use_cases.request_document_upload import RequestDocumentUploadUseCase
from src.application.use_cases.prepare_document import (
    DocumentNotFoundError,
    PrepareDocumentUseCase,
)
from src.application.use_cases.extract_text import (
    DocumentNotFoundError as OcrDocumentNotFoundError,
    DocumentNotPreparedError,
    ExtractTextUseCase,
)
from src.application.use_cases.parse_medical_information import (
    OcrResultNotAvailableError,
    ParseMedicalInformationUseCase,
)
from src.application.use_cases.review_document import (
    ReviewDocumentNotFoundError,
    ReviewDocumentUseCase,
    ReviewDocumentValidationError,
)
from src.application.use_cases.approve_document_review import ApproveDocumentReviewUseCase
from src.domain.interfaces.document_processor import (
    InvalidDocumentError,
    UnsupportedDocumentError,
)
from src.domain.interfaces.ocr_provider import OcrEngineError
from src.infrastructure.config.document_storage import (
    get_max_upload_size_bytes,
    get_prepared_storage_directory,
)
from src.infrastructure.ocr.document_preparation_processor import (
    LocalDocumentPreparationProcessor,
)
from src.infrastructure.ocr.image_processor import ImageProcessor
from src.infrastructure.ocr.pdf_processor import PdfProcessor
from src.infrastructure.ocr.paddle_provider import PaddleOcrProvider
from src.infrastructure.storage.local_prepared_document_storage import (
    LocalPreparedDocumentStorage,
)
from src.infrastructure.storage.in_memory_document_review_storage import (
    InMemoryDocumentReviewStorage,
)
from src.infrastructure.storage.local_temporary_document_storage import (
    LocalTemporaryDocumentStorage,
)
from src.infrastructure.storage.in_memory_ocr_result_storage import InMemoryOcrResultStorage

router = APIRouter()
_ocr_result_storage = InMemoryOcrResultStorage()
_document_review_storage = InMemoryDocumentReviewStorage()


def get_request_document_upload_use_case() -> RequestDocumentUploadUseCase:
    """Compone las dependencias concretas del caso de uso de carga documental."""
    return RequestDocumentUploadUseCase(
        storage=LocalTemporaryDocumentStorage(),
        validator=DocumentUploadValidator(),
        max_upload_size_bytes=get_max_upload_size_bytes(),
    )


def get_prepare_document_use_case() -> PrepareDocumentUseCase:
    """Compone las dependencias de preparación documental sin incluir OCR."""
    image_processor = ImageProcessor()
    return PrepareDocumentUseCase(
        storage=LocalTemporaryDocumentStorage(),
        processor=LocalDocumentPreparationProcessor(
            pdf_processor=PdfProcessor(image_processor=image_processor),
            image_processor=image_processor,
            prepared_storage_directory=get_prepared_storage_directory(),
        ),
    )


def get_extract_text_use_case() -> ExtractTextUseCase:
    """Compone el caso de uso OCR con el adaptador PaddleOCR local."""
    return ExtractTextUseCase(
        document_storage=LocalTemporaryDocumentStorage(),
        prepared_storage=LocalPreparedDocumentStorage(),
        ocr_provider=PaddleOcrProvider(),
        ocr_result_storage=_ocr_result_storage,
    )


def get_parse_medical_information_use_case() -> ParseMedicalInformationUseCase:
    """Compone el parser puro con el resultado OCR temporal ya disponible."""
    return ParseMedicalInformationUseCase(
        parser=MedicalInformationParser(),
        ocr_result_storage=_ocr_result_storage,
    )


def get_save_document_review_use_case() -> ReviewDocumentUseCase:
    """Compone el caso de uso para guardar la revisión sin aprobarla."""
    return ReviewDocumentUseCase(
        document_storage=LocalTemporaryDocumentStorage(),
        parse_use_case=get_parse_medical_information_use_case(),
        review_storage=_document_review_storage,
        review_status="reviewing",
    )


def get_approve_document_review_use_case() -> ApproveDocumentReviewUseCase:
    """Compone el caso de uso para cerrar la revisión y dejarla aprobada."""
    return ApproveDocumentReviewUseCase(
        document_storage=LocalTemporaryDocumentStorage(),
        parse_use_case=get_parse_medical_information_use_case(),
        review_storage=_document_review_storage,
    )


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Carga un documento médico para procesamiento posterior",
    description=(
        "Acepta archivos PDF, PNG, JPG y JPEG de hasta el límite configurado. "
        "El documento se valida y almacena temporalmente; no se ejecuta OCR ni se "
        "aprueba información clínica en este endpoint."
    ),
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ErrorResponse,
            "description": "El archivo no cumple las reglas de carga.",
        },
        status.HTTP_422_UNPROCESSABLE_CONTENT: {
            "model": ErrorResponse,
            "description": "La solicitud multipart es inválida.",
        },
    },
)
async def upload_document(
    file: UploadFile = File(
        ...,
        description="Archivo PDF, PNG, JPG o JPEG para almacenar temporalmente.",
    ),
    use_case: RequestDocumentUploadUseCase = Depends(get_request_document_upload_use_case),
) -> DocumentUploadResponse:
    """Recibe el archivo HTTP y delega su validación y almacenamiento al caso de uso."""
    try:
        content = await file.read()
        return use_case.execute(
            filename=file.filename,
            content_type=file.content_type,
            content=content,
        )
    except InvalidDocumentUploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible leer el archivo recibido.",
        ) from exc
    finally:
        await file.close()


@router.post(
    "/{document_id}/prepare",
    response_model=PreparedDocumentResponse,
    summary="Prepara un documento para OCR futuro",
    description=(
        "Busca un documento temporal, convierte PDFs a imágenes por página o "
        "normaliza imágenes individuales. No ejecuta OCR ni extrae texto."
    ),
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "El documento temporal no existe.",
        },
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: {
            "model": ErrorResponse,
            "description": "El formato no puede prepararse.",
        },
        status.HTTP_422_UNPROCESSABLE_CONTENT: {
            "model": ErrorResponse,
            "description": "El documento está corrupto o es inválido.",
        },
    },
)
async def prepare_document(
    document_id: str,
    use_case: PrepareDocumentUseCase = Depends(get_prepare_document_use_case),
) -> PreparedDocumentResponse:
    """Delega la preparación del documento al caso de uso correspondiente."""
    try:
        return use_case.execute(document_id=document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except UnsupportedDocumentError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(exc),
        ) from exc


@router.get(
    "/{document_id}/pages/{page}",
    summary="Obtiene una página preparada para revisión humana",
    response_class=FileResponse,
)
async def get_prepared_page(document_id: str, page: int) -> FileResponse:
    """Sirve únicamente PNGs preparados asociados al identificador solicitado."""
    try:
        image_path = LocalPreparedDocumentStorage().get_image_path(
            document_id=document_id,
            page=page,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La página preparada no existe.",
        ) from exc
    except InvalidDocumentError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    return FileResponse(image_path, media_type="image/png", filename=image_path.name)


@router.post(
    "/{document_id}/ocr",
    response_model=OcrExtractionResponse,
    summary="Extrae texto OCR de un documento preparado",
    description=(
        "Ejecuta PaddleOCR sobre las imágenes ya preparadas. El resultado no se "
        "persiste ni se aprueba automáticamente; requiere revisión humana posterior."
    ),
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "El documento temporal no existe.",
        },
        status.HTTP_422_UNPROCESSABLE_CONTENT: {
            "model": ErrorResponse,
            "description": "El documento no ha sido preparado para OCR.",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "model": ErrorResponse,
            "description": "El motor OCR no pudo procesar el documento.",
        },
    },
)
async def extract_document_text(
    document_id: str,
    use_case: ExtractTextUseCase = Depends(get_extract_text_use_case),
) -> OcrExtractionResponse:
    """Delega el OCR al caso de uso sin incluir lógica del motor en la ruta."""
    try:
        result = use_case.execute(document_id=document_id)
        if not isinstance(result, OcrExtractionResponse):
            raise RuntimeError("El caso de uso OCR devolvió un resultado inválido.")
        return result
    except OcrDocumentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except DocumentNotPreparedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except OcrEngineError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="El motor OCR no pudo procesar el documento.",
        ) from exc


@router.post(
    "/{document_id}/parse",
    response_model=MedicalInformationResponse,
    summary="Convierte texto OCR existente en información médica estructurada",
    description=(
        "Usa exclusivamente el resultado OCR temporal de una solicitud previa. No ejecuta OCR, "
        "no persiste información y todos los valores requieren validación humana."
    ),
    responses={
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "No existe un resultado OCR temporal para el documento.",
        },
    },
)
async def parse_medical_information(
    document_id: str,
    use_case: ParseMedicalInformationUseCase = Depends(get_parse_medical_information_use_case),
) -> MedicalInformationResponse:
    """Entrega extracción determinista y no aprobada, sin modificar el documento."""
    try:
        return use_case.execute(document_id=document_id)
    except OcrResultNotAvailableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post(
    "/{document_id}/review",
    response_model=DocumentReviewResponse,
    summary="Guarda una revisión humana del documento",
    description=(
        "Persiste un snapshot de la revisión con estados por campo. No aprueba el expediente, "
        "pero deja listo el contenido para una aprobación posterior."
    ),
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "El documento temporal no existe.",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "No existe un resultado OCR temporal para el documento.",
        },
        status.HTTP_422_UNPROCESSABLE_CONTENT: {
            "model": ErrorResponse,
            "description": "La revisión no coincide con la evidencia disponible.",
        },
    },
)
async def save_document_review(
    document_id: str,
    payload: DocumentReviewRequest,
    use_case: ReviewDocumentUseCase = Depends(get_save_document_review_use_case),
) -> DocumentReviewResponse:
    """Guarda la revisión humana sin marcar todavía la aprobación final."""
    try:
        return use_case.execute(document_id=document_id, request=payload)
    except ReviewDocumentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except OcrResultNotAvailableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ReviewDocumentValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc


@router.post(
    "/{document_id}/review/approve",
    response_model=DocumentReviewResponse,
    summary="Aprueba definitivamente la revisión humana del documento",
    description=(
        "Valida el documento, reusa la evidencia parseada y persiste el snapshot como aprobado. "
        "La identificación del paciente y el merge clínico vendrán en una fase posterior."
    ),
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "El documento temporal no existe.",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "No existe un resultado OCR temporal para el documento.",
        },
        status.HTTP_422_UNPROCESSABLE_CONTENT: {
            "model": ErrorResponse,
            "description": "La revisión aún contiene datos pendientes o no coincide con la evidencia.",
        },
    },
)
async def approve_document_review(
    document_id: str,
    payload: DocumentReviewRequest,
    use_case: ApproveDocumentReviewUseCase = Depends(get_approve_document_review_use_case),
) -> DocumentReviewResponse:
    """Cierra la revisión humana y deja un snapshot aprobado en memoria del backend."""
    try:
        return use_case.execute(document_id=document_id, request=payload)
    except ReviewDocumentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except OcrResultNotAvailableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ReviewDocumentValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
