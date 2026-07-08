from fastapi import APIRouter, APIrouter

router = APIRouter()

@router.get("/login")
def login():
    return {"message": "Login pendiente"
    }

@router.post("/registrer")
def registrer():
    return {
        "message": "Registro pendiente"
    }