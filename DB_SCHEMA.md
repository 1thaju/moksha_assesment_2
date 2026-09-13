# Database Schema

PostgreSQL, managed via SQLAlchemy models in `backend/app/models/`.

## users
| Column | Type | Notes |
|---|---|---|
| id | string (UUID) | Primary key |
| email | string | Unique, indexed |
| name | string | From Google profile |
| picture_url | string, nullable | From Google profile |
| google_sub | string | Unique, indexed — Google's stable subject ID for this account |
| role | enum(`customer`, `admin`) | Default `customer`; admins are promoted manually, never self-assigned |

## products
| Column | Type | Notes |
|---|---|---|
| id | string (UUID) | Primary key |
| name | string | |
| description | text | |
| price_cents | integer | Money stored as integer cents to avoid float rounding issues |
| currency | string | Default `usd` |
| image_url | string, nullable | |
| stock | integer | Decremented on order creation |

## orders
| Column | Type | Notes |
|---|---|---|
| id | string (UUID) | Primary key |
| user_id | string (FK → users.id) | Indexed |
| status | enum(`pending`, `paid`, `payment_failed`, `cancelled`) | `pending` on creation; `paid`/`payment_failed` set by the Stripe webhook |
| total_cents | integer | Computed at order-creation time from snapshotted line-item prices |
| currency | string | |
| stripe_checkout_session_id | string, nullable, unique | Set when a Checkout Session is created for this order |
| stripe_payment_intent_id | string, nullable | Set once payment succeeds |

## order_items
| Column | Type | Notes |
|---|---|---|
| id | string (UUID) | Primary key |
| order_id | string (FK → orders.id) | |
| product_id | string (FK → products.id) | |
| product_name | string | **Snapshot** at purchase time — not a live join, so later product renames don't rewrite order history |
| unit_price_cents | integer | **Snapshot** at purchase time — later price changes don't affect historical orders |
| quantity | integer | |

## Relationships
- `users` 1 → N `orders`
- `orders` 1 → N `order_items` (cascade delete)
- `order_items.product_id` references `products`, but the item's `product_name`
  / `unit_price_cents` are copied at creation time rather than always joined
  live, so an order remains an accurate historical record even if the product
  is later edited, repriced, or deleted.
