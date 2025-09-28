from pydantic import BaseModel


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

class MessageCreate(BaseModel):
    content: str

class MessageReadWithUser(BaseModel):
    id: int
    content: str
    user: ReadUserBasic

    model_config = {
        "from_attributes": True
    }

class MessageReadWithoutUser(BaseModel):
    id: int
    content: str

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
