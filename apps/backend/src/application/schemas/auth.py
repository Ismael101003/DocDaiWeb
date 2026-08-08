"""Contratos de aplicación para la futura autenticación."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Credenciales proporcionadas para un futuro flujo de autenticación."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(LoginRequest):
    """Contrato inicial de registro; en esta etapa no se persisten cuentas."""

    full_name: str = Field(min_length=2, max_length=120)


class PendingOperationResponse(BaseModel):
    """Respuesta para una integración pendiente de implementar."""

    status: str = "pending"
    detail: str
