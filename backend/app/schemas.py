from pydantic import BaseModel

class MessageCreate(BaseModel):
    content: str

class MessageRead(BaseModel):
    id: int
    content: str

    model_config = {
        "from_attributes": True
    }

class CreateUser(BaseModel):
    name: str
    email: str
    password: str

    model_config = {
        "from_attributes": True
    }

class ReadUser(BaseModel):
    id: int
    name: str
    email: str

    model_config = {
        "from_attributes": True
    }

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
