from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class PhotoOut(BaseModel):
    id: int
    title: str
    description: str | None
    image_url: str
    uploaded_at: datetime
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class PhotoUpdate(BaseModel):
    title: str
    description: str | None = None


# ── Community ──

class CommentOut(BaseModel):
    id: int
    text: str
    created_at: datetime
    user_id: int
    username: str  # populated manually
    post_id: int

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    text: str


class CommunityPostOut(BaseModel):
    id: int
    caption: str | None
    image_url: str
    created_at: datetime
    user_id: int
    username: str  # populated manually
    photo_id: int | None
    comments: list[CommentOut] = []

    model_config = ConfigDict(from_attributes=True)
