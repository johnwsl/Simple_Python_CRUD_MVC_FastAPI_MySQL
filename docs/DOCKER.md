# Como o Docker Funciona

Material didático sobre containers, imagens e orquestração usados neste projeto.

---

## 1. O Problema que o Docker Resolve

Sem Docker, para rodar este projeto você precisaria:

- Instalar Python na versão correta
- Instalar MySQL e configurá-lo
- Instalar dependências (`pip install`)
- Garantir que tudo funcione igual em Windows, Linux e Mac

Com **Docker**, empacotamos a aplicação e suas dependências em **containers** isolados que rodam de forma previsível em qualquer máquina.

---

## 2. Conceitos Fundamentais

### Container

Um **container** é uma instância em execução de uma imagem. Pense nele como uma “caixa” leve que contém:

- Sistema de arquivos mínimo
- Código da aplicação
- Dependências instaladas
- Processo em execução (ex.: uvicorn ou mysqld)

Cada container é **isolado** dos outros e do sistema host.

### Imagem

Uma **imagem** é o “molde” do container — um pacote imutável com instruções de como construir o ambiente.

Neste projeto temos duas imagens principais:

| Imagem | Origem | Função |
|--------|--------|--------|
| `mysql:8.0` | Docker Hub (oficial) | Banco de dados |
| `seu-usuario/crud-fastapi-mysql:latest` | Construída pelo `Dockerfile` | API FastAPI |

### Dockerfile

Arquivo de receita que diz **como construir** a imagem da API:

```dockerfile
FROM python:3.11-slim      # Imagem base
WORKDIR /app               # Diretório de trabalho
COPY requirements.txt .    # Copia dependências
RUN pip install ...        # Instala pacotes
COPY app ./app             # Copia código
CMD ["uvicorn", ...]       # Comando ao iniciar
```

Comando para construir:

```bash
docker build -t seu-usuario/crud-fastapi-mysql:latest .
```

### Docker Compose

Orquestra **vários containers** com um único arquivo YAML (`docker-compose.yml`):

```yaml
services:
  mysql:    # Container 1 — banco
    image: mysql:8.0
  api:      # Container 2 — API
    build: .
    depends_on:
      mysql:
        condition: service_healthy
```

Comando para subir tudo:

```bash
docker compose up -d
```

### Docker Hub

O **Docker Hub** (https://hub.docker.com) é um registro público de imagens — como um “GitHub para containers”.

Fluxo típico:

1. **Build** local da imagem
2. **Tag** com seu usuário: `seu-usuario/crud-fastapi-mysql:latest`
3. **Push** para o Hub: `docker push seu-usuario/crud-fastapi-mysql:latest`
4. Outra pessoa faz **pull** e executa sem precisar do código-fonte

---

## 3. Arquitetura deste Projeto no Docker

```
┌─────────────────────────────────────────────────────────┐
│                    Máquina Host (seu PC)                 │
│                                                          │
│  ┌──────────────────── docker-compose ─────────────────┐ │
│  │                                                      │ │
│  │  ┌──────────────┐         ┌──────────────────────┐  │ │
│  │  │  crud_mysql  │         │      crud_api        │  │ │
│  │  │  (MySQL 8)   │◄───────►│  (FastAPI/Uvicorn)   │  │ │
│  │  │  porta 3306  │  rede   │  porta 8000          │  │ │
│  │  └──────┬───────┘ interna └──────────┬───────────┘  │ │
│  │         │                            │              │ │
│  └─────────┼────────────────────────────┼──────────────┘ │
│            │                            │                │
│     localhost:3306              localhost:8000           │
└────────────┼────────────────────────────┼────────────────┘
             │                            │
        Cliente MySQL              Navegador / Postman
```

### Rede interna

Os containers `mysql` e `api` se comunicam pelo **nome do serviço** (`mysql`), não por `localhost`. Por isso em `.env` usamos `MYSQL_HOST=mysql`.

### Volumes

```yaml
volumes:
  mysql_data:/var/lib/mysql
```

Dados do MySQL persistem mesmo se o container for removido. Sem volume, os dados seriam perdidos ao parar o container.

### Healthcheck

O MySQL só é considerado “pronto” quando responde ao `mysqladmin ping`. A API só inicia **depois** disso (`depends_on: condition: service_healthy`), evitando erro de conexão na subida.

---

## 4. Comandos Docker Essenciais

| Comando | O que faz |
|---------|-----------|
| `docker build -t nome:tag .` | Constrói imagem a partir do Dockerfile |
| `docker images` | Lista imagens locais |
| `docker ps` | Lista containers em execução |
| `docker ps -a` | Lista todos os containers |
| `docker logs crud_api` | Exibe logs do container |
| `docker stop crud_api` | Para um container |
| `docker rm crud_api` | Remove container |
| `docker rmi nome:tag` | Remove imagem |
| `docker compose up -d` | Sobe todos os serviços em background |
| `docker compose down` | Para e remove containers da stack |
| `docker compose down -v` | Para e **apaga volumes** (dados do MySQL) |

---

## 5. Fluxo Build → Push → Pull (Docker Hub)

```mermaid
flowchart LR
    A[Código fonte] --> B[docker build]
    B --> C[Imagem local]
    C --> D[docker push]
    D --> E[Docker Hub]
    E --> F[docker pull]
    F --> G[docker run / compose up]
```

Passos detalhados:

```bash
# 1. Login no Docker Hub
docker login

# 2. Build com tag do seu usuário
docker build -t seu-usuario/crud-fastapi-mysql:latest .

# 3. Enviar para o Hub
docker push seu-usuario/crud-fastapi-mysql:latest

# 4. Em outra máquina — baixar e usar
docker pull seu-usuario/crud-fastapi-mysql:latest
```

No `docker-compose.yml`, a linha `image: seu-usuario/crud-fastapi-mysql:latest` permite publicar e reutilizar a mesma imagem.

---

## 6. Camadas e Cache (conceito avançado)

Cada instrução no Dockerfile cria uma **camada**. Se `requirements.txt` não mudou, o Docker reutiliza o cache da camada `pip install`, acelerando builds subsequentes.

Por isso copiamos `requirements.txt` **antes** do código da aplicação.

---

## 7. .dockerignore

Semelhante ao `.gitignore`, evita copiar arquivos desnecessários para a imagem (`.venv`, `.git`, etc.), deixando-a menor e mais rápida de construir.

---

## 8. Resumo para o Aluno

| Termo | Analogia simples |
|-------|------------------|
| **Imagem** | Receita de bolo |
| **Container** | Bolo assado (instância da receita) |
| **Dockerfile** | Lista de ingredientes e passos |
| **Docker Compose** | Cardápio com vários pratos servidos juntos |
| **Docker Hub** | Livro de receitas na nuvem |
| **Volume** | Geladeira — dados guardados fora do prato descartável |

Próximo passo: [EXECUTAR_DOCKER.md](EXECUTAR_DOCKER.md) — guia prático de execução.
