from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False, default="#3B82F6")
    icon = Column(String, nullable=True)
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
