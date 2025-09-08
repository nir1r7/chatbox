from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import asyncio

from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

class Base(DeclarativeBase):
    pass

engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def test_connection():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Database connection successful!")

if __name__ == "__main__":
    asyncio.run(test_connection())