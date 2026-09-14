from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agent, auth, orders, payments, products
from app.core.config import get_settings
from app.core.database import init_models

settings = get_settings()


def get_allowed_origins() -> list[str]:
    raw_origins = settings.frontend_origin.split(",") if settings.frontend_origin else []
    origins = [origin.strip().rstrip("/") for origin in raw_origins if origin.strip()]
    if not origins:
        return ["http://localhost:5173"]
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_models()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(agent.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
