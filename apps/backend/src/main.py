"""Punto de entrada de la aplicación FastAPI de DocDaiWeb."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.adapters.api.router import api_router
from src.application.schemas.common import ErrorResponse, ServiceInfoResponse

APP_VERSION = "0.1.0"
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Gestiona recursos de la aplicación sin iniciar servicios externos todavía."""
    yield


app = FastAPI(
    title="DocDaiWeb API",
    version=APP_VERSION,
    description=(
        "API versionada para la digitalización segura de documentos médicos. "
        "Los resultados de OCR requieren validación humana antes de aprobarse."
    ),
    openapi_tags=[
        {"name": "Authentication", "description": "Contratos para autenticación futura."},
        {"name": "Health", "description": "Estado del servicio."},
        {"name": "Patients", "description": "Operaciones de pacientes."},
        {"name": "Doctors", "description": "Operaciones de profesionales de salud."},
        {"name": "Documents", "description": "Carga y gestión documental."},
        {"name": "OCR", "description": "Solicitudes de OCR sujetas a revisión humana."},
    ],
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(HTTPException)
async def handle_http_exception(_: Request, exc: HTTPException) -> JSONResponse:
    """Devuelve un formato de error estable y documentado para errores esperados."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(detail=str(exc.detail)).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Evita filtrar el contenido de la solicitud al informar una estructura inválida."""
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(detail="Solicitud inválida.", errors=exc.errors()).model_dump(),
    )


@app.exception_handler(Exception)
async def handle_unexpected_exception(_: Request, exc: Exception) -> JSONResponse:
    """Registra fallos inesperados sin exponer detalles internos a consumidores de la API."""
    logger.exception("Unexpected API error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(detail="Error interno del servidor.").model_dump(),
    )


@app.get("/", response_model=ServiceInfoResponse, include_in_schema=False)
async def root() -> ServiceInfoResponse:
    """Devuelve una respuesta mínima de identificación del servicio."""
    return ServiceInfoResponse(name="DocDaiWeb API", version=APP_VERSION)


app.include_router(api_router)
