"""Endpoints HTTP para la recepción de documentos."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from src.application.schemas.common import ErrorResponse
from src.application.schemas.document import DocumentUploadResponse, PreparedDocumentResponse
from src.application.services.document_upload_validator import (
    DocumentUploadValidator,
    InvalidDocumentUploadError,
)
from src.application.use_cases.request_document_upload import RequestDocumentUploadUseCase
from src.application.use_cases.prepare_document import (
    DocumentNotFoundError,
    PrepareDocumentUseCase,
)
from src.domain.interfaces.document_processor import (
    InvalidDocumentError,
    UnsupportedDocumentError,
)
from src.infrastructure.config.document_storage import (
    get_max_upload_size_bytes,
    get_prepared_storage_directory,
)
from src.infrastructure.ocr.document_preparation_processor import (
    LocalDocumentPreparationProcessor,
)
from src.infrastructure.ocr.image_processor import ImageProcessor
from src.infrastructure.ocr.pdf_processor import PdfProcessor
from src.infrastructure.storage.local_temporary_document_storage import (
    LocalTemporaryDocumentStorage,
)

router = APIRouter()


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
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
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
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
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
    except InvalidDocumentError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
