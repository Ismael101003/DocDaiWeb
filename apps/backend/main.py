from fastapi import FastAPI

app = FastAPI(

    title="DocDai API",
    description="API de docdaiweb",
    version="1.0.0",
)

@app.get("/")
def root():
    return {
        "message": "Bienvenido a la API de DocDaiweb"
    }