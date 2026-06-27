"""Schemas Pydantic para validação de JSON (camada View do MVC).

Define o formato dos dados de entrada e saída da API REST.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    """Campos comuns compartilhados entre criação e resposta."""

    name: str = Field(..., min_length=1, max_length=100, examples=["Notebook"])
    description: str | None = Field(None, examples=["Notebook 15 polegadas"])
    price: Decimal = Field(..., gt=0, examples=[2999.99])  # gt=0: preço deve ser positivo
    quantity: int = Field(..., ge=0, examples=[10])  # ge=0: quantidade >= 0


class ProductCreate(ProductBase):
    """Schema de entrada para POST /products/ — dados para criar um produto."""


class ProductUpdate(BaseModel):
    """Schema de entrada para PUT/PATCH — todos os campos são opcionais.

    Apenas os campos enviados no JSON serão atualizados (exclude_unset=True).
    """

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    price: Decimal | None = Field(None, gt=0)
    quantity: int | None = Field(None, ge=0)


class ProductResponse(ProductBase):
    """Schema de saída — JSON retornado pela API ao listar/criar/editar produtos.

    Inclui campos gerados pelo banco (id, datas).
    """

    # Permite converter objetos SQLAlchemy (Product) em JSON automaticamente
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
