from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    message: str = Field(
        ...,
        min_length=1,
    )

    notification_type: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    severity: str = Field(
        default="info",
        pattern="^(info|warning|critical)$",
    )

    user_id: int

    site_id: int | None = None

    project_id: int | None = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    title: str

    message: str

    notification_type: str

    severity: str

    is_read: bool

    user_id: int

    site_id: int | None

    project_id: int | None

    created_at: datetime

    updated_at: datetime


class NotificationReadResponse(BaseModel):
    message: str