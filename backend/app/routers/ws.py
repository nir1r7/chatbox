from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from ..config import SECRET_KEY, ALGORITHM
from ..core.connection_manager import manager
from ..core.pubsub_instance import pubsub_manager
import asyncio
import json

router = APIRouter(prefix="/ws", tags=["websockets"])

@router.websocket("/chat/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str, token: str = Query(...)):
    # Authenticate
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, room_name)
    
    # Subscribe to Redis pub/sub for this room
    async def redis_listener():
        """Listen for Redis pub/sub messages and forward to WebSocket"""
        pubsub = pubsub_manager.redis.pubsub()
        await pubsub.subscribe(room_name)
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await websocket.send_json(data)
        except Exception as e:
            print(f"Redis listener error: {e}")
        finally:
            await pubsub.unsubscribe(room_name)
            await pubsub.close()

    # Start Redis listener in background
    listener_task = asyncio.create_task(redis_listener())

    try:
        while True:
            # Receive messages from client (if needed for typing indicators, etc.)
            data = await websocket.receive_text()
            # Optional: handle client messages here
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_name)
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass