from fastapi import APIRouter, Depends, HTTPException, status
from google.api_core.exceptions import Unauthenticated

from app.agent.agent import ask_agent
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.agent import AgentAnswerResponse, AgentQuestionRequest

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/ask", response_model=AgentAnswerResponse)
async def ask(payload: AgentQuestionRequest, user: User = Depends(get_current_user)):
    """
    Requires authentication (not because the questions are sensitive, but so
    order-status lookups can be scoped to the real logged-in user rather than
    trusting a user_id the client could otherwise pass in directly).
    """
    try:
        answer = await ask_agent(question=payload.question, user_id=user.id)
    except (RuntimeError, Unauthenticated) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    return AgentAnswerResponse(answer=answer)
