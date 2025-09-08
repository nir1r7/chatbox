from pydantic import BaseModel

class MessageCreate(BaseModel):
    content: str

class MessageRead(BaseModel):
    id: int
    content: str

    model_config = {
        "from_attributes": True
    }