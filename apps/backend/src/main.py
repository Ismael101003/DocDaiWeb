# apps/backend/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="DocDaiWeb API",
    description="Backend escalable para el procesamiento agéntico de documentos y memorias técnicas",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # El puerto por defecto de tu Vite Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthCheckResponse(BaseModel):
    status: str
    version: str

@app.get("/health", response_model=HealthCheckResponse, tags=["Mantenimiento"])
def health_check():
    """Endpoint para verificar el estado del servidor y contratos de infraestructura"""
    return HealthCheckResponse(status="healthy", version="1.0.0")