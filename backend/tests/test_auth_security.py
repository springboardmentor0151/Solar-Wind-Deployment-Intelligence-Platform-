from app.core.security import get_password_hash, verify_password


def test_password_hash_and_verify_round_trip() -> None:
    password = "super-secret-password"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False
