import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock

from app.db.models.user import User
from sqlalchemy import select


@pytest.mark.asyncio
async def test_update_push_token(async_client: AsyncClient, auth_headers: dict, db_session):
    response = await async_client.put(
        "/api/v1/auth/push-token",
        headers=auth_headers,
        json={"token": "fake_fcm_token_123"},
    )
    assert response.status_code == 204

    # Verify the token was updated in the DB
    result = await db_session.execute(select(User).where(User.email == "fixture@rawbin.io"))
    user = result.scalar_one()
    assert user.firebase_push_token == "fake_fcm_token_123"


@pytest.mark.asyncio
@patch("firebase_admin.auth.verify_id_token")
@patch("app.core.firebase.get_firebase_app")
async def test_social_login_firebase_new_user(mock_get_app, mock_verify, async_client: AsyncClient, db_session):
    mock_get_app.return_value = MagicMock()
    mock_verify.return_value = {
        "email": "new_social_user@example.com",
        "name": "Social User",
        "uid": "firebase_uid_123",
    }

    response = await async_client.post(
        "/api/v1/auth/social/firebase",
        json={"id_token": "mock_id_token_string"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

    # Verify user was created
    result = await db_session.execute(select(User).where(User.email == "new_social_user@example.com"))
    user = result.scalar_one()
    assert user.display_name == "Social User"


@pytest.mark.asyncio
@patch("firebase_admin.auth.verify_id_token")
@patch("app.core.firebase.get_firebase_app")
async def test_social_login_firebase_existing_user(mock_get_app, mock_verify, async_client: AsyncClient, auth_headers, db_session):
    mock_get_app.return_value = MagicMock()
    # "fixture@rawbin.io" is the existing user created by the test fixtures
    mock_verify.return_value = {
        "email": "fixture@rawbin.io",
        "name": "Fixture User",
        "uid": "firebase_uid_456",
    }

    response = await async_client.post(
        "/api/v1/auth/social/firebase",
        json={"id_token": "mock_id_token_string"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
