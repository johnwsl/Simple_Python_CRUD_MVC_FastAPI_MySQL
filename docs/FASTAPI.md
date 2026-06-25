# Como o FastAPI Funciona e Como Implementar com Python

Material didático sobre o framework **FastAPI**: conceitos, funcionamento interno e implementação prática, com exemplos do projeto CRUD de Produtos.

---

## 1. O que é FastAPI?

**FastAPI** é um framework web moderno para construir **APIs REST** com Python. Foi criado por Sebastián Ramírez e lançado em 2018.

Características principais:

| Característica | Descrição |
|----------------|-----------|
| **Rápido** | Desempenho comparável a Node.js e Go (via ASGI) |
| **Tipagem** | Usa type hints do Python para validação automática |
| **Documentação automática** | Gera Swagger UI (`/docs`) e ReDoc (`/redoc`) |
| **Pydantic** | Valida e serializa JSON de entrada e saída |
| **Async** | Suporta funções síncronas e assíncronas (`async def`) |

No nosso projeto, o FastAPI expõe a API de produtos em `/products/` e serve o frontend em `/`.

---

## 2. Stack por trás do FastAPI

FastAPI não reinventa tudo — ele combina bibliotecas especializadas:

```
┌─────────────────────────────────────────────┐
│                  FastAPI                     │
│  (rotas, validação, docs, DI, middleware)  │
├─────────────────────────────────────────────┤
│              Starlette                       │
│  (servidor ASGI, Request/Response, routing)  │
├─────────────────────────────────────────────┤
│              Pydantic                        │
│  (validação de dados, schemas JSON)          │
├─────────────────────────────────────────────┤
│              Uvicorn                         │
│  (servidor ASGI que executa a aplicação)     │
└─────────────────────────────────────────────┘
```

### ASGI vs WSGI

- **WSGI** (Flask, Django clássico): padrão síncrono, uma requisição por vez por worker.
- **ASGI** (FastAPI, Starlette): suporta **assíncrono** e WebSockets; melhor concorrência.

Comando que inicia o servidor neste projeto:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

| Parte | Significado |
|-------|-------------|
| `app.main` | Módulo Python `app/main.py` |
| `:app` | Variável `app` dentro desse módulo |
| `--reload` | (opcional) Reinicia ao salvar arquivos — útil em desenvolvimento |

---

## 3. Instalação e "Hello World"

### Instalar dependências

```bash
pip install fastapi uvicorn[standard]
```

No projeto, todas as dependências estão em `requirements.txt`:

```bash
pip install -r requirements.txt
```

### Aplicação mínima

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def raiz():
    return {"mensagem": "Olá, FastAPI!"}
```

Execute:

```bash
uvicorn main:app --reload
```

Acesse http://127.0.0.1:8000 — verá o JSON.  
Acesse http://127.0.0.1:8000/docs — verá a documentação interativa.

---

## 4. Criando a aplicação (`FastAPI()`)

No nosso projeto, a instância principal está em `app/main.py`:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()   # roda ao iniciar o servidor
    yield       # servidor fica ativo
                # código após yield roda ao encerrar

app = FastAPI(
    title="CRUD de Produtos",
    description="Sistema CRUD didático...",
    version="1.0.0",
    lifespan=lifespan,
)
```

### Lifespan (ciclo de vida)

O **lifespan** define o que acontece quando o servidor **inicia** e **para**:

- **Antes do `yield`**: conectar banco, criar tabelas, carregar cache.
- **Depois do `yield`**: fechar conexões, liberar recursos.

No projeto, `init_db()` cria as tabelas no MySQL ao subir a API.

---

## 5. Rotas e métodos HTTP

Uma **rota** associa uma URL + método HTTP a uma função Python ( chamada de **endpoint** ou **path operation** ).

```python
@app.get("/health")
def health_check():
    return {"status": "online"}
```

| Decorador | Método HTTP | Uso típico |
|-----------|-------------|------------|
| `@app.get()` | GET | Buscar / listar |
| `@app.post()` | POST | Criar |
| `@app.put()` | PUT | Atualizar (completo) |
| `@app.patch()` | PATCH | Atualizar (parcial) |
| `@app.delete()` | DELETE | Excluir |

### Parâmetros de path (URL)

```python
@app.get("/products/{product_id}")
def get_product(product_id: int):
    ...
```

FastAPI converte `product_id` para `int` automaticamente. Se enviar texto, retorna erro **422 Unprocessable Entity**.

### Parâmetros de query (filtros)

```python
@app.get("/products/")
def list_products(skip: int = 0, limit: int = 10):
    ...
```

URL: `/products/?skip=0&limit=20`

---

## 6. Pydantic — validação de dados

FastAPI usa **Pydantic** para validar o corpo JSON das requisições e formatar respostas.

### Schema de entrada (Create)

```python
# app/schemas/product.py
from pydantic import BaseModel, Field
from decimal import Decimal

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    price: Decimal = Field(..., gt=0)
    quantity: int = Field(..., ge=0)
```

### Schema de saída (Response)

```python
class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
```

| Conceito | Explicação |
|----------|------------|
| `BaseModel` | Classe base do Pydantic — define campos e tipos |
| `Field(...)` | Campo obrigatório com regras (`gt=0`, `min_length=1`) |
| `from_attributes=True` | Permite converter objetos SQLAlchemy em JSON |
| `str \| None` | Campo opcional (Python 3.10+) |

### O que acontece na prática

1. Cliente envia JSON no `POST /products/`.
2. FastAPI converte JSON → objeto `ProductCreate`.
3. Pydantic valida tipos e regras.
4. Se inválido → resposta **422** com detalhes do erro.
5. Se válido → função do controller é executada.

Exemplo de JSON válido:

```json
{
  "name": "Teclado",
  "description": "Mecânico RGB",
  "price": 299.90,
  "quantity": 15
}
```

---

## 7. Request Body e Response Model

```python
@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    return ProductService.create(db, product_data)
```

| Parâmetro | Função |
|-----------|--------|
| `product_data: ProductCreate` | Corpo JSON validado pelo Pydantic |
| `response_model=ProductResponse` | Formato do JSON de resposta |
| `status_code=201` | HTTP 201 Created (padrão do POST seria 200) |

FastAPI **não inclui** na resposta campos que não estão no `response_model` — isso protege dados sensíveis.

---

## 8. Injeção de Dependências (`Depends`)

**Dependency Injection (DI)** é um padrão em que o FastAPI **fornece automaticamente** objetos que a rota precisa.

```python
# app/database.py
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# app/controllers/product_controller.py
def list_products(db: Session = Depends(get_db)):
    return ProductService.get_all(db)
```

Fluxo:

1. Requisição chega em `GET /products/`.
2. FastAPI chama `get_db()` e obtém uma sessão SQLAlchemy.
3. Passa `db` para `list_products`.
4. Após a resposta, executa `finally` e fecha a sessão.

Vantagens:

- Código reutilizável (mesma sessão em todas as rotas).
- Fácil de testar (substituir `get_db` por mock).
- Separação clara de responsabilidades.

Outros usos comuns de `Depends`:

- Autenticação (verificar token JWT).
- Paginação.
- Permissões de usuário.

---

## 9. Tratamento de erros (`HTTPException`)

```python
from fastapi import HTTPException, status

if not product:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Produto com id {product_id} não encontrado.",
    )
```

FastAPI converte isso em JSON:

```json
{
  "detail": "Produto com id 99 não encontrado."
}
```

Códigos HTTP mais usados no CRUD:

| Código | Significado | Quando usar |
|--------|-------------|-------------|
| 200 | OK | GET, PUT bem-sucedidos |
| 201 | Created | POST bem-sucedido |
| 204 | No Content | DELETE bem-sucedido |
| 404 | Not Found | Recurso não existe |
| 422 | Unprocessable Entity | JSON inválido (Pydantic) |
| 500 | Internal Server Error | Erro inesperado no servidor |

---

## 10. APIRouter — organizando rotas

Em projetos reais, não colocamos tudo em `main.py`. Usamos **`APIRouter`** para agrupar rotas por módulo:

```python
# app/controllers/product_controller.py
router = APIRouter(prefix="/products", tags=["Produtos"])

@router.get("/")
def list_products(...):
    ...
```

```python
# app/main.py
from app.controllers.product_controller import router as product_router

app.include_router(product_router)
```

| Parâmetro | Função |
|-----------|--------|
| `prefix="/products"` | Todas as rotas começam com `/products` |
| `tags=["Produtos"]` | Agrupa endpoints na documentação Swagger |

No projeto temos dois routers:

| Router | Arquivo | Rotas |
|--------|---------|-------|
| Frontend | `frontend_controller.py` | `/` (HTML) |
| Produtos | `product_controller.py` | `/products/...` (JSON) |

---

## 11. Arquivos estáticos e templates HTML

### Arquivos estáticos (CSS, JS, imagens)

```python
from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="app/static"), name="static")
```

Arquivos em `app/static/css/style.css` ficam acessíveis em `/static/css/style.css`.

### Templates Jinja2

```python
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="app/templates")

@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(request, "index.html")
```

O frontend usa HTML + JavaScript que consome a API JSON — padrão comum em aplicações web.

---

## 12. Documentação automática

FastAPI gera documentação **sem configuração extra**:

| URL | Formato |
|-----|---------|
| `/docs` | Swagger UI — testar endpoints no navegador |
| `/redoc` | ReDoc — documentação em formato leitura |
| `/openapi.json` | Esquema OpenAPI em JSON |

A documentação é gerada a partir de:

- Type hints das funções.
- Models Pydantic (`ProductCreate`, `ProductResponse`).
- Docstrings das funções.
- Tags e metadados do `FastAPI()`.

---

## 13. Fluxo completo de uma requisição

Exemplo: `POST /products/` — criar produto.

```mermaid
sequenceDiagram
    participant C as Cliente
    participant U as Uvicorn
    participant F as FastAPI
    participant P as Pydantic
    participant Ctrl as Controller
    participant Svc as Service
    participant DB as MySQL

    C->>U: POST /products/ + JSON
    U->>F: repassa requisição ASGI
    F->>P: valida JSON → ProductCreate
    alt JSON inválido
        P-->>C: 422 + detalhes
    end
    F->>F: Depends(get_db) → sessão
    F->>Ctrl: create_product(data, db)
    Ctrl->>Svc: ProductService.create()
    Svc->>DB: INSERT
    DB-->>Svc: produto salvo
    Svc-->>Ctrl: Product (ORM)
    F->>P: serializa → ProductResponse
    Ctrl-->>C: 201 + JSON
```

---

## 14. Como implementar um CRUD passo a passo

Guia genérico — é exatamente o que este projeto faz.

### Passo 1 — Instalar e criar estrutura

```
app/
├── main.py
├── database.py
├── models/
├── schemas/
├── controllers/
└── services/
```

### Passo 2 — Configurar banco (`database.py`)

```python
engine = create_engine("mysql+pymysql://user:pass@host/db")
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Passo 3 — Criar Model SQLAlchemy (`models/`)

```python
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    ...
```

### Passo 4 — Criar Schemas Pydantic (`schemas/`)

- `ProductCreate` — dados para criar.
- `ProductUpdate` — campos opcionais para editar.
- `ProductResponse` — JSON de resposta.

### Passo 5 — Criar Service (`services/`)

```python
class ProductService:
    @staticmethod
    def get_all(db: Session) -> list[Product]:
        return db.query(Product).all()

    @staticmethod
    def create(db: Session, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
```

### Passo 6 — Criar Controller com rotas (`controllers/`)

```python
router = APIRouter(prefix="/products")

@router.get("/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return ProductService.get_all(db)

@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    return ProductService.create(db, data)
```

### Passo 7 — Registrar no `main.py`

```python
app = FastAPI(lifespan=lifespan)
app.include_router(product_router)
```

### Passo 8 — Executar e testar

```bash
uvicorn app.main:app --reload
```

Teste em http://localhost:8000/docs.

---

## 15. Funções síncronas vs assíncronas

FastAPI aceita ambas:

```python
# Síncrona — bloqueia a thread durante I/O (OK para SQLAlchemy sync)
def list_products(db: Session = Depends(get_db)):
    return ProductService.get_all(db)

# Assíncrona — libera a thread durante await (ideal para I/O async)
async def get_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.exemplo.com")
    return response.json()
```

Neste projeto usamos funções **síncronas** porque SQLAlchemy está no modo sync. Para async completo, usaria `asyncpg`/`aiomysql` com SQLAlchemy 2.0 async.

---

## 16. Boas práticas (resumo)

| Prática | Por quê |
|---------|---------|
| Separar rotas em `APIRouter` | Código organizado e escalável |
| Usar Pydantic para entrada/saída | Validação automática + docs |
| Usar `Depends` para banco e auth | Reutilização e testabilidade |
| Não colocar SQL nas rotas | Lógica fica no Service |
| Usar `response_model` | Controla o JSON exposto |
| Usar `HTTPException` | Erros padronizados REST |
| Variáveis de ambiente para config | Segurança (senhas fora do código) |

---

## 17. Mapa do FastAPI neste projeto

| Arquivo | Papel no FastAPI |
|---------|------------------|
| `app/main.py` | Instância `app`, lifespan, routers, static |
| `app/controllers/product_controller.py` | Endpoints REST `/products/` |
| `app/controllers/frontend_controller.py` | Página HTML `/` |
| `app/schemas/product.py` | Validação Pydantic |
| `app/database.py` | `Depends(get_db)` |
| `app/config.py` | Settings via variáveis de ambiente |
| `requirements.txt` | `fastapi`, `uvicorn`, `pydantic-settings` |

---

## 18. Exercícios sugeridos para o aluno

1. Adicionar endpoint `GET /products/?min_price=100` com query parameter.
2. Criar schema de resposta resumida (`ProductListItem`) sem `description`.
3. Adicionar tag e endpoint `GET /health/detailed` com versão e uptime.
4. Implementar validação: não permitir `quantity` negativo (já feito via Pydantic).
5. Testar todos os endpoints pelo Swagger em `/docs`.

---

## 19. Referências

- Documentação oficial: https://fastapi.tiangolo.com/pt/
- Pydantic: https://docs.pydantic.dev/
- Uvicorn: https://www.uvicorn.org/
- Projeto relacionado: [SISTEMA.md](SISTEMA.md) — arquitetura MVC completa

---

## 20. Glossário

| Termo | Definição |
|-------|-----------|
| **API REST** | Interface HTTP para manipular recursos (produtos, usuários...) |
| **Endpoint** | URL + método HTTP (ex.: `GET /products/`) |
| **Schema** | Modelo Pydantic que define formato dos dados |
| **ORM** | Mapeia classes Python para tabelas SQL |
| **DI** | Injeção de Dependências — FastAPI fornece objetos automaticamente |
| **ASGI** | Protocolo assíncrono entre servidor e framework |
| **Router** | Agrupador de rotas relacionadas |
