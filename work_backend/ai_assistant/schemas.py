from pydantic import BaseModel
from typing import List, Optional, Dict

class ChatMessage(BaseModel):
    user_id: int
    message: str

class AIResponse(BaseModel):
    reply: str
    action: Optional[str] = None
    data: Optional[Dict] = None