import os
import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserUpdate, UserResponse

router = APIRouter()

NGINX_URL = os.getenv("NGINX_URL", "http://nginx")


async def verify_jwt(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "error": "Authorization header missing", "code": 401},
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{NGINX_URL}/api/auth/verify",
                headers={"Authorization": authorization},
                timeout=10.0,
            )
    except httpx.RequestError:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "error": "Auth service unreachable", "code": 401},
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "error": "Invalid or expired token", "code": 401},
        )

    body = response.json()
    data = body.get("data", {})

    if not data.get("valid", False):
        raise HTTPException(
            status_code=401,
            detail={"success": False, "error": "Token is not valid", "code": 401},
        )

    return {"userId": data.get("userId"), "email": data.get("email")}


# Health check — declared BEFORE /{user_id} to avoid route conflict
@router.get("/health")
async def health():
    return {"status": "ok", "service": "user-service"}


# Internal route — no JWT required
@router.post("/internal")
async def create_user_internal(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.id == payload.id))
        existing = result.scalar_one_or_none()

        if existing:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": {"id": existing.id, "email": existing.email, "name": existing.name},
                    "message": "Profil déjà existant",
                },
            )

        user = User(id=payload.id, email=payload.email, name=payload.name)
        db.add(user)
        await db.commit()
        await db.refresh(user)

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "data": {"id": user.id, "email": user.email, "name": user.name},
                "message": "Profil créé",
            },
        )
    except Exception as exc:
        await db.rollback()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(exc), "code": 500},
        )


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    token_data: dict = Depends(verify_jwt),
):
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "Utilisateur non trouvé", "code": 404},
            )

        user_data = UserResponse.model_validate(user).model_dump(mode="json")
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": user_data, "message": "Profil récupéré"},
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(exc), "code": 500},
        )


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    token_data: dict = Depends(verify_jwt),
):
    if token_data.get("userId") != user_id:
        return JSONResponse(
            status_code=403,
            content={"success": False, "error": "Accès interdit", "code": 403},
        )

    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "Utilisateur non trouvé", "code": 404},
            )

        if payload.name is not None:
            user.name = payload.name
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url
        if payload.bio is not None:
            user.bio = payload.bio

        await db.commit()
        await db.refresh(user)

        user_data = UserResponse.model_validate(user).model_dump(mode="json")
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": user_data, "message": "Profil mis à jour"},
        )
    except Exception as exc:
        await db.rollback()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(exc), "code": 500},
        )


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    token_data: dict = Depends(verify_jwt),
):
    if token_data.get("userId") != user_id:
        return JSONResponse(
            status_code=403,
            content={"success": False, "error": "Accès interdit", "code": 403},
        )

    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "Utilisateur non trouvé", "code": 404},
            )

        await db.delete(user)
        await db.commit()

        return JSONResponse(
            status_code=200,
            content={"success": True, "data": None, "message": "Compte supprimé"},
        )
    except Exception as exc:
        await db.rollback()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(exc), "code": 500},
        )
