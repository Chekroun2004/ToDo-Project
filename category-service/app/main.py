from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import init_db
from app.routes.categories import router, seed_global_categories


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_global_categories()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(router, prefix="/api/categories")
