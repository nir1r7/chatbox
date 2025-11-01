from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, desc, delete
from sqlalchemy.orm import selectinload

from ..db import models
from ..schemas import MessageCreate, MessageReadWithUser
from ..dependencies import get_db, get_current_user
from ..core.connection_manager import manager
import json

router = APIRouter(
    prefix="/api/messages",
    tags=["messages"]
)

@router.get("/", response_model = list[MessageReadWithUser])
async def get_messages(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(models.Message)
            .options(selectinload(models.Message.user))  # Load user relationship
            .order_by(asc(models.Message.id))
        )
        return result.scalars().all()
    except Exception as e:
        print(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@router.post("/", response_model = MessageReadWithUser)
async def create_message(message: MessageCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        new_message = models.Message(content = message.content, user_id = current_user.id)
        db.add(new_message)
        await db.commit()
        await db.refresh(new_message)
        return new_message
    except Exception as e:
        print(f"Error creating message: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create messages")

@router.delete("/{message_id}")
async def delete_message(message_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Message).where(models.Message.id == message_id))
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this message")

    await db.delete(message)
    await db.commit()

    delete_event = json.dumps({
        "type": "delete",
        "message_id": message_id
    })
    await manager.broadcast(delete_event)

    return {"detail": "Message deleted"}