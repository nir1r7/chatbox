from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, desc, delete

from ..db import models
from ..schemas import MessageCreate, MessageRead
from ..dependencies import get_db

router = APIRouter(
    prefix="/api/messages",
    tags=["messages"]
)

@router.get("/", response_model = list[MessageRead])
async def get_messages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Message).order_by(asc(models.Message.id)))
    return result.scalars().all()

@router.post("/", response_model = MessageRead)
async def create_message(message: MessageCreate, db: AsyncSession = Depends(get_db)):
    new_message = models.Message(content=message.content)
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    return new_message

@router.delete("/{message_id}")
async def delete_message(message_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(models.Message).where(models.Message.id == message_id))
    await db.commit()