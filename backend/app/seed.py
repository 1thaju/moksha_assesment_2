"""
Run with: python -m app.seed
Populates a few sample products and promotes one user (by email) to admin,
so you have something to test the storefront/admin views against.
"""
import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, init_models
from app.models.product import Product
from app.models.user import User, UserRole

SAMPLE_PRODUCTS = [
    {"name": "Hydrating Shampoo", "description": "48-hour hydration, no SLS/silicones/parabens.", "price_cents": 1499, "stock": 50},
    {"name": "Hydrating Conditioner", "description": "Deeply hydrates frizz-prone curls.", "price_cents": 1599, "stock": 40},
    {"name": "Hydration Mask", "description": "Weekly deep-conditioning treatment.", "price_cents": 1999, "stock": 25},
    {"name": "Curling Cream", "description": "Defines curls without crunch.", "price_cents": 1299, "stock": 60},
    {"name": "Curling Gel", "description": "All-day hold with shine.", "price_cents": 1299, "stock": 60},
]


ADMIN_EMAIL_TO_PROMOTE = "thajulniyas100@gmail.com"


async def seed():
    await init_models()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Product))
        if not result.scalars().first():
            for p in SAMPLE_PRODUCTS:
                db.add(Product(**p))
            print(f"Seeded {len(SAMPLE_PRODUCTS)} products.")
        else:
            print("Products already exist, skipping product seed.")

        result = await db.execute(select(User).where(User.email == ADMIN_EMAIL_TO_PROMOTE))
        user = result.scalar_one_or_none()
        if user:
            user.role = UserRole.admin
            print(f"Promoted {user.email} to admin.")
        else:
            print(
                f"No user with email {ADMIN_EMAIL_TO_PROMOTE} yet — sign in via Google once first, "
                "then re-run this script to promote that account to admin."
            )

        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
