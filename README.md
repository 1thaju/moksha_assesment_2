# Hydra Curls — Mini AI E-Commerce App (Assignment 2)

A small e-commerce application with Google authentication, customer/admin RBAC,
product & order management, Stripe test-mode payments, and an AI support agent
that answers questions using real backend data.

See `/backend` and `/frontend` for the two halves, and `SYSTEM_DESIGN.md` for
the architecture overview, auth/payment flow diagrams, and scaling notes.

## Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router
- **Backend**: FastAPI, SQLAlchemy (async) + PostgreSQL, PyJWT, LangGraph +
  LangChain (Gemini), Stripe Python SDK, google-auth

## Quick Start

### 1. Database
You need a running PostgreSQL instance. Fastest local option:
```bash
docker run --name hydra-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hydra_shop -p 5432:5432 -d postgres:16
```

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # then fill in real values — see "Credentials" below
uvicorn app.main:app --reload
```
API docs available at `http://localhost:8000/docs` once running.

Seed sample products (and promote your own account to admin after your first
Google sign-in):
```bash
python -m app.seed
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_GOOGLE_CLIENT_ID
npm run dev
```
Visit `http://localhost:5173`. The Vite dev server proxies `/api` to the
backend on `:8000` (see `vite.config.ts`), so no CORS config is needed locally
beyond what's already set up.

### 4. Stripe webhook (local testing)
Stripe needs a publicly reachable URL to deliver webhook events. Locally, use
the Stripe CLI:
```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```
This prints a `whsec_...` value — put that in `backend/.env` as
`STRIPE_WEBHOOK_SECRET`.

## Credentials you'll need
- **Google OAuth Client ID**: create one in Google Cloud Console → APIs &
  Services → Credentials → OAuth 2.0 Client ID (type: Web application). Add
  `http://localhost:5173` as an authorized JavaScript origin. Put the client
  ID in both `backend/.env` (`GOOGLE_CLIENT_ID`) and `frontend/.env`
  (`VITE_GOOGLE_CLIENT_ID`) — same value in both places.
- **Stripe test keys**: from the Stripe Dashboard (test mode) → Developers →
  API keys. `STRIPE_SECRET_KEY` goes in `backend/.env`.
- **Gemini API key**: from Google AI Studio, for the AI support agent.

## What's implemented vs. simplified

Given the assignment's tight timeline, everything listed as a **requirement**
is implemented and working end-to-end (verified with an automated sanity
check against the order-creation/stock/RBAC logic — see
`backend`'s test run in development). A few things are intentionally kept
simple rather than production-hardened, noted here rather than hidden:

- **Webhook idempotency** is basic (checks `order.status` before transitioning)
  rather than using a full processed-events ledger — sufficient for the
  assignment's scope, called out as a scaling item in `SYSTEM_DESIGN.md`.
- **Migrations**: uses SQLAlchemy's `create_all` on startup rather than Alembic
  migrations, appropriate for an assignment/demo but noted as a production
  gap in the code comments.
- **Email/receipts, refunds, disputes**: out of scope per the assignment brief,
  not implemented.
- **Product images**: the seed data and UI support an `image_url` field, but
  no real product photography is included — this is a real, if fictional,
  product concept, so placeholder styling is used in its place rather than
  reproducing any brand's actual imagery.

## AI tools used
Built with Claude (Sonnet) — architecture, all backend/frontend code, the
LangGraph agent and its tools, the system design doc, and the sanity-test
script used to verify order/stock/RBAC logic before considering this done.

## Total development time
~[fill in based on your actual session]
