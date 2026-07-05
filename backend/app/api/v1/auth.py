"""
app/api/v1/auth.py
───────────────────
Authentication routes:
  POST /api/v1/auth/register      – create new user account
  POST /api/v1/auth/login         – password login → access + refresh tokens
  POST /api/v1/auth/otp/request   – send an SMS one-time code to a phone
  POST /api/v1/auth/otp/verify    – exchange an SMS code for tokens
  POST /api/v1/auth/refresh       – rotate refresh token, issue new access token
  POST /api/v1/auth/logout        – revoke the supplied refresh token

Token issuance and refresh-token persistence live in
app/services/auth_service.py; OTP/SMS logic in app/services/{otp,sms}.py.
Routes stay thin: validate input → delegate → return response.
"""

import logging

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import or_, select

from app.api.deps import CurrentUser, DbSession, RedisDep
from app.core.config import get_settings
from app.core.security import hash_password, verify_password
from app.db.models.refresh_token import RefreshToken
from app.db.models.user import User
from app.schemas.auth import (
    AppleLoginRequest,
    ForgotPasswordRequestIn,
    ForgotPasswordResetIn,
    GoogleLoginRequest,
    OTPRequestIn,
    OTPVerifyIn,
    PushTokenUpdate,
    RefreshRequest,
    RegisterResponse,
    SocialLoginRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services import auth_service
from app.services.otp import OTPCooldownError, issue_code, verify_code
from app.services.sms import SMSDeliveryError, send_sms

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(body: UserRegisterRequest, db: DbSession) -> RegisterResponse:
    """Create a new user and return tokens so they are authenticated immediately."""
    # Reject duplicate email or phone.
    clauses = [User.email == body.email]
    if body.phone:
        clauses.append(User.phone == body.phone)
    existing = await db.execute(select(User).where(or_(*clauses)))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email or phone already exists.",
        )

    user = User(
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
        location=body.location,
    )
    db.add(user)
    await db.flush()  # populate user.id without committing

    tokens = await auth_service.issue_token_pair(db, user.id)
    logger.info("New user registered", extra={"user_id": str(user.id)})

    return RegisterResponse(
        user=UserResponse.model_validate(user),
        tokens=tokens,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate with email and password",
)
async def login(body: UserLoginRequest, db: DbSession) -> TokenResponse:
    """Return access and refresh tokens for valid credentials."""
    result = await db.execute(select(User).where(User.email == body.email))
    user: User | None = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    tokens = await auth_service.issue_token_pair(db, user.id)
    logger.info("User logged in (password)", extra={"user_id": str(user.id)})
    return tokens


@router.post(
    "/otp/request",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Send an SMS login code to a registered phone number",
)
async def request_otp(body: OTPRequestIn, db: DbSession, redis: RedisDep) -> dict:
    """
    Generate and SMS a one-time login code.

    To avoid leaking which phone numbers are registered, this endpoint returns
    202 regardless of whether the number exists. A real code is only sent when
    an active account matches the number.
    """
    result = await db.execute(select(User).where(User.phone == body.phone))
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.is_active:
        # Uniform response to avoid leaking registered numbers
        return {"detail": "If the number is registered, a code has been sent."}

    try:
        code = await issue_code(redis, body.phone)
    except OTPCooldownError:
        # Silently accept — don't reveal timing of prior requests.
        return {"detail": "If the number is registered, a code has been sent."}
    try:
        await send_sms(body.phone, f"Your Rawbin login code is {code}. It expires in 5 minutes.")
    except SMSDeliveryError:
        logger.error("Failed to deliver OTP SMS", extra={"phone": body.phone})
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send the SMS code. Please try again.",
        )

    return {"detail": "Code has been sent."}


@router.post(
    "/otp/verify",
    response_model=TokenResponse,
    summary="Exchange an SMS code for access + refresh tokens",
)
async def verify_otp(body: OTPVerifyIn, db: DbSession, redis: RedisDep) -> TokenResponse:
    """Verify the SMS code and, on success, issue a token pair."""
    if not await verify_code(redis, body.phone, body.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired code.",
        )

    result = await db.execute(select(User).where(User.phone == body.phone))
    user: User | None = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired code.",
        )

    tokens = await auth_service.issue_token_pair(db, user.id)
    logger.info("User logged in (otp)", extra={"user_id": str(user.id)})
    return tokens


@router.post(
    "/forgot-password/request",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Request a password reset SMS code",
)
async def forgot_password_request(body: ForgotPasswordRequestIn, db: DbSession, redis: RedisDep) -> dict:
    """Send an SMS code to reset a user's password."""
    result = await db.execute(select(User).where(User.phone == body.phone))
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return {"detail": "If the number is registered, a code has been sent."}

    try:
        code = await issue_code(redis, body.phone)
    except OTPCooldownError:
        return {"detail": "If the number is registered, a code has been sent."}
    try:
        await send_sms(body.phone, f"Your Rawbin password reset code is {code}. It expires in 5 minutes.")
    except SMSDeliveryError:
        logger.error("Failed to deliver reset OTP SMS", extra={"phone": body.phone})
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send the SMS code. Please try again.",
        )

    return {"detail": "Code has been sent."}


@router.post(
    "/forgot-password/reset",
    status_code=status.HTTP_200_OK,
    summary="Reset password using SMS code",
)
async def forgot_password_reset(body: ForgotPasswordResetIn, db: DbSession, redis: RedisDep) -> dict:
    """Verify the SMS code and update the user's password."""
    if not await verify_code(redis, body.phone, body.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired code.",
        )

    result = await db.execute(select(User).where(User.phone == body.phone))
    user: User | None = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired code.",
        )

    user.password_hash = hash_password(body.new_password)
    await db.flush()
    logger.info("User reset password", extra={"user_id": str(user.id)})
    
    return {"detail": "Password has been successfully reset."}



@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and issue new access token",
)
async def refresh(body: RefreshRequest, db: DbSession) -> TokenResponse:
    """Validate the refresh token, rotate it, and return a fresh pair."""
    token_hash = auth_service.hash_token(body.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt: RefreshToken | None = result.scalar_one_or_none()

    if rt is None or not rt.is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or has expired.",
        )

    rt.revoked = True  # rotate: revoke the presented token
    return await auth_service.issue_token_pair(db, rt.user_id)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke a refresh token (logout)",
)
async def logout(body: RefreshRequest, db: DbSession) -> None:
    """Mark the refresh token as revoked. Silent success if already revoked."""
    token_hash = auth_service.hash_token(body.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt: RefreshToken | None = result.scalar_one_or_none()
    if rt and not rt.revoked:
        rt.revoked = True


@router.put(
    "/push-token",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Update the FCM push token for the current user",
)
async def update_push_token(
    body: PushTokenUpdate, current_user: CurrentUser, db: DbSession
) -> None:
    current_user.firebase_push_token = body.token
    await db.flush()
    logger.info("Updated push token", extra={"user_id": str(current_user.id)})


@router.post(
    "/social/firebase",
    response_model=TokenResponse,
    summary="Authenticate or register via Firebase Auth ID token",
)
async def social_login_firebase(
    body: SocialLoginRequest, db: DbSession
) -> TokenResponse:
    from app.core.firebase import get_firebase_app
    from firebase_admin import auth as fb_auth

    firebase_app = get_firebase_app()
    if firebase_app is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase integration is not configured on this server.",
        )

    try:
        # Verify the ID token using the Firebase Admin SDK
        decoded_token = fb_auth.verify_id_token(body.id_token, app=firebase_app)
    except Exception as e:
        logger.warning("Invalid Firebase ID token: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired ID token.",
        )

    email = decoded_token.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID token does not contain an email address.",
        )
    email = email.strip().lower()

    # Look up the user by email
    result = await db.execute(select(User).where(User.email == email))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        # Provision a new user if they don't exist yet
        # Social login accounts typically don't use passwords, so we use an unusable hash
        name = decoded_token.get("name") or decoded_token.get("email").split("@")[0]
        user = User(
            email=email,
            phone=None, # Not guaranteed to be in Firebase token unless phone auth is used
            password_hash=hash_password("!unusable_social_login_pwd_xyz123!"),
            display_name=name,
        )
        db.add(user)
        await db.flush()
        logger.info("Provisioned new user via social login", extra={"user_id": str(user.id)})
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    tokens = await auth_service.issue_token_pair(db, user.id)
    logger.info("User logged in (social)", extra={"user_id": str(user.id)})
    return tokens


@router.post(
    "/social/google",
    response_model=TokenResponse,
    summary="Authenticate or register via a Google OAuth ID token",
)
async def social_login_google(
    body: GoogleLoginRequest, db: DbSession
) -> TokenResponse:
    """
    Verify a Google-issued ID token directly (no Firebase required).
    If the user doesn't exist, auto-provision a new account.
    """
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="google-auth library is not installed.",
        )

    google_client_id = settings.GOOGLE_CLIENT_ID
    if not google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GOOGLE_CLIENT_ID is not configured on this server.",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            body.id_token,
            google_requests.Request(),
            google_client_id,
        )
    except ValueError as e:
        logger.warning("Invalid Google ID token: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google ID token.",
        )

    email = idinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token does not contain an email address.",
        )
    email = email.strip().lower()

    if not idinfo.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email is not verified.",
        )

    # Look up user by email
    result = await db.execute(select(User).where(User.email == email))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        # Auto-provision a new user from Google profile
        name = idinfo.get("name") or email.split("@")[0]
        picture = idinfo.get("picture")
        user = User(
            email=email,
            phone=None,
            password_hash=hash_password("!unusable_google_oauth_pwd!"),
            display_name=name,
        )
        db.add(user)
        await db.flush()
        logger.info("Provisioned new user via Google Sign-In", extra={"user_id": str(user.id)})
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    tokens = await auth_service.issue_token_pair(db, user.id)
    logger.info("User logged in (google)", extra={"user_id": str(user.id)})
    return tokens


@router.post(
    "/social/apple",
    response_model=TokenResponse,
    summary="Authenticate or register via an Apple Identity token",
)
async def social_login_apple(
    body: AppleLoginRequest, db: DbSession
) -> TokenResponse:
    """
    Verify an Apple-issued Identity token directly.
    If the user doesn't exist, auto-provision a new account.
    """
    from jose import jwt, jwk
    import httpx
    
    apple_client_id = settings.APPLE_CLIENT_ID
    if not apple_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="APPLE_CLIENT_ID is not configured on this server.",
        )
        
    try:
        # Fetch Apple's public keys
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://appleid.apple.com/auth/keys")
            resp.raise_for_status()
            keys_data = resp.json()
            
        # Get the key ID from the unverified token header
        unverified_header = jwt.get_unverified_header(body.id_token)
        kid = unverified_header.get("kid")
        if not kid:
            raise ValueError("Token missing kid header")
            
        # Find the matching key
        matching_key = next((k for k in keys_data["keys"] if k["kid"] == kid), None)
        if not matching_key:
            raise ValueError("Apple public key not found for this kid")
            
        # Construct the key object
        public_key = jwk.construct(matching_key)
        
        # Decode and verify the token
        decoded_token = jwt.decode(
            body.id_token,
            public_key,
            algorithms=["RS256"],
            audience=apple_client_id,
            issuer="https://appleid.apple.com"
        )
    except Exception as e:
        logger.warning("Invalid Apple ID token: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Apple ID token.",
        )

    email = decoded_token.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apple token does not contain an email address.",
        )
    email = email.strip().lower()

    # Look up user by email
    result = await db.execute(select(User).where(User.email == email))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        # Auto-provision a new user from Apple profile
        # Apple only sends first_name and last_name on the very first login
        name = ""
        if body.first_name:
            name += body.first_name
        if body.last_name:
            if name:
                name += " "
            name += body.last_name
            
        if not name:
            name = email.split("@")[0]
            
        user = User(
            email=email,
            phone=None,
            password_hash=hash_password("!unusable_apple_oauth_pwd!"),
            display_name=name,
        )
        db.add(user)
        await db.flush()
        logger.info("Provisioned new user via Apple Sign-In", extra={"user_id": str(user.id)})
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    tokens = await auth_service.issue_token_pair(db, user.id)
    logger.info("User logged in (apple)", extra={"user_id": str(user.id)})
    return tokens
