"""Puerto de dominio para futuras implementaciones de tokens de acceso."""

from typing import Protocol


class TokenProvider(Protocol):
    """Emite tokens sin acoplar el dominio a una biblioteca JWT."""

    def issue_access_token(self, subject: str) -> str:
        """Crea un token de acceso para el sujeto proporcionado."""
        ...
