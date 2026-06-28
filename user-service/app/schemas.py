from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    id: str
    email: str
    name: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class APIResponse(BaseModel):
    success: bool
    data: Any = None
    message: str = ""
    error: str = ""
    code: int = 200
