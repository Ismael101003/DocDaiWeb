from fastapi import APIRouter

router = APIRouter()

@router.post("/extract")
def extract():
    return {
        "message": "OCR pendiente"
    }