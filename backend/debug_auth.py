from app.db.session import SessionLocal
from app.schemas.auth import UserCreate
from app.services.auth_service import create_user
from app.models.user import UserRole


def main() -> None:
    db = SessionLocal()
    payload = UserCreate(full_name='test', email='test@example.com', password='password123', role=UserRole.planner)
    print('payload', payload)
    try:
        user = create_user(db, payload)
        print(user)
    except Exception:
        import traceback
        traceback.print_exc()
    finally:
        db.rollback()
        db.close()


if __name__ == '__main__':
    main()
