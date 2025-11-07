from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ..core.connection_manager import manager
from ..core.pubsub_instance import pubsub_manager
from ..config import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
import json

router = APIRouter(prefix="/ws", tags=["websockets"])

@router.websocket("/chat/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str, token: str = Query(...)):
    """
    Handles WebSocket connections for a specific chat room.
    Uses Redis Pub/Sub for cross-instance communication.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except JWTError:
        await websocket.close()
        return

    # Connect user locally
    await manager.connect(websocket, user_id)

    # Subscribe to the Redis room channel
    await pubsub_manager.connect(room_name, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_obj = json.loads(data)
                if "type" not in message_obj:
                    message_obj["type"] = "message"
                message_obj["room"] = room_name

                # Publsh to Redis so all servers broadcast it
                await pubsub_manager.publish_message(room_name, message_obj)

            except json.JSONDecodeError:
                print("Invalid message received, ignoring")

    except WebSocketDisconnect:
        # Disconnect from both local and Redis tracking
        manager.disconnect(websocket, user_id)
        await pubsub_manager.disconnect(room_name, websocket)

