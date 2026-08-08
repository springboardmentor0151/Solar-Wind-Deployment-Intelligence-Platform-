from app.auth.jwt_handler import create_access_token, verify_access_token


def test_jwt_token():
    email = "anshu@example.com"

    token = create_access_token({"sub": email})

    assert token is not None

    decoded = verify_access_token(token)

    assert decoded is not None
    assert decoded["sub"] == email