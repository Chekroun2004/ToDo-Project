from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    color: str
    icon: Optional[str] = None
    user_id: Optional[str] = None
    created_at: datetime
