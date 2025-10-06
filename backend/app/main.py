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

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
async def root():
    return {"message": "ts from fastapi"}

app.include_router(messages.router)
app.include_router(auth.router)
app.include_router(ws.router)
