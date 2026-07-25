"""Casos de uso que definen el límite de integración de autenticación."""

from src.application.schemas.auth import LoginRequest, PendingOperationResponse, RegisterRequest


class AuthenticateUserUseCase:
    """Caso de uso de autenticación futura; todavía no emite un token."""

    def execute(self, _: LoginRequest) -> PendingOperationResponse:
        """Mantiene explícita y sin implementar la capacidad de JWT."""
        return PendingOperationResponse(detail="La autenticación JWT aún no está configurada.")


class RegisterUserUseCase:
    """Caso de uso de registro futuro; todavía no persiste credenciales."""

    def execute(self, _: RegisterRequest) -> PendingOperationResponse:
        """Mantiene la persistencia de credenciales fuera del alcance actual."""
        return PendingOperationResponse(detail="El registro de usuarios aún no está configurado.")
