# System Design — Hydra Curls Mini E-Commerce App

## Architecture Overview

```
                        ┌─────────────────────┐
                        │      Browser          │
                        │  React + TS + Tailwind │
                        │  (Vite dev server /    │
                        │   static hosting)      │
                        └──────────┬─────────────┘
                                   │ HTTPS (JSON over REST)
                                   │ Authorization: Bearer <JWT>
                                   ▼
                        ┌─────────────────────┐
                        │   FastAPI Backend     │
                        │  ┌─────────────────┐  │
                        │  │ /auth            │  │──▶ Google OAuth (id_token verify)
                        │  │ /products         │  │
                        │  │ /orders           │  │
                        │  │ /orders/{id}/     │  │──▶ Stripe Checkout Sessions
                        │  │   checkout        │  │
                        │  │ /webhooks/stripe  │  │◀── Stripe webhook (payment events)
                        │  │ /agent/ask        │  │──▶ LangGraph agent ──▶ Gemini API
                        │  └─────────────────┘  │         │
                        └──────────┬─────────────┘         │ (tools query DB directly)
                                   │                        ▼
                                   ▼                 (same DB connection pool)
                        ┌─────────────────────┐
                        │   PostgreSQL           │
                        │  users / products /    │
                        │  orders / order_items  │
                        └─────────────────────┘
```

## Components

- **Frontend** — React + TypeScript SPA. Talks only to our own FastAPI backend;
  never calls Stripe or Google directly for anything security-sensitive (it only
  ever receives a redirect URL from Stripe and an ID token from Google's own
  hosted Sign-In button).
- **Backend (FastAPI)** — single service owning all business logic: auth
  verification, RBAC, stock/price integrity, Stripe session creation, webhook
  handling, and the AI agent's tool-calling surface.
- **Database (PostgreSQL)** — `users`, `products`, `orders`, `order_items`.
  Orders snapshot product name/price at purchase time so later price changes
  don't retroactively alter historical orders.
- **AI Agent** — a LangGraph ReAct agent that calls tools which query our own
  database directly (not the LLM's general knowledge) for product/order facts,
  so answers are grounded in real data.
- **Google Sign-In** — frontend renders Google's own button; on success we get
  an ID token, which the *backend* verifies against Google's public keys before
  creating/logging in the user. The frontend never handles credentials directly.
- **Stripe** — backend creates the Checkout Session (so amounts are always
  server-derived from the Order, never trusted from the client) and Stripe
  redirects the browser there directly. Payment confirmation flows back via a
  signed webhook, not the browser redirect, so a customer can't fake a
  successful payment by just hitting the success URL.

## Auth Flow
```
Browser → Google Sign-In widget → Google issues ID token
Browser → POST /auth/google/login {id_token} → Backend
Backend → verifies token signature + audience against Google's public keys
Backend → creates or fetches User row → issues our own short-lived JWT
Browser → stores JWT, sends as Bearer token on all subsequent requests
```

## Payment Flow
```
Browser → POST /orders {items} → Backend creates Order (status=pending),
          validates + decrements stock, snapshots prices
Browser → POST /orders/{id}/checkout → Backend creates Stripe Checkout
          Session (amounts from the Order, not the client) → returns checkout_url
Browser → redirected to Stripe-hosted checkout page
Stripe   → on completion, calls POST /webhooks/stripe (signed) → Backend verifies
          signature → looks up Order via session metadata → sets status=paid
Browser → redirected to /checkout/success (UX only; the real status transition
          already happened via the webhook, independent of this redirect)
```

## RBAC
Enforced **server-side only** via a `require_admin` FastAPI dependency on every
mutating product route and the "list all orders" route — the frontend hides
admin UI for non-admins, but that's UX, not the actual boundary. A customer's
own orders are filtered by `user.id` from their verified JWT on every query;
there's no code path where a client-supplied ID can be used to view another
user's orders.

## Scaling Considerations

If users and AI request volume increased significantly:

- **Database**: move from a single Postgres instance to read replicas for
  product/order reads; add connection pooling (PgBouncer) as concurrent
  request volume grows past what SQLAlchemy's pool handles comfortably.
- **Backend**: FastAPI is already async and stateless (JWT-based auth, no
  server-side sessions), so it horizontally scales by simply running more
  instances behind a load balancer — no sticky sessions needed.
- **AI agent load**: LLM calls are the most expensive and highest-latency part
  of the stack. At scale, this needs: (1) response caching for common
  questions (e.g., "what products are available" doesn't need a fresh LLM
  call every time — cache with a short TTL), (2) a request queue with
  backpressure so a spike in chat traffic doesn't starve the checkout path's
  DB connections, and (3) moving agent invocation to a separate worker
  pool/service so it can scale independently of the core storefront API.
- **Stripe webhooks**: at higher volume, webhook processing should be made
  idempotent (already partially true here via checking order.status before
  transitioning) and moved off the request-handling thread into a background
  queue (e.g., Celery/RQ) so Stripe's retry behavior never risks timing out
  against slow DB writes.
- **Static frontend**: serve via a CDN (Vercel/Cloudflare/S3+CloudFront)
  rather than the Vite dev server, decoupling frontend scaling entirely from
  backend capacity.

## AWS / Deployment Approach

- **Frontend**: static build (`npm run build`) deployed to S3 + CloudFront, or
  Vercel for simplicity.
- **Backend**: containerized (Dockerfile) FastAPI app deployed to ECS
  Fargate (or a single EC2/Lightsail instance for a lighter footprint at this
  assignment's scale) behind an Application Load Balancer.
- **Database**: RDS PostgreSQL (managed, automated backups).
- **Secrets**: environment variables via ECS task definitions / AWS Secrets
  Manager — never committed to the repo (see `.env.example` for the required
  variables).
- **Webhook endpoint**: must be publicly reachable over HTTPS for Stripe to
  deliver events — in production this is just the deployed backend's public
  URL; for local development, a tunnel (ngrok/Stripe CLI's `stripe listen`) is
  needed to receive webhook events on localhost.
