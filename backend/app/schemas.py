from pydantic import BaseModel
from datetime import datetime


# =========================
# Room schemas
# =========================

class RoomCreate(BaseModel):
    name: str

class RoomRead(BaseModel):
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }


# =========================
# User schemas
# =========================

class CreateUser(BaseModel):
    name: str
    email: str
    password: str

    model_config = {
        "from_attributes": True
    }

class ReadUserBasic(BaseModel):
    id: int
    name: str
    email: str

    model_config = {
        "from_attributes": True
    }

class ReadUserWithMessages(BaseModel):
    id: int
    name: str
    email: str
    messages: list["MessageReadWithUser"] = []  # Forward reference

    model_config = {
        "from_attributes": True
    }


# =========================
# Message schemas
# =========================

# Message schemas
class MessageCreate(BaseModel):
    content: str
    room_id: int  # Added this field to ensure room is provided

class MessageReadWithUser(BaseModel):
    id: int
    content: str
    user: ReadUserBasic
    room: RoomRead | None = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }



# =========================
# Auth schemas
# =========================

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


ReadUserWithMessages.update_forward_refs()
