from fastapi import FastAPI

from app.database.base import Base
from app.database.connection import engine
from app.database.models import ImportJob, ImportRecord
from app.api.routes.imports import router as imports_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="OnePrism CSV Import API",
    version="1.0.0"
)

app.include_router(imports_router)


@app.get("/")
def health_check():
    return {
        "message": "OnePrism API is running"
    }