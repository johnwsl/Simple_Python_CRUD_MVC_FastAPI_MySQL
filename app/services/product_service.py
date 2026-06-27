"""Camada de serviço — regras de negócio e operações CRUD no banco."""

from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    """Executa operações CRUD entre o Controller e o Model.

    Centraliza queries SQLAlchemy e commits no banco de dados.
    """

    @staticmethod
    def get_all(db: Session) -> list[Product]:
        """Retorna todos os produtos ordenados por id."""
        return db.query(Product).order_by(Product.id).all()

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Product | None:
        """Busca um produto pelo id. Retorna None se não existir."""
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def create(db: Session, product_data: ProductCreate) -> Product:
        """Insere um novo produto no MySQL.

        Args:
            db: Sessão SQLAlchemy da requisição.
            product_data: Dados validados pelo Pydantic (ProductCreate).

        Returns:
            Product: Instância criada com id preenchido pelo banco.
        """
        product = Product(**product_data.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)  # Recarrega id, created_at e updated_at do banco
        return product

    @staticmethod
    def update(db: Session, product: Product, product_data: ProductUpdate) -> Product:
        """Atualiza campos do produto existente.

        Args:
            product: Instância ORM já carregada do banco.
            product_data: Campos a alterar (somente os enviados no JSON).
        """
        update_data = product_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete(db: Session, product: Product) -> None:
        """Remove permanentemente um produto do banco."""
        db.delete(product)
        db.commit()
