"""Composición de routers HTTP versionados."""

from fastapi import APIRouter

from src.adapters.api.routes import auth, doctor, document, health, ocr, patient

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(patient.router, prefix="/patients", tags=["Patients"])
api_router.include_router(doctor.router, prefix="/doctors", tags=["Doctors"])
api_router.include_router(document.router, prefix="/documents", tags=["Documents"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
