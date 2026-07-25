"""Límite del caso de uso para listar pacientes."""

from src.application.schemas.patients import PatientListResponse


class ListPatientsUseCase:
    """Devuelve una colección vacía hasta que se configure un repositorio."""

    def execute(self) -> PatientListResponse:
        """Evita fabricar o exponer datos clínicos."""
        return PatientListResponse()
