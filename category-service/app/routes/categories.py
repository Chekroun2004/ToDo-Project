import os
import uuid
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, AsyncSessionLocal
from app.models import Category
from app.schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()

NGINX_URL = os.getenv("NGINX_URL", "http://nginx")

GLOBAL_CATEGORIES = [
    {"name": "Travail", "color": "#3B82F6", "icon": "💼"},
    {"name": "Personnel", "color": "#10B981", "icon": "🏠"},
    {"name": "Urgent", "color": "#EF4444", "icon": "🚨"},
    {"name": "Shopping", "color": "#F59E0B", "icon": "🛒"},
    {"name": "Santé", "color": "#8B5CF6", "icon": "💊"},
]


async def verify_jwt(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "error": "Authorization header manquant", "code": 401},
        )
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{NGINX_URL}/api/auth/verify",
                headers={"Authorization": authorization},
                timeout=10.0,
            )
        if response.status_code != 200:
            raise HTTPException(
                status_code=401,
                detail={"success": False, "error": "Token invalide ou expiré", "code": 401},
            )
        data = response.json()
        return {"userId": data.get("userId") or data.get("data", {}).get("userId"),
                "email": data.get("email") or data.get("data", {}).get("email")}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "error": "Impossible de vérifier le token", "code": 401},
        )


async def seed_global_categories():
    async with AsyncSessionLocal() as session:
        try:
            for cat_data in GLOBAL_CATEGORIES:
                result = await session.execute(
                    select(Category).where(
                        Category.name == cat_data["name"],
                        Category.user_id.is_(None),
                    )
                )
                existing = result.scalar_one_or_none()
                if not existing:
                    new_cat = Category(
                        id=str(uuid.uuid4()),
                        name=cat_data["name"],
                        color=cat_data["color"],
                        icon=cat_data["icon"],
                        user_id=None,
                        created_at=datetime.utcnow(),
                    )
                    session.add(new_cat)
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise e


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "category-service"}


@router.get("")
async def get_categories(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_jwt),
):
    try:
        user_id = current_user["userId"]
        result = await db.execute(
            select(Category).where(
                or_(Category.user_id.is_(None), Category.user_id == user_id)
            )
        )
        categories = result.scalars().all()

        global_cats = [c for c in categories if c.user_id is None]
        user_cats = [c for c in categories if c.user_id is not None]
        ordered = global_cats + user_cats

        return {
            "success": True,
            "data": [CategoryResponse.model_validate(c).model_dump() for c in ordered],
            "message": "Catégories récupérées",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": str(e), "code": 500},
        )


@router.post("")
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_jwt),
):
    try:
        user_id = current_user["userId"]
        new_cat = Category(
            id=str(uuid.uuid4()),
            name=body.name,
            color=body.color or "#3B82F6",
            icon=body.icon,
            user_id=user_id,
            created_at=datetime.utcnow(),
        )
        db.add(new_cat)
        await db.commit()
        await db.refresh(new_cat)
        return {
            "success": True,
            "data": CategoryResponse.model_validate(new_cat).model_dump(),
            "message": "Catégorie créée",
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": str(e), "code": 500},
        )


@router.put("/{category_id}")
async def update_category(
    category_id: str,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_jwt),
):
    try:
        user_id = current_user["userId"]
        result = await db.execute(select(Category).where(Category.id == category_id))
        category = result.scalar_one_or_none()

        if not category:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "Catégorie introuvable", "code": 404},
            )

        if category.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail={"success": False, "error": "Accès interdit : vous ne pouvez pas modifier cette catégorie", "code": 403},
            )

        if body.name is not None:
            category.name = body.name
        if body.color is not None:
            category.color = body.color
        if body.icon is not None:
            category.icon = body.icon

        await db.commit()
        await db.refresh(category)
        return {
            "success": True,
            "data": CategoryResponse.model_validate(category).model_dump(),
            "message": "Catégorie mise à jour",
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": str(e), "code": 500},
        )


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_jwt),
):
    try:
        user_id = current_user["userId"]
        result = await db.execute(select(Category).where(Category.id == category_id))
        category = result.scalar_one_or_none()

        if not category:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "Catégorie introuvable", "code": 404},
            )

        if category.user_id is None:
            raise HTTPException(
                status_code=403,
                detail={"success": False, "error": "Accès interdit : impossible de supprimer une catégorie globale", "code": 403},
            )

        if category.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail={"success": False, "error": "Accès interdit : vous ne pouvez pas supprimer cette catégorie", "code": 403},
            )

        await db.delete(category)
        await db.commit()
        return {
            "success": True,
            "data": None,
            "message": "Catégorie supprimée",
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": str(e), "code": 500},
        )
