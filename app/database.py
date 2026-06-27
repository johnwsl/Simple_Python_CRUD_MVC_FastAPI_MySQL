"""Conexão com o banco MySQL via SQLAlchemy.

Define engine, sessões, base dos models e funções de inicialização.
"""

import time

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# Motor de conexão com o MySQL; pool_pre_ping testa conexões antes de usar
engine = create_engine(settings.database_url, pool_pre_ping=True)

# Fábrica de sessões — cada requisição HTTP recebe uma sessão própria
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Classe base para todos os models ORM (SQLAlchemy).

    Os models (ex.: Product) herdam dela para mapear tabelas MySQL.
    """


def get_db():
    """Dependência FastAPI: fornece sessão de banco por requisição.

    Yields:
        Session: Sessão SQLAlchemy aberta.

    Garante que a sessão seja fechada após a resposta (bloco finally).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(max_retries: int = 30, retry_delay: int = 2) -> None:
    """Cria as tabelas no MySQL se ainda não existirem.

    Tenta várias vezes (útil no Docker, enquanto o MySQL inicializa).

    Args:
        max_retries: Número máximo de tentativas de conexão.
        retry_delay: Segundos de espera entre tentativas.
    """
    from app.models import product  # noqa: F401 — import registra o model Product

    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except Exception:
            if attempt == max_retries:
                raise
            time.sleep(retry_delay)
