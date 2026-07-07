# apps/backend/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="DocDaiWeb API",
    description="API para el procesamiento documental y visión por computadora en la plataforma DocDaiWeb.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthCheckResponse(BaseModel):
    status: str
    version: str

@app.get("/")
def root():
    return {
        "message": "Bienvenido a la API de DocDaiWeb"
    }

@app.get("/health", response_model=HealthCheckResponse, tags=["Mantenimiento"])
def health_check():
    """Endpoint para verificar el estado del servidor y contratos de infraestructura"""
    return HealthCheckResponse(status="healthy", version="1.0.0")