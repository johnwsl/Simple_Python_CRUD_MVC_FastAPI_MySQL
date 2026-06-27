"""Controller de produtos (camada C do MVC) — endpoints REST /products/."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

# Router agrupa todas as rotas de produtos sob o prefixo /products
router = APIRouter(prefix="/products", tags=["Produtos"])


@router.get("/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    """GET /products/ — lista todos os produtos (Read)."""
    return ProductService.get_all(db)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """GET /products/{id} — busca um produto pelo id (Read).

    Args:
        product_id: Id numérico do produto na URL.
    """
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com id {product_id} não encontrado.",
        )
    return product


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    """POST /products/ — cria um novo produto (Create).

    Args:
        product_data: Corpo JSON validado pelo schema ProductCreate.
    """
    return ProductService.create(db, product_data)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db)
):
    """PUT /products/{id} — atualiza um produto (Update).

    Envia no JSON apenas os campos que deseja alterar.
    """
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com id {product_id} não encontrado.",
        )
    return ProductService.update(db, product, product_data)


@router.patch("/{product_id}", response_model=ProductResponse)
def patch_product(
    product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db)
):
    """PATCH /products/{id} — atualização parcial (Update).

    Diferente do PUT, exige ao menos um campo no corpo da requisição.
    """
    if not product_data.model_dump(exclude_unset=True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe ao menos um campo para atualizar.",
        )
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com id {product_id} não encontrado.",
        )
    return ProductService.update(db, product, product_data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """DELETE /products/{id} — exclui um produto (Delete).

    Retorna 204 sem corpo JSON em caso de sucesso.
    """
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com id {product_id} não encontrado.",
        )
    ProductService.delete(db, product)
