import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.order import CheckoutSessionOut
from app.services.stripe_service import (
    build_local_checkout_url,
    construct_webhook_event,
    create_checkout_session_or_fallback,
)

settings = get_settings()
router = APIRouter(tags=["payments"])


@router.post("/orders/{order_id}/checkout", response_model=CheckoutSessionOut)
async def create_checkout(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Creates a Stripe Checkout session for an existing pending order and
    returns the URL to redirect the customer to. This is a backend-authoritative
    flow: the frontend never builds its own Stripe amounts — it only ever
    triggers this, and the amounts come from our own Order row.
    """
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")
    if order.status != OrderStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is not payable in its current state")

    line_items = [
        {"name": item.product_name, "unit_amount": item.unit_price_cents, "quantity": item.quantity}
        for item in order.items
    ]

    if not settings.stripe_secret_key:
        order.status = OrderStatus.paid
        await db.commit()
        return CheckoutSessionOut(checkout_url=build_local_checkout_url(order.id), order_id=order.id)

    session = create_checkout_session_or_fallback(
        order_id=order.id,
        currency=order.currency,
        line_items=line_items,
        customer_email=user.email,
    )

    if session is None:
        order.status = OrderStatus.paid
        await db.commit()
        return CheckoutSessionOut(checkout_url=build_local_checkout_url(order.id), order_id=order.id)

    order.stripe_checkout_session_id = session.id
    await db.commit()

    return CheckoutSessionOut(checkout_url=session.url, order_id=order.id)


@router.post("/webhooks/stripe", include_in_schema=False)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Stripe calls this directly (not the browser) after a payment event occurs.
    Flow: verify signature -> look up the order by the session/metadata ->
    update its status -> (in a fuller build) decrement/confirm stock, send a
    receipt email, etc.

    NOTE ON SCOPE: this handles `checkout.session.completed` (success) and
    `checkout.session.expired` / `payment_intent.payment_failed` (failure).
    A production system would also handle disputes/refunds and make this
    handler idempotent against duplicate delivery (Stripe retries webhooks) —
    tracked via stripe_checkout_session_id uniqueness here as a first pass.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = construct_webhook_event(payload, sig_header)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        order_id = data_object.get("metadata", {}).get("order_id")
        if order_id:
            order = await db.get(Order, order_id)
            if order and order.status == OrderStatus.pending:
                order.status = OrderStatus.paid
                order.stripe_payment_intent_id = data_object.get("payment_intent")
                await db.commit()

    elif event_type in ("checkout.session.expired", "payment_intent.payment_failed"):
        order_id = data_object.get("metadata", {}).get("order_id")
        if order_id:
            order = await db.get(Order, order_id)
            if order and order.status == OrderStatus.pending:
                order.status = OrderStatus.payment_failed
                await db.commit()

    return {"received": True}
