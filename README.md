# CRUD Python + FastAPI + MySQL + MVC + Docker

Projeto didático de um sistema **CRUD** (Create, Read, Update, Delete) para ensino de TI, com arquitetura **MVC**, banco **MySQL**, containerização com **Docker** e publicação no **Docker Hub**.

## Tecnologias

- Python 3.11
- FastAPI + Uvicorn
- SQLAlchemy + PyMySQL
- MySQL 8.0
- Docker & Docker Compose

## Início rápido

```bash
cp .env.example .env          # Linux/Mac
Copy-Item .env.example .env   # Windows PowerShell

docker compose up -d --build
```

Acesse o frontend: **http://localhost:8000**  
Documentação da API: **http://localhost:8000/docs**

## Estrutura do projeto

```
├── app/
│   ├── main.py                 # Entrada da API
│   ├── config.py               # Configurações
│   ├── database.py             # Conexão MySQL
│   ├── models/                 # Model (MVC)
│   ├── schemas/                # View (MVC)
│   ├── controllers/            # Controller (MVC)
│   ├── services/               # Regras de negócio
│   ├── templates/              # View HTML (frontend)
│   └── static/                 # CSS e JavaScript
├── docs/
│   ├── SISTEMA.md              # Como o sistema funciona
│   ├── DOCKER.md               # Como o Docker funciona
│   └── EXECUTAR_DOCKER.md      # Como executar com Docker
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/products/` | Listar produtos |
| GET | `/products/{id}` | Buscar produto |
| POST | `/products/` | Criar produto |
| PUT | `/products/{id}` | Atualizar produto |
| DELETE | `/products/{id}` | Excluir produto |

## Documentação didática

| Documento | Conteúdo |
|-----------|----------|
| [docs/SISTEMA.md](docs/SISTEMA.md) | Arquitetura MVC, fluxo de requisições, banco de dados |
| [docs/DOCKER.md](docs/DOCKER.md) | Containers, imagens, Docker Hub, Compose |
| [docs/EXECUTAR_DOCKER.md](docs/EXECUTAR_DOCKER.md) | Passo a passo para executar e publicar |

## Docker Hub

```bash
docker login
docker build -t seu-usuario/crud-fastapi-mysql:latest .
docker push seu-usuario/crud-fastapi-mysql:latest
```

## Licença

Projeto educacional — livre para uso em sala de aula.
