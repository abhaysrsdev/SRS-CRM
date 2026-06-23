import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

engine = create_async_engine('postgresql+asyncpg://postgres.kosjaeupqasimmtqefnp:Abhay%40332145@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres')

async def run():
    async with engine.connect() as conn:
        try:
            res = await conn.execute(text('SELECT COUNT(*) FROM parties'))
            print('COUNT:', res.scalar())
        except Exception as e:
            print('ERROR:', e)

asyncio.run(run())
