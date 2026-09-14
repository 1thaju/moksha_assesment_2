from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from fastapi import HTTPException, status

from app.core.config import get_settings

settings = get_settings()


class GoogleUserInfo:
    def __init__(self, sub: str, email: str, name: str, picture: str | None):
        self.sub = sub
        self.email = email
        self.name = name
        self.picture = picture


def verify_google_id_token(id_token_str: str) -> GoogleUserInfo:
    """
    Verifies the ID token's signature against Google's public keys and confirms
    it was issued for OUR client ID — this is the actual security boundary of
    the whole auth flow, so it happens server-side, never trusting anything the
    frontend sends about who the user claims to be.
    """
    try:
        info = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    return GoogleUserInfo(
        sub=info["sub"],
        email=info["email"],
        name=info.get("name", info["email"]),
        picture=info.get("picture"),
    )
