"""Model ORM da entidade Produto (camada Model do MVC)."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    """Representa a tabela 'products' no MySQL.

    Cada instância corresponde a uma linha (um produto) no banco.
    O SQLAlchemy traduz atributos Python em colunas SQL.
    """

    __tablename__ = "products"

    # Chave primária — identificador único, gerado automaticamente pelo MySQL
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Nome do produto — obrigatório, máximo 100 caracteres
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Descrição opcional — campo de texto longo
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Preço com 2 casas decimais (ex.: 2999.99)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    # Quantidade em estoque — padrão 0 se não informado
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Data/hora de criação — preenchida automaticamente pelo MySQL
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Data/hora da última alteração — atualizada a cada UPDATE
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
