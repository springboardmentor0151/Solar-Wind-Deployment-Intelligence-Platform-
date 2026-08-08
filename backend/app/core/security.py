from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.hash import bcrypt

from app.core.config import settings


# -----------------------------
# Password Hashing
# -----------------------------
def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return bcrypt.verify(
        plain_password,
        hashed_password
    )


# -----------------------------
# JWT Token Creation
# -----------------------------
def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    print("Current UTC:", datetime.now(timezone.utc))
    print("Token Expiry:", expire)

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )