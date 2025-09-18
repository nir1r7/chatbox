from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import jwt

from .db.session import AsyncSessionLocal
from .db import models
from .config import SECRET_KEY, ALGORITHM


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code = 401, detail = "Invalid token. User doesn't exist")
    except jwt.PyJWTError:
        raise HTTPException(status_code = 401, detail = "Invalid token.")

    result = await db.execute(select(models.user).where(models.User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is none:
        raise HTTPException(Status_code = 401, detail = "User not found")


