from pydantic import BaseModel


class AgentQuestionRequest(BaseModel):
    question: str


class AgentAnswerResponse(BaseModel):
    answer: str
