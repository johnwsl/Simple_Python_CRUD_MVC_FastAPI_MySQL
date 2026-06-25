from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.controllers.product_controller import router as product_router
from app.database import init_db


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

app.include_router(product_router)


@app.get("/", tags=["Saúde"])
def health_check():
    return {
        "status": "online",
        "message": "API CRUD funcionando!",
        "docs": "/docs",
    }
