"""Límite del caso de uso para listar profesionales de la salud."""

from src.application.schemas.doctor import DoctorListResponse


class ListDoctorsUseCase:
    """Devuelve una colección vacía hasta que se configure un repositorio."""

    def execute(self) -> DoctorListResponse:
        """Evita fabricar registros de profesionales de la salud."""
        return DoctorListResponse()
