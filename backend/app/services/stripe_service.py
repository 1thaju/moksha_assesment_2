import stripe

from app.core.config import get_settings

settings = get_settings()
stripe.api_key = settings.stripe_secret_key


def build_local_checkout_url(order_id: str) -> str:
    return f"{settings.stripe_success_url}?order_id={order_id}"


def create_checkout_session(order_id: str, currency: str, line_items: list[dict], customer_email: str) -> stripe.checkout.Session:
    """
    line_items: list of {"name": str, "unit_amount": int (cents), "quantity": int}

    order_id is stashed in metadata so the webhook handler can map the Stripe
    event back to our own Order row without guessing/parsing.
    """
    return stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        customer_email=customer_email,
        line_items=[
            {
                "price_data": {
                    "currency": currency,
                    "product_data": {"name": item["name"]},
                    "unit_amount": item["unit_amount"],
                },
                "quantity": item["quantity"],
            }
            for item in line_items
        ],
        metadata={"order_id": order_id},
        success_url=f"{settings.stripe_success_url}?order_id={order_id}",
        cancel_url=f"{settings.stripe_cancel_url}?order_id={order_id}",
    )


def create_checkout_session_or_fallback(order_id: str, currency: str, line_items: list[dict], customer_email: str) -> stripe.checkout.Session | None:
    try:
        return create_checkout_session(order_id, currency, line_items, customer_email)
    except stripe.error.StripeError:
        return None


def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    """
    Verifies the webhook's Stripe-Signature header against our webhook secret.
    This is what stops anyone from POSTing a fake 'payment succeeded' event
    directly to our webhook endpoint to mark orders as paid for free —
    raises stripe.error.SignatureVerificationError on a bad/missing signature.
    """
    return stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
