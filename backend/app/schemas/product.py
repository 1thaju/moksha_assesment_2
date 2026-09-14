from pydantic import BaseModel


class ProductOut(BaseModel):
    id: str
    name: str
    description: str
    price_cents: int
    currency: str
    image_url: str | None
    stock: int

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price_cents: int
    currency: str = "usd"
    image_url: str | None = None
    stock: int = 0


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price_cents: int | None = None
    currency: str | None = None
    image_url: str | None = None
    stock: int | None = None
