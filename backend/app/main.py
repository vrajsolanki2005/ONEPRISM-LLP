from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.base import Base
from app.database.connection import engine
from app.database.models import ImportJob, ImportRecord

from app.api.routes.imports import router as imports_router
from app.api.routes.downloads import router as downloads_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="OnePrism CSV Import API",
    version="1.0.0"
)


# CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(imports_router)
app.include_router(downloads_router)


@app.get("/")
def health_check():
    return {
        "message": "OnePrism API is running"
    }
