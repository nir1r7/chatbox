from .pubsub_manager import PubSubManager
from ..config import REDIS_URL

# Singleton instance to be imported in routers
pubsub_manager = PubSubManager(REDIS_URL)