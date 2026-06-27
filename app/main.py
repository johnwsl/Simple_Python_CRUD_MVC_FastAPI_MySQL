"""Ponto de entrada da aplicação FastAPI.

Configura a instância principal, registra routers, arquivos estáticos
e o endpoint de verificação de saúde da API.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.controllers.frontend_controller import router as frontend_router
from app.controllers.product_controller import router as product_router
from app.database import init_db

# Caminho absoluto da pasta app/ — usado para localizar arquivos estáticos
BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação (startup e shutdown).

    Executa init_db() ao iniciar o servidor (cria tabelas no MySQL).
    O código após yield rodaria ao encerrar o servidor.
    """
    init_db()
    yield


# Instância principal do FastAPI — todos os endpoints são registrados nela
app = FastAPI(
    title="CRUD de Produtos",
    description=(
        "Sistema CRUD em Python com FastAPI, MySQL e arquitetura MVC. "
        "Projeto didático para ensino de TI."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Expõe CSS, JS e imagens em /static/css, /static/js, etc.
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Registra rotas do frontend (HTML) e da API de produtos (JSON)
app.include_router(frontend_router)
app.include_router(product_router)


@app.get("/health", tags=["Saúde"])
def health_check():
    """Verifica se a API está online — usado pelo frontend e monitoramento."""
    return {
        "status": "online",
        "message": "API CRUD funcionando!",
        "frontend": "/",
        "docs": "/docs",
    }
