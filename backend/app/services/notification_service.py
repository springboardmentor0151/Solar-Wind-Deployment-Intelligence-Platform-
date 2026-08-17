from fastapi import HTTPException, status

from app.models.notification import Notification
from app.models.user import User

from app.repositories.notification_repository import (
    NotificationRepository,
)

from app.schemas.notification import (
    NotificationCreate,
)


class NotificationService:

    def __init__(
        self,
        repository: NotificationRepository,
    ):
        self.repository = repository

    # =========================================================
    # CREATE NOTIFICATION
    # =========================================================

    def create_notification(
        self,
        notification_data: NotificationCreate,
    ) -> Notification:

        notification = Notification(
            title=notification_data.title,
            message=notification_data.message,
            notification_type=(
                notification_data.notification_type
            ),
            severity=notification_data.severity,
            user_id=notification_data.user_id,
            site_id=notification_data.site_id,
            project_id=notification_data.project_id,
            is_read=False,
        )

        return self.repository.create(
            notification
        )

    # =========================================================
    # GET USER NOTIFICATIONS
    # =========================================================

    def get_my_notifications(
        self,
        current_user: User,
        unread_only: bool = False,
    ):

        return self.repository.get_by_user(
            user_id=current_user.id,
            unread_only=unread_only,
        )

    # =========================================================
    # MARK NOTIFICATION AS READ
    # =========================================================

    def mark_as_read(
        self,
        notification_id: int,
        current_user: User,
    ):

        notification = (
            self.repository.get_by_id(
                notification_id
            )
        )

        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if (
            notification.user_id
            != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have access "
                    "to this notification"
                ),
            )

        return self.repository.mark_as_read(
            notification
        )

    # =========================================================
    # MARK ALL AS READ
    # =========================================================

    def mark_all_as_read(
        self,
        current_user: User,
    ):

        count = (
            self.repository.mark_all_as_read(
                current_user.id
            )
        )

        return {
            "message": (
                "All notifications marked as read"
            ),
            "updated_count": count,
        }

    # =========================================================
    # DELETE NOTIFICATION
    # =========================================================

    def delete_notification(
        self,
        notification_id: int,
        current_user: User,
    ):

        notification = (
            self.repository.get_by_id(
                notification_id
            )
        )

        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if (
            notification.user_id
            != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have access "
                    "to this notification"
                ),
            )

        self.repository.delete(
            notification
        )

        return {
            "message": "Notification deleted"
        }