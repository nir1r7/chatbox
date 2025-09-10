from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from passlib.context import CryptContext
import re

from ..db import models
from ..schemas import CreateUser, ReadUser
from ..dependencies import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

email_regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'

router = APIRouter(
    prefix="/api/auth",
    tags=["users"]
)

@router.get("/users", response_model=list[ReadUser])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).order_by(asc(models.User.id)))
    return result.scalars().all()

@router.post("/signup", response_model=ReadUser)
async def signup(user: CreateUser, db: AsyncSession = Depends(get_db)):
    if not re.match(email_regex, user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    existing_user = await db.execute(
        select(models.User).where(models.User.email == user.email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)

    new_user = models.User(name = user.name, email = user.email, password = hashed_password)
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user



