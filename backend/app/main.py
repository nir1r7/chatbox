from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, delete
from .db.session import AsyncSessionLocal, engine, Base
from .db import models
import asyncio
from .routers import messages, auth, ws
from .dependencies import get_db
from .config import FRONTEND_URL
from .db.models import Room

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://127.0.0.1:3000",
                   "http://localhost:5173",
                   FRONTEND_URL
                   ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# function to create tables
async def init_db():
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # clear db
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created or already exist!")

async def create_default_rooms():
    async with AsyncSessionLocal() as session:
        for room_name, room_id in {"general": 1, "devs": 2, "random": 3}.items():
            result = await session.execute(select(Room).where(Room.id == room_id))
            room = result.scalar_one_or_none()
            if not room:
                session.add(Room(id=room_id, name=room_name))
        await session.commit()

@app.on_event("startup")
async def on_startup():
    await init_db()
    await create_default_rooms()

@app.get("/")
async def root():
    return {"message": "ts from fastapi"}

app.include_router(messages.router)
app.include_router(auth.router)
app.include_router(ws.router)
