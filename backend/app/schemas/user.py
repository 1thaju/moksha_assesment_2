from pydantic import BaseModel

from app.models.user import UserRole


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    picture_url: str | None
    role: UserRole

    class Config:
        from_attributes = True


class GoogleLoginRequest(BaseModel):
    id_token: str  # the credential returned by Google Identity Services on the frontend


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
