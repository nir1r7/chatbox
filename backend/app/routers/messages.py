from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from sqlalchemy.orm import selectinload
import json

from ..db import models
from ..schemas import MessageCreate, MessageReadWithUser
from ..dependencies import get_db, get_current_user
from ..core.connection_manager import manager
from ..core.pubsub_instance import pubsub_manager

router = APIRouter(
    prefix="/api/messages",
    tags=["messages"]
)

@router.get("/", response_model=list[MessageReadWithUser])
async def get_messages(
    room_id: int = Query(..., description="ID of the room to fetch messages from"),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(models.Message)
            .options(selectinload(models.Message.user), selectinload(models.Message.room))
            .where(models.Message.room_id == room_id)
            .order_by(asc(models.Message.id))
        )
        messages = result.scalars().all()
        return messages
    except Exception as e:
        print(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")


@router.post("/", response_model=MessageReadWithUser)
async def create_message(
    message: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if message.room_id is None:
        raise HTTPException(status_code=400, detail="room_id is required")

    try:
        new_message = models.Message(
            content=message.content,
            user_id=current_user.id,
            room_id=message.room_id,
        )
        db.add(new_message)
        await db.commit()
        await db.refresh(new_message)

        # Ensure related user & room are loaded for serialization
        await db.refresh(new_message, attribute_names=["user", "room"])

        # Broadcast via Redis pub/sub so all clients (even other servers) receive it
        event = {
            "type": "message",
            "id": new_message.id,
            "content": new_message.content,
            "user": {
                "id": new_message.user.id,
                "name": new_message.user.name,
                "email": new_message.user.email,
            },
            "room": new_message.room.name if new_message.room else "general",
            "created_at": str(new_message.created_at)
        }
        await pubsub_manager.publish_message(event["room"], event)

        return new_message
    except Exception as e:
        print(f"Error creating message: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create message")


@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = await db.execute(select(models.Message).where(models.Message.id == message_id))
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")

    await db.delete(message)
    await db.commit()

    delete_event = json.dumps({
        "type": "delete",
        "message_id": message_id
    })
    await manager.broadcast(delete_event)

    return {"detail": "Message deleted"}
