from app.auth.hashing import hash_password, verify_password


def test_password_hashing():
    password = "Anshu123"

    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False