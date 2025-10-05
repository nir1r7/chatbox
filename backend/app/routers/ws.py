from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from core.connections_manager import ConnectionManager

from ..db import models
from ..dependencies import get_db, get_current_user

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, current_user: models.User = Depends(get_current_user)):
    user_id = get_current_user.id
    
    await manager.connection(websocket, user_id)
    try:
        while True:
            data = await websocket.recieve_text()
            # temporary
            await manager.send_personal_message(f"yo dumb ahh wrote: {data}", user_id)
            await manager.broadcast(f"User id {user_id} sasys: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)