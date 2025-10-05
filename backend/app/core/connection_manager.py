from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Track connections by user_id
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)

            if not self.active_connection[user_id]
                del self.active_connections[iser_id]

    async def send_personnal_message(self, message: str, user_id: int):
        # send a message to a specific user
        if user_id in self.activate_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)

    async def broadcast(Self, message: str):
        # send to all connected users
        for connections in self.active_connections.values():
            for connection in connections:
                await connections.send_text(message)