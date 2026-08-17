from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:

    def __init__(self, db: Session):
        self.db = db

    # =========================================================
    # CREATE
    # =========================================================

    def create(
        self,
        notification: Notification,
    ) -> Notification:

        self.db.add(notification)

        self.db.commit()

        self.db.refresh(notification)

        return notification

    # =========================================================
    # GET USER NOTIFICATIONS
    # =========================================================

    def get_by_user(
        self,
        user_id: int,
        unread_only: bool = False,
    ) -> list[Notification]:

        query = (
            self.db.query(Notification)
            .filter(
                Notification.user_id == user_id
            )
        )

        if unread_only:
            query = query.filter(
                Notification.is_read.is_(False)
            )

        return (
            query
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )

    # =========================================================
    # GET BY ID
    # =========================================================

    def get_by_id(
        self,
        notification_id: int,
    ) -> Notification | None:

        return (
            self.db.query(Notification)
            .filter(
                Notification.id == notification_id
            )
            .first()
        )

    # =========================================================
    # MARK AS READ
    # =========================================================

    def mark_as_read(
        self,
        notification: Notification,
    ) -> Notification:

        notification.is_read = True

        self.db.commit()

        self.db.refresh(notification)

        return notification

    # =========================================================
    # MARK ALL AS READ
    # =========================================================

    def mark_all_as_read(
        self,
        user_id: int,
    ) -> int:

        count = (
            self.db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .update(
                {
                    Notification.is_read: True,
                },
                synchronize_session=False,
            )
        )

        self.db.commit()

        return count


    # =========================================================
    # ACTIVE USERS BY ROLE
    # =========================================================

    def get_active_user_ids_by_role(
        self,
        role_name: str,
        exclude_user_id: int | None = None,
    ) -> list[int]:
        """Return active user ids that currently hold a role."""
        from app.models.role import Role
        from app.models.user import User

        query = (
            self.db.query(User.id)
            .join(Role, User.role_id == Role.id)
            .filter(
                Role.name == role_name,
                User.is_active.is_(True),
            )
        )

        if exclude_user_id is not None:
            query = query.filter(User.id != exclude_user_id)

        return [row[0] for row in query.all()]

    # =========================================================
    # DELETE
    # =========================================================

    def delete(
        self,
        notification: Notification,
    ) -> None:

        self.db.delete(notification)

        self.db.commit()