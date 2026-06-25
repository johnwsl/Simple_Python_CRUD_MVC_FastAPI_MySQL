from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    """Camada de serviço: regras de negócio e acesso ao banco entre Controller e Model."""

    @staticmethod
    def get_all(db: Session) -> list[Product]:
        return db.query(Product).order_by(Product.id).all()

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Product | None:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def create(db: Session, product_data: ProductCreate) -> Product:
        product = Product(**product_data.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update(db: Session, product: Product, product_data: ProductUpdate) -> Product:
        update_data = product_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete(db: Session, product: Product) -> None:
        db.delete(product)
        db.commit()
