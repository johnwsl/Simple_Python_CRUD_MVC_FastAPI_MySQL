import time

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Fornece uma sessão de banco de dados para cada requisição."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(max_retries: int = 30, retry_delay: int = 2) -> None:
    """Cria as tabelas aguardando o MySQL ficar disponível (útil no Docker)."""
    from app.models import product  # noqa: F401

    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except Exception:
            if attempt == max_retries:
                raise
            time.sleep(retry_delay)
