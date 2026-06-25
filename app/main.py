from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.controllers.frontend_controller import router as frontend_router
from app.controllers.product_controller import router as product_router
from app.database import init_db

BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="CRUD de Produtos",
    description=(
        "Sistema CRUD em Python com FastAPI, MySQL e arquitetura MVC. "
        "Projeto didático para ensino de TI."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.include_router(frontend_router)
app.include_router(product_router)


@app.get("/health", tags=["Saúde"])
def health_check():
    return {
        "status": "online",
        "message": "API CRUD funcionando!",
        "frontend": "/",
        "docs": "/docs",
    }
