from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ..core.connection_manager import manager
from jose import JWTError, jwt
from ..config import SECRET_KEY, ALGORITHM
import json

router = APIRouter(prefix="/ws", tags=["websockets"])

@router.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except JWTError:
        await websocket.close()
        return

    await manager.connect(websocket, user_id)

    try:
        while True:
            data = await websocket.receive_text()
            # Expect saved message object from frontend
            try:
                message_obj = json.loads(data)
                if "type" not in message_obj:
                    message_obj["type"] = "message"
                await manager.broadcast(json.dumps(message_obj))
            except json.JSONDecodeError:
                print("Invalid message received, ignoring")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
