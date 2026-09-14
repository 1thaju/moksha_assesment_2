from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int


class CreateOrderRequest(BaseModel):
    items: list[OrderItemIn]


class OrderItemOut(BaseModel):
    product_id: str
    product_name: str
    unit_price_cents: int
    quantity: int

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: str
    status: OrderStatus
    total_cents: int
    currency: str
    items: list[OrderItemOut]

    class Config:
        from_attributes = True


class CheckoutSessionOut(BaseModel):
    checkout_url: str
    order_id: str
