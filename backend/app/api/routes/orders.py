from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import CreateOrderRequest, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/me", response_model=list[OrderOut])
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Customers can only ever see their OWN orders — the query is filtered by
    user.id server-side, there's no way to pass a different user_id and see
    someone else's orders through this endpoint.
    """
    result = await db.execute(
        select(Order).where(Order.user_id == user.id).options(selectinload(Order.items))
    )
    return result.scalars().all()


@router.get("", response_model=list[OrderOut])
async def list_all_orders(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only — full order list across all customers."""
    result = await db.execute(select(Order).options(selectinload(Order.items)))
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.user_id != user.id and user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")

    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Creates a PENDING order from the cart. Stock is validated and decremented
    here (not trusted from the frontend), and line-item prices are snapshotted
    from the current product price at order-creation time so later price
    changes don't retroactively alter historical orders.

    The order stays 'pending' until Stripe's webhook confirms payment — see
    payments.py for that transition.
    """
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    order_items: list[OrderItem] = []
    total_cents = 0

    for line in payload.items:
        product = await db.get(Product, line.product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {line.product_id} not found"
            )
        if line.quantity < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be at least 1")
        if product.stock < line.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Insufficient stock for {product.name} (have {product.stock}, wanted {line.quantity})",
            )

        product.stock -= line.quantity  # reserve stock at order-creation time
        line_total = product.price_cents * line.quantity
        total_cents += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price_cents=product.price_cents,
                quantity=line.quantity,
            )
        )

    order = Order(user_id=user.id, total_cents=total_cents, items=order_items)
    db.add(order)
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return order
