# Como Executar o Docker

Guia passo a passo para rodar o sistema CRUD com Docker e Docker Compose.

---

## Pré-requisitos

1. **Docker Desktop** instalado:
   - Windows/Mac: https://docs.docker.com/desktop/
   - Linux: https://docs.docker.com/engine/install/

2. Verifique a instalação:

```bash
docker --version
docker compose version
```

Ambos devem retornar a versão instalada.

---

## Passo 1 — Clonar o repositório

```bash
git clone https://github.com/SEU-USUARIO/Simple_Python_CRUD_MVC_FastAPI_MySQL.git
cd Simple_Python_CRUD_MVC_FastAPI_MySQL
```

---

## Passo 2 — Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
# Linux / Mac
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Edite `.env` se quiser alterar senhas ou o usuário do Docker Hub:

```env
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=crud_db
MYSQL_USER=crud_user
MYSQL_PASSWORD=crud_password
DOCKERHUB_USERNAME=seu-usuario
```

> **Nota:** O arquivo `.env` não deve ser commitado (contém senhas).

---

## Passo 3 — Subir os containers

Na raiz do projeto:

```bash
docker compose up -d --build
```

O que acontece:

1. Baixa a imagem `mysql:8.0` (se não existir localmente)
2. Constrói a imagem da API a partir do `Dockerfile`
3. Cria a rede interna entre os containers
4. Inicia o MySQL e aguarda o healthcheck
5. Inicia a API FastAPI na porta 8000

Acompanhe os logs:

```bash
docker compose logs -f
```

Para ver apenas a API:

```bash
docker compose logs -f api
```

---

## Passo 4 — Testar a API

### No navegador

- Saúde da API: http://localhost:8000/
- Documentação Swagger: http://localhost:8000/docs
- Documentação ReDoc: http://localhost:8000/redoc

### Com curl (Linux/Mac/Git Bash)

**Criar produto (Create):**

```bash
curl -X POST "http://localhost:8000/products/" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Teclado\", \"description\": \"Teclado mecânico\", \"price\": 299.90, \"quantity\": 15}"
```

**Listar produtos (Read):**

```bash
curl http://localhost:8000/products/
```

**Buscar por ID:**

```bash
curl http://localhost:8000/products/1
```

**Atualizar (Update):**

```bash
curl -X PUT "http://localhost:8000/products/1" \
  -H "Content-Type: application/json" \
  -d "{\"price\": 279.90, \"quantity\": 20}"
```

**Excluir (Delete):**

```bash
curl -X DELETE http://localhost:8000/products/1
```

### Com PowerShell (Windows)

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/products/" -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Teclado","description":"Teclado mecânico","price":299.90,"quantity":15}'
```

---

## Passo 5 — Publicar no Docker Hub

### 5.1 Criar conta

Registre-se em https://hub.docker.com (gratuito).

### 5.2 Login

```bash
docker login
```

Informe usuário e senha (ou token de acesso).

### 5.3 Build e tag

Substitua `seu-usuario` pelo seu login do Docker Hub:

```bash
docker build -t seu-usuario/crud-fastapi-mysql:latest .
```

### 5.4 Push

```bash
docker push seu-usuario/crud-fastapi-mysql:latest
```

### 5.5 Usar imagem do Hub (sem build local)

Atualize `DOCKERHUB_USERNAME` no `.env` e, no `docker-compose.yml`, comente a linha `build: .` se quiser usar só a imagem remota:

```yaml
api:
  # build: .
  image: seu-usuario/crud-fastapi-mysql:latest
```

Depois:

```bash
docker compose pull
docker compose up -d
```

---

## Comandos úteis do dia a dia

| Ação | Comando |
|------|---------|
| Parar containers | `docker compose stop` |
| Parar e remover containers | `docker compose down` |
| Parar e apagar dados do MySQL | `docker compose down -v` |
| Reconstruir após mudanças no código | `docker compose up -d --build` |
| Ver containers rodando | `docker compose ps` |
| Entrar no container MySQL | `docker exec -it crud_mysql mysql -u crud_user -p` |
| Entrar no shell da API | `docker exec -it crud_api bash` |

---

## Solução de problemas

### Porta 8000 ou 3306 já em uso

Altere no `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"   # API acessível em localhost:8001
```

### API não conecta ao MySQL

1. Verifique se o MySQL está saudável:
   ```bash
   docker compose ps
   ```
   A coluna `STATUS` do `mysql` deve mostrar `healthy`.

2. Veja os logs:
   ```bash
   docker compose logs mysql
   docker compose logs api
   ```

3. Aguarde ~30 segundos na primeira execução (MySQL demora a inicializar).

### Erro de permissão no Docker (Linux)

Adicione seu usuário ao grupo docker:

```bash
sudo usermod -aG docker $USER
```

Faça logout e login novamente.

### Limpar tudo e recomeçar

```bash
docker compose down -v
docker compose up -d --build
```

---

## Executar sem Docker (desenvolvimento local)

Se preferir rodar só a API localmente (com MySQL já instalado ou via Docker só do banco):

```bash
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

pip install -r requirements.txt
```

Configure `.env` com `MYSQL_HOST=localhost` e execute:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Checklist do aluno

- [ ] Docker instalado e funcionando
- [ ] Arquivo `.env` criado
- [ ] `docker compose up -d --build` executado com sucesso
- [ ] http://localhost:8000/docs abre no navegador
- [ ] CRUD testado (criar, listar, editar, excluir)
- [ ] Imagem publicada no Docker Hub (opcional)

Para entender a arquitetura do código, leia [SISTEMA.md](SISTEMA.md).  
Para conceitos de containers, leia [DOCKER.md](DOCKER.md).
