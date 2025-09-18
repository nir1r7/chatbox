from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
import re

from ..db import models
from ..schemas import CreateUser, ReadUser, LoginRequest, TokenResponse
from ..dependencies import get_db
from ..config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
email_regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)

@router.get("/users", response_model=list[ReadUser])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).order_by(asc(models.User.id)))
    users = result.scalars().all()
    return users

@router.post("/signup", response_model = TokenResponse)
async def signup(user: CreateUser, db: AsyncSession = Depends(get_db)):
    if not re.match(email_regex, user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    db_user = await db.execute(
        select(models.User).where(models.User.email == user.email)
    )
    if db_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)

    new_user = models.User(name = user.name, email = user.email, password = hashed_password)
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model = TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.email == credentials.email));
    user = result.scalar_one_or_none();

    if not user or not pwd_context.verify(credentials.password, user.password):
        raise HTTPException(status_code = 401, detail="Invalid email or password")

    access_token_expires = timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data = {"sub": str(user.id)}, expires_delta = access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


