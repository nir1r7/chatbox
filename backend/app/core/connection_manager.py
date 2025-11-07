from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Track connections by room_name -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_name: str):
        await websocket.accept()
        if room_name not in self.active_connections:
            self.active_connections[room_name] = []
        self.active_connections[room_name].append(websocket)

    def disconnect(self, websocket: WebSocket, room_name: str):
        if room_name in self.active_connections:
            try:
                self.active_connections[room_name].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[room_name]:
                del self.active_connections[room_name]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, room_name: str, message: str):
        if room_name not in self.active_connections:
            return
        for connection in self.active_connections[room_name]:
            try:
                await connection.send_text(message)
            except:
                pass  # ignore broken connections

manager = ConnectionManager()
