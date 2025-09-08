from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, delete
from .db.session import AsyncSessionLocal, engine, Base
from .db import models
from .schemas import MessageCreate, MessageRead
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# function to create tables
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created or already exist!")

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
async def root():
    return {"message": "ts from fastapi"}

@app.get("/api/messages", response_model=list[MessageRead])
async def get_messages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Message).order_by(asc(models.Message.id)))
    return result.scalars().all()

@app.post("/api/messages", response_model=MessageRead)
async def create_message(message: MessageCreate, db: AsyncSession = Depends(get_db)):
    new_message = models.Message(content=message.content)
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    return new_message

@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(models.Message).where(models.Message.id == message_id))
    await db.commit()

