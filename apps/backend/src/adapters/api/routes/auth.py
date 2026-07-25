"""Endpoints HTTP para la futura autenticación."""

from fastapi import APIRouter, status

from src.application.schemas.auth import LoginRequest, PendingOperationResponse, RegisterRequest
from src.application.use_cases.auth import AuthenticateUserUseCase, RegisterUserUseCase

router = APIRouter()


@router.post("/login", response_model=PendingOperationResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def login(payload: LoginRequest) -> PendingOperationResponse:
    """Acepta el contrato de inicio de sesión; la emisión de tokens se agregará mediante un puerto de dominio."""
    return AuthenticateUserUseCase().execute(payload)


@router.post("/register", response_model=PendingOperationResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def register(payload: RegisterRequest) -> PendingOperationResponse:
    """Acepta el contrato de registro sin crear credenciales todavía."""
    return RegisterUserUseCase().execute(payload)
