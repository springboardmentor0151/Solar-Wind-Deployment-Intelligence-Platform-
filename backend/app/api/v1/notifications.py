from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from app.api.deps import (
    get_notification_service,
)

from app.auth.dependencies import (
    get_current_user,
)

from app.models.user import User

from app.schemas.notification import (
    NotificationResponse,
)

from app.services.notification_service import (
    NotificationService,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# =========================================================
# GET MY NOTIFICATIONS
# =========================================================

@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_my_notifications(
    unread_only: bool = Query(
        default=False
    ),

    service: NotificationService = Depends(
        get_notification_service
    ),

    current_user: User = Depends(
        get_current_user
    ),
):

    return service.get_my_notifications(
        current_user=current_user,
        unread_only=unread_only,
    )


# =========================================================
# MARK NOTIFICATION AS READ
# =========================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,

    service: NotificationService = Depends(
        get_notification_service
    ),

    current_user: User = Depends(
        get_current_user
    ),
):

    return service.mark_as_read(
        notification_id=notification_id,
        current_user=current_user,
    )


# =========================================================
# MARK ALL AS READ
# =========================================================

@router.patch(
    "/read-all",
)
def mark_all_notifications_as_read(
    service: NotificationService = Depends(
        get_notification_service
    ),

    current_user: User = Depends(
        get_current_user
    ),
):

    return service.mark_all_as_read(
        current_user
    )


# =========================================================
# DELETE NOTIFICATION
# =========================================================

@router.delete(
    "/{notification_id}",
)
def delete_notification(
    notification_id: int,

    service: NotificationService = Depends(
        get_notification_service
    ),

    current_user: User = Depends(
        get_current_user
    ),
):

    return service.delete_notification(
        notification_id=notification_id,
        current_user=current_user,
    )