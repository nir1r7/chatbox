from typing import Dict, Set
from fastapi import WebSocket
import redis.asyncio as redis
import json

class PubSubManager:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, room: str, websocket: WebSocket):
        if room not in self.active_connections:
            self.active_connections[room] = set()
        self.active_connections[room].add(websocket)

    async def disconnect(self, room: str, websocket: WebSocket):
        if room in self.active_connections:
            self.active_connections[room].discard(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]

    async def publish_message(self, room: str, message: dict):
        """Publish message to Redis channel"""
        await self.redis.publish(room, json.dumps(message))

    async def broadcast(self, room: str, message: dict):
        """Broadcast to WebSocket connections in this room"""
        if room in self.active_connections:
            for websocket in self.active_connections[room]:
                try:
                    await websocket.send_json(message)
                except:
                    pass