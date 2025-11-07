import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket
import redis.asyncio as redis
from ..config import REDIS_URL


class PubSubManager:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis = redis.from_url(redis_url, decode_responses=True)
        # Each room maps to a set of connected WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    # ---------------------------
    # Connection management
    # ---------------------------
    async def connect(self, room: str, websocket: WebSocket):
        """Add a client to a specific chat room."""
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = set()
            # Start listening for this room when the first user connects
            asyncio.create_task(self._subscribe_room(room))
        self.active_connections[room].add(websocket)

    async def disconnect(self, room: str, websocket: WebSocket):
        """Remove a client from the chat room."""
        if room in self.active_connections:
            self.active_connections[room].discard(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]

    # ---------------------------
    # Redis Publish/Subscribe
    # ---------------------------
    async def publish_message(self, room: str, message: dict):
        """Publish a message to Redis for this chat room."""
        await self.redis.publish(f"chatroom:{room}", json.dumps(message))

    async def _subscribe_room(self, room: str):
        """Listen for messages from Redis and broadcast to connected clients."""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(f"chatroom:{room}")
        print(f"Subscribed to Redis channel: chatroom:{room}")

        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await self._broadcast(room, data)

    async def _broadcast(self, room: str, message: dict):
        """Send message to all clients connected to this room."""
        if room not in self.active_connections:
            return
        websockets = list(self.active_connections[room])
        for ws in websockets:
            try:
                await ws.send_json(message)
            except Exception:
                await self.disconnect(room, ws)
