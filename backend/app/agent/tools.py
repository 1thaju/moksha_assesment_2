"""
Tools the AI support agent can call. Each tool queries our OWN database
directly — the agent never answers from general LLM knowledge about prices,
stock, or order status. This is what the assignment asks for explicitly:
"retrieve actual product and order information through backend APIs/tools
rather than relying only on general LLM knowledge."
"""

from langchain.tools import tool
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.order import Order
from app.models.product import Product


@tool
async def list_products_tool() -> str:
    """Use this to answer 'what products are available' or to list the catalog."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Product))
        products = result.scalars().all()
        if not products:
            return "No products are currently available."
        lines = [
            f"- {p.name}: ${p.price_cents / 100:.2f} ({p.stock} in stock)" for p in products
        ]
        return "\n".join(lines)


@tool
async def get_product_price_tool(product_name: str) -> str:
    """Use this to answer 'what is the price of <product>'. Pass the product's name (partial match ok)."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Product))
        products = result.scalars().all()
        matches = [p for p in products if product_name.lower() in p.name.lower()]
        if not matches:
            return f"No product matching '{product_name}' was found."
        return "\n".join(f"{p.name}: ${p.price_cents / 100:.2f}, {p.stock} in stock" for p in matches)


@tool
async def get_order_status_tool(order_id: str, requesting_user_id: str) -> str:
    """
    Use this to answer 'what is the status of my order'. Requires the order_id
    the customer gives you, plus the requesting_user_id (already known from the
    authenticated session — never ask the customer for this, it's supplied by
    the system). Enforces that a customer can only look up their OWN orders,
    same as the REST API does.
    """
    async with AsyncSessionLocal() as db:
        order = await db.get(Order, order_id)
        if order is None:
            return "No order found with that ID."
        if order.user_id != requesting_user_id:
            return "That order does not belong to the requesting customer, so I can't share its details."
        return f"Order {order.id}: status = {order.status.value}, total = ${order.total_cents / 100:.2f}"
