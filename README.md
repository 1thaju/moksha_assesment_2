# Hydra Curls Shop

Hydra Curls is a full-stack mini e-commerce application built as a job
assessment. It demonstrates a customer storefront, Google authentication,
customer/admin role-based access control, stock-aware ordering, Stripe test-mode
checkout, and an AI support agent grounded in live product and order data.

The repository is intentionally small enough to review quickly while still
showing the important production boundaries: the browser handles presentation,
the FastAPI service owns business rules, and PostgreSQL is the source of truth
for catalog, inventory, users, and orders.

## Submission Details

- **Live frontend:** https://frontend-chi-two-52.vercel.app
- **Live backend API:** https://moksha-assesment-2.onrender.com 
- **GitHub repository:** https://github.com/1thaju/moksha_assesment_2.git
- **Total development time:**  Approx. 22-25 Hours
- **AI tools used:** Claude (Sonnet), used throughout for architecture, full
  implementation of both the backend and frontend, debugging (CORS, Google
  OAuth origin configuration, Render Python-version and database-connection
  issues during deployment), and this documentation. Every generated piece was
  reviewed, tested, and in several cases corrected 

**A note on the live demo:** the backend is hosted on Render's free tier, which
spins down after a period of inactivity. If the app feels unresponsive on
first load, it's most likely the backend waking up (usually 30-60 seconds) —
refreshing after a short wait resolves it.

**Test credentials:** sign in with Google using any account to browse as a
customer. To review the admin dashboard, sign in with
`thajulniyas100@gmail.com` (pre-promoted to admin via the seed script).

### Customer experience

- Public product catalog and product detail pages.
- Persistent client-side cart.
- Google Sign-In with a backend-issued JWT session.
- Checkout flow that creates an order from server-validated product data.
- Stripe-hosted payment checkout.
- Order history restricted to the signed-in customer.
- Floating support chat for product, availability, price, and order-status questions.

### End-to-end architecture

The application follows this request path:

```text
UI (React + TypeScript + Tailwind CSS)
  -> API (FastAPI + Uvicorn)
  -> Database (PostgreSQL)
  -> Authentication (Google Sign-In + backend JWT)
  -> Business Logic (inventory, cart validation, orders, payments, permissions)
  -> AI (LangGraph/LangChain support agent)
  -> Integrations (Google OAuth, Stripe Checkout/webhooks, Gemini)
```

The browser owns presentation, local cart state, and navigation. FastAPI is the
security and business-logic boundary: it verifies identity, loads authoritative
product prices and stock from PostgreSQL, creates orders, enforces customer and
admin permissions, and exposes the authenticated support-agent endpoint.

### Administration

- Admin-only product creation, editing, and deletion.
- Admin view of all customer orders.
- Admin authorization enforced by FastAPI dependencies, not only by hidden UI.
- Seed script for sample products and promotion of the assessment admin account.

### Backend guarantees

- Prices are read from PostgreSQL, never trusted from the cart payload.
- Inventory is checked and reserved when an order is created.
- Order items snapshot product names and prices for historical accuracy.
- Payment status changes only after a signed Stripe webhook is verified.
- AI tools query the application database and enforce order ownership.

## Technology

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Lucide icons |
| Backend | FastAPI, Uvicorn, Pydantic Settings |
| Persistence | PostgreSQL, SQLAlchemy 2 async, asyncpg |
| Authentication | Google ID token verification, PyJWT |
| Payments | Stripe Checkout and signed webhooks |
| AI support | LangGraph, LangChain, Google Gemini |
| Tests | Python `unittest` |

## Repository Structure

```text
backend/
  app/
    main.py                 FastAPI application and route registration
    seed.py                 Sample data and admin promotion script
    agent/                  LangGraph agent and database-backed tools
    api/routes/             Auth, products, orders, payments, and agent routes
    core/                   Configuration, database, and security helpers
    models/                 SQLAlchemy database models
    schemas/                Pydantic request and response schemas
    services/               Google authentication and Stripe integration
  tests/                    Focused schema, agent, and auth tests
frontend/
  src/
    components/             Header, chat widget, and sign-in UI
    context/                Auth and cart state providers
    lib/                    API client and shared TypeScript types
    pages/                  Storefront, checkout, orders, login, and admin views
  vite.config.ts            Vite configuration and API proxy
API.md                     REST endpoint quick reference
DB_SCHEMA.md               Tables, fields, and relationships
SYSTEM_DESIGN.md            Architecture, flows, and scaling discussion
```

## Prerequisites

- Python 3.12 or a compatible version supported by `runtime.txt`.
- Node.js and npm.
- PostgreSQL 16 or Docker Desktop.
- Google Cloud OAuth credentials for Google Sign-In.
- Stripe test-mode credentials and the Stripe CLI for local webhook testing.
- A Gemini API key if the AI support agent is being evaluated.

## Local Setup

If a container named `hydra-pg` already exists, start it with
`docker start hydra-pg`.

### 1. Create the database

Start PostgreSQL locally or with Docker. For example:

```bash
docker run --name hydra-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hydra_shop -p 5432:5432 -d postgres:16
```

If the `hydra-pg` container already exists, start it with
`docker start hydra-pg`.

### 2. Install and run the backend

From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

Install dependencies and create `backend/.env` using the configuration table
below:

```bash
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The backend is available at `http://localhost:8000`. Confirm it is healthy at
`http://localhost:8000/api/health`; interactive API documentation is available
at `http://localhost:8000/docs` and `http://localhost:8000/redoc`.

The application creates the SQLAlchemy tables during startup. The first startup
therefore requires a reachable PostgreSQL database.

### 3. Seed products

With the backend virtual environment active and the working directory set to
`backend`:

```bash
python -m app.seed
```

The script inserts five sample products only when the product table is empty.
It also promotes `thajulniyas100@gmail.com` to the admin role if that user has
already signed in. To test admin functionality with that account, sign in once
through Google and run the seed command again.

**Note:** the seed script uses whichever `DATABASE_URL` is set in
`backend/.env` at the time it's run. To seed the live production database
rather than a local one, temporarily point `DATABASE_URL` at the deployed
Postgres instance's connection string before running the script, then switch
it back for local development.

### 4. Install and run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend API client uses `VITE_API_URL` when it is set; otherwise it calls
relative `/api` paths. The checked-in Vite proxy currently forwards `/api` to the
assessment deployment at `https://moksha-assesment-2.onrender.com`. For a fully
local backend, either set `VITE_API_URL=http://localhost:8000` in
`frontend/.env`, or change the local proxy target in `frontend/vite.config.ts`
to `http://localhost:8000`.

### 5. Forward Stripe webhooks locally

Stripe payment completion is confirmed by the backend webhook, not by the
browser redirect. With the backend running, execute:

```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

Copy the `whsec_...` value printed by the CLI into `STRIPE_WEBHOOK_SECRET` in
`backend/.env`, then restart the backend. Use Stripe test cards when checking
the checkout flow.

## Configuration

Create `backend/.env` manually. Do not commit it.

| Variable | Default / example | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Hydra Curls Shop API` | FastAPI application name |
| `ENVIRONMENT` | `development` | Runtime environment label |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/hydra_shop` | Async PostgreSQL connection |
| `JWT_SECRET` | `change-me-in-env` | Secret used to sign session JWTs; replace it |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | `10080` | Session lifetime, seven days by default |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Backend audience validation for Google ID tokens |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe test-mode server key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe signature verification |
| `STRIPE_SUCCESS_URL` | `http://localhost:5173/checkout/success` | Browser return URL after checkout |
| `STRIPE_CANCEL_URL` | `http://localhost:5173/checkout/cancel` | Browser return URL when checkout is cancelled |
| `GEMINI_API_KEY` | Gemini API key | AI support agent |
| `OPENAI_API_KEY` | optional | Reserved provider configuration |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS origin; comma-separated values are supported |

Create `frontend/.env` when using explicit local API configuration:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

The Google client ID must match between the frontend and backend. In Google
Cloud Console, add `http://localhost:5173` (and, for the deployed frontend,
its live URL) as authorized JavaScript origins.

## Authentication and authorization flow

1. The customer selects Google Sign-In in the React frontend.
2. Google returns an ID token to the frontend.
3. The frontend sends the token to `POST /api/auth/google/login`.
4. FastAPI verifies the token signature and Google client ID, then creates or
   loads the local PostgreSQL user.
5. FastAPI returns an application JWT; the frontend sends it as a Bearer token
   on protected requests.
6. Dependencies enforce authentication, ownership, and admin role checks on
   every protected route.

Customers can access only their own orders. Product mutations and the complete
order list are admin-only, and hiding an admin screen in the frontend is never
used as the security boundary.

## Business logic and payment flow

- The cart sends product IDs and quantities only; the API ignores client-supplied
  prices and reads current prices from PostgreSQL.
- Order creation validates positive quantities and available stock, reserves the
  stock, calculates the total, and snapshots product names and prices.
- Checkout creates a Stripe-hosted session from the persisted order.
- A verified Stripe webhook is the source of truth for `paid` and
  `payment_failed` status changes; the browser redirect is informational only.

## AI support agent

The authenticated support agent is built with LangGraph/LangChain and uses
database-backed tools for live product and order information. It can answer
questions such as:

- "Which products are currently in stock?"
- "What is the price of the hydrating curl cream?"
- "What is the status of my order?"

The agent receives the authenticated user's ID from FastAPI rather than from
the question or client payload, so order lookups cannot cross customer
ownership boundaries.

## Using the Application

1. Open the storefront and browse the seeded catalog.
2. Add products to the cart and adjust quantities.
3. Sign in with Google before creating an order.
4. Create the order. The backend validates current prices and stock and returns
   a pending order.
5. Start checkout and complete payment on Stripe's hosted test page.
6. Let the Stripe CLI deliver the webhook, then review the order status.
7. Ask the support agent about available products, a product price, or an order
   by its ID.
8. Sign in with the configured admin email to access `/admin` and manage products
   or review all orders.

## API Overview

All application routes are prefixed with `/api`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/google/login` | Public | Exchange a Google ID token for the application JWT |
| `GET` | `/auth/me` | Bearer JWT | Return the current user |
| `POST` | `/auth/logout` | Public | Stateless logout; the client discards its token |
| `GET` | `/products` | Public | List the catalog |
| `GET` | `/products/{id}` | Public | Read one product |
| `POST` | `/products` | Admin | Create a product |
| `PATCH` | `/products/{id}` | Admin | Update a product |
| `DELETE` | `/products/{id}` | Admin | Delete a product |
| `POST` | `/orders` | Bearer JWT | Validate cart items, reserve stock, and create a pending order |
| `GET` | `/orders/me` | Bearer JWT | List the current user's orders |
| `GET` | `/orders` | Admin | List every order |
| `GET` | `/orders/{id}` | Owner or admin | Read one order |
| `POST` | `/orders/{id}/checkout` | Order owner | Create a Stripe Checkout Session |
| `POST` | `/webhooks/stripe` | Stripe signature | Process payment events |
| `POST` | `/agent/ask` | Bearer JWT | Ask the database-backed AI support agent |

Authenticated requests use:

```http
Authorization: Bearer <jwt>
```

Errors use FastAPI's standard shape, for example
`{"detail":"Product not found"}`. Common statuses are `400` for invalid input,
`401` for missing or invalid authentication, `403` for role or ownership
violations, `404` for missing resources, and `409` for insufficient stock.

See [API.md](API.md) for the compact endpoint reference and live `/docs` for
request and response schemas.

## Data Model

The database contains four core tables:

- `users`: Google identity, profile information, and `customer`/`admin` role.
- `products`: catalog data, integer-cent prices, currency, image URL, and stock.
- `orders`: owner, payment status, total, and Stripe identifiers.
- `order_items`: quantity plus snapshotted product name and unit price.

Money is stored as integer cents to avoid floating-point rounding. Order items
copy the product name and price at order creation, so historical orders remain
correct after a product is renamed, repriced, or removed.

See [DB_SCHEMA.md](DB_SCHEMA.md) for the field-level schema and relationships.

## Important Design Decisions

### Authentication and authorization

Google authenticates the user, but the backend verifies the Google ID token's
signature and audience before creating or finding a local user. The backend then
issues its own JWT. Customers can only query their own orders; admin checks are
implemented in the backend with `require_admin` dependencies. Hiding an admin
screen in the frontend is treated as usability only, never as the security
boundary.

### Inventory and order integrity

The client submits product IDs and quantities only. The backend reads each
product, validates stock, calculates totals, decrements stock, and snapshots line
items in one order-creation flow. A client cannot alter the price by changing a
cart payload.

### Stripe payment lifecycle

Checkout Sessions are created server-side from the persisted order. The success
page is only a user experience redirect; the authoritative `paid` or
`payment_failed` transition comes from a verified Stripe webhook.

### Grounded AI support

The support agent has tools for listing products, looking up product prices and
stock, and reading an order status. Those tools query PostgreSQL directly. Order
status lookups receive the authenticated user's ID and reject another customer's
order, preventing the model from becoming an authorization bypass.

## Testing

Run the backend tests from the `backend` directory with its virtual environment
active. The tests are standalone `unittest` modules, so run them individually:

```bash
python tests/test_product_schema.py
python tests/test_agent_support.py
python tests/test_admin_email.py
```

The current tests cover:

- Product update schema validation, including currency and stock fields.
- Agent parsing for product and order questions.
- Local checkout URL construction.
- Automatic admin promotion for the configured admin email on Google login.

For a manual smoke test, also check `/api/health`, public product browsing,
customer order ownership, admin product mutations, a successful Stripe test
payment, and a webhook-delivered order status transition.

Build and lint the frontend with:

```bash
cd frontend
npm run lint
npm run build
```

## Deployment Notes

The frontend is deployed on Vercel; the backend runs on Render as a managed
Python web service with a Render-hosted PostgreSQL instance. This mirrors the
general approach described below and in `SYSTEM_DESIGN.md`, adapted to
free-tier hosting for the purposes of this assessment.

More generally, the frontend is a static Vite build and can be hosted on any
static host (Vercel, S3/CloudFront, etc.). The backend can run as a container
or a managed Python service, and PostgreSQL should be provided by a managed
database (RDS, Render Postgres, etc.) in any deployment, with secrets injected
through the platform's own secret manager rather than committed to the repo.

Before a production (non-assessment) deployment:

- Set a strong, unique `JWT_SECRET`.
- Use production Google OAuth origins and Stripe keys.
- Configure a public HTTPS webhook endpoint and its signing secret.
- Set `FRONTEND_ORIGIN` to the deployed frontend origin.
- Replace startup table creation with versioned migrations.
- Add persistent webhook-event idempotency and operational monitoring.

## Known Scope and Trade-offs

This is an assessment-sized application, not a complete commerce platform.

- Schema creation uses SQLAlchemy `create_all` at startup; Alembic migrations
  are not included.
- Webhook handling checks the order state for basic repeat-event protection but
  does not maintain a processed-event ledger.
- Email receipts, refunds, disputes, tax, shipping, and payment reconciliation
  are outside the current scope.
- Product image URLs are supported, but the seed data does not depend on a
  bundled product-image library.
- The seed script promotes one configured assessment email rather than providing
  a general admin-management workflow.
- AI responses depend on the configured Gemini provider and should be treated as
  a support interface over the application's tools, not as a source of payment
  or authorization decisions.
- The backend runs on Render's free tier for this submission, which spins down
  after inactivity; a brief delay on first request is expected and not a bug.

##