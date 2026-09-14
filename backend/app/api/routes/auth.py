from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.schemas.user import AuthResponse, GoogleLoginRequest, UserOut
from app.services.google_auth import verify_google_id_token

router = APIRouter(prefix="/auth", tags=["auth"])

ADMIN_EMAIL_TO_PROMOTE = "thajulniyas100@gmail.com"


@router.post("/google/login", response_model=AuthResponse)
async def google_login(payload: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Flow: Frontend gets an ID token from Google Identity Services -> sends it here
    -> we verify it server-side -> create the user if new, or fetch if existing ->
    issue our OWN short-lived session JWT for subsequent API calls.

    Handles both 'new user registration' and 'existing user login' in one endpoint,
    since from Google's side both look identical (a verified ID token) — the only
    difference is whether we find a matching google_sub in our DB already.
    """
    google_user = verify_google_id_token(payload.id_token)

    result = await db.execute(select(User).where(User.google_sub == google_user.sub))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=google_user.email,
            name=google_user.name,
            picture_url=google_user.picture,
            google_sub=google_user.sub,
            role=UserRole.customer,
        )
        db.add(user)

    if (user.email or "").lower() == ADMIN_EMAIL_TO_PROMOTE.lower():
        user.role = UserRole.admin

    await db.commit()
    await db.refresh(user)

    token = create_access_token(user_id=user.id, role=user.role.value)
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.post("/logout")
async def logout():
    return {"detail": "Logged out. Discard the token client-side."}
