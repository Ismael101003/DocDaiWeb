from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_patients():
    return {
        "id":patient_id
    }
