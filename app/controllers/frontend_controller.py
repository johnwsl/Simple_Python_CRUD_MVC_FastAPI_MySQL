"""Controller do frontend — serve a página HTML principal."""

from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

# Router sem prefixo — a rota / fica na raiz do site
router = APIRouter(tags=["Frontend"])

# Configura o motor de templates Jinja2 apontando para app/templates/
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent.parent / "templates"))


@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    """GET / — retorna a página HTML do CRUD (index.html).

    Args:
        request: Objeto Request do Starlette (necessário para TemplateResponse).
    """
    return templates.TemplateResponse(request, "index.html")
