"""
A small LangGraph ReAct-style agent. Given a free-text customer question plus
the authenticated user's id, it decides which tool(s) to call (if any) and
returns a grounded answer built from real product/order data instead of
general LLM knowledge.

Uses Gemini by default (this codebase already leans on the Gemini API
elsewhere), but is written against LangChain's model-agnostic interface so
swapping to OpenAI is a one-line change if you'd rather use that instead.
"""

import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.agent.tools import get_order_status_tool, get_product_price_tool, list_products_tool
from app.core.config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """You are the Hydra Curls customer support assistant.

Answer customer questions using only the data provided below. Never guess or
invent prices, stock levels, or order statuses. If the data is missing or does
not match the question, say so honestly.

Keep answers short, friendly, and helpful like a live support chat."""


def extract_product_name(question: str) -> str | None:
    q = question.strip()
    if not q:
        return None

    q = q.rstrip("?!.")
    q = re.sub(r"^\s*(what\s+is\s+the\s+price\s+of|what\s+is\s+the\s+cost\s+of|how\s+much\s+is|do\s+you\s+have|do\s+you\s+sell|is\s+there|can\s+you\s+tell\s+me\s+the\s+price\s+of|can\s+you\s+give\s+me\s+the\s+price\s+of)\s+", "", q, flags=re.IGNORECASE)
    q = re.sub(r"\s+(available|in stock|stock|today|please)\s*$", "", q, flags=re.IGNORECASE)

    if not q:
        return None

    match = re.search(r"(?:for|of)?\s*(.+)", q, flags=re.IGNORECASE)
    if match:
        name = match.group(1).strip().strip("'\".")
        name = re.sub(r"\s+(available|in stock|stock|today|please)$", "", name, flags=re.IGNORECASE)
        if name and name.lower() not in {"it", "this", "that"}:
            return name

    return None


def extract_order_id(question: str) -> str | None:
    q = question.strip()
    match = re.search(r"(?:order\s*(?:id|number)?\s*[:#-]?\s*)([A-Za-z0-9-]+)", q, flags=re.IGNORECASE)
    if match:
        return match.group(1)
    return None


def _build_model() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        google_api_key=settings.gemini_api_key,
        temperature=0,
    )


async def _fetch_context(question: str, user_id: str) -> str:
    q = question.lower()
    context_parts = [f"Requesting customer user_id: {user_id}"]

    if any(keyword in q for keyword in ["product", "products", "catalog", "available", "stock", "price", "cost"]):
        products = await list_products_tool.ainvoke({})
        context_parts.append(f"Catalog data:\n{products}")

    product_name = extract_product_name(question)
    if product_name and any(keyword in q for keyword in ["price", "cost", "how much", "available", "stock"]):
        product_details = await get_product_price_tool.ainvoke({"product_name": product_name})
        context_parts.append(f"Product lookup:\n{product_details}")

    if any(keyword in q for keyword in ["order", "status", "tracking"]):
        order_id = extract_order_id(question)
        if order_id:
            status = await get_order_status_tool.ainvoke({"order_id": order_id, "requesting_user_id": user_id})
            context_parts.append(f"Order lookup:\n{status}")

    if not context_parts[1:]:
        return "No product or order data was needed for this request."

    return "\n\n".join(context_parts)


async def ask_agent(question: str, user_id: str) -> str:
    model = _build_model()
    context = await _fetch_context(question, user_id)

    response = await model.ainvoke(
        [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Customer question: {question}\n\n"
                    f"Relevant backend data:\n{context}"
                )
            ),
        ]
    )
    return response.content
