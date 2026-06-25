from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Notebook"])
    description: str | None = Field(None, examples=["Notebook 15 polegadas"])
    price: Decimal = Field(..., gt=0, examples=[2999.99])
    quantity: int = Field(..., ge=0, examples=[10])


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    price: Decimal | None = Field(None, gt=0)
    quantity: int | None = Field(None, ge=0)


class ProductResponse(ProductBase):
    """View (V do MVC): formato JSON de resposta da API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
