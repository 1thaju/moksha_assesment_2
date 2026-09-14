import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from app.api.routes.auth import google_login
from app.models.user import UserRole
from app.schemas.user import GoogleLoginRequest


class AdminEmailPromotionTests(unittest.IsolatedAsyncioTestCase):
    async def test_google_login_promotes_matching_admin_email(self):
        class FakeResult:
            def scalar_one_or_none(self):
                return None

        db = MagicMock()
        db.execute = AsyncMock(return_value=FakeResult())
        db.commit = AsyncMock()
        db.refresh = AsyncMock(side_effect=lambda obj: setattr(obj, "id", "generated-user-id"))

        with patch("app.api.routes.auth.verify_google_id_token") as mock_verify, patch(
            "app.api.routes.auth.create_access_token", return_value="test-token"
        ):
            mock_verify.return_value = SimpleNamespace(
                sub="google-sub-123",
                email="thajulniyas100@gmail.com",
                name="Test User",
                picture=None,
            )

            response = await google_login(GoogleLoginRequest(id_token="abc"), db=db)

        self.assertEqual(response.access_token, "test-token")
        self.assertEqual(response.user.role, UserRole.admin)

    async def test_google_login_promotes_existing_user_with_admin_email(self):
        class FakeResult:
            def __init__(self, user):
                self._user = user

            def scalar_one_or_none(self):
                return self._user

        user = type(
            "UserRecord",
            (),
            {
                "id": "user-123",
                "email": "thajulniyas100@gmail.com",
                "name": "Test User",
                "picture_url": None,
                "google_sub": "google-sub-456",
                "role": UserRole.customer,
            },
        )()

        db = MagicMock()
        db.execute = AsyncMock(return_value=FakeResult(user))
        db.commit = AsyncMock()
        db.refresh = AsyncMock()

        with patch("app.api.routes.auth.verify_google_id_token") as mock_verify, patch(
            "app.api.routes.auth.create_access_token", return_value="test-token"
        ):
            mock_verify.return_value = SimpleNamespace(
                sub="google-sub-456",
                email="thajulniyas100@gmail.com",
                name="Test User",
                picture=None,
            )

            response = await google_login(GoogleLoginRequest(id_token="abc"), db=db)

        self.assertEqual(response.access_token, "test-token")
        self.assertEqual(response.user.role, UserRole.admin)


if __name__ == "__main__":
    unittest.main()
