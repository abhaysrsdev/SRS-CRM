import json
import os
import asyncio
from datetime import datetime, timedelta, timezone
import random

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.models.party import Party, PartyTag
from app.models.product import Product
from app.models.transaction import Transaction
from app.models.interaction import Interaction
from app.ai.scoring import calculate_customer_intelligence

# Adjusted path to point to frontend folder
LEDGER_FILE = os.path.join(os.path.dirname(__file__), "../../../Office CRM/ledger_data.json")

indian_states = [
    'Maharashtra', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'Karnataka', 
    'Tamil Nadu', 'Rajasthan', 'Madhya Pradesh', 'Punjab', 'Haryana'
]
colors = ['Red', 'Maroon', 'Pink', 'Peach', 'Navy Blue', 'Bottle Green', 'Mustard', 'Pastel Green', 'Ivory']
price_buckets = ['Under 2000', '2000-5000', '5000-10000', 'Above 10000']

def generate_id(prefix: str, index: int) -> str:
    return f"{prefix}{str(index).zfill(4)}"

async def main():
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=True)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # Create Tags
        tags = [
            PartyTag(id='tag1', name='High Spender', category='Customer Segment'),
            PartyTag(id='tag2', name='Prefers Red', category='Colors'),
            PartyTag(id='tag3', name='Premium Range', category='Price Range'),
            PartyTag(id='tag4', name='Frequent Buyer', category='Willingness To Buy'),
            PartyTag(id='tag5', name='Bridal Wear', category='Categories'),
        ]
        session.add_all(tags)
        
        # Create Products
        products = []
        for i in range(1, 1001):
            stock = random.randint(1, 200)
            category = 'Running Products'
            if stock < 5: category = 'Under 5 Piece'
            elif stock > 100: category = 'High Stock'
            
            color = random.choice(colors)
            def get_local_image(col: str) -> str:
                c = col.lower()
                if 'red' in c: return '/images/red_lehenga.png'
                if 'maroon' in c: return '/images/maroon_lehenga.png'
                if 'pink' in c or 'peach' in c: return '/images/pink_lehenga.png'
                if 'ivory' in c: return '/images/ivory_lehenga.png'
                return '/images/red_lehenga.png'

            p = Product(
                id=generate_id('PRD', i),
                name=f"Bridal Lehenga {i}",
                design_code=f"DZ-{hex(random.randint(1000, 9999))[2:].upper()}",
                image_url=get_local_image(color),
                category=category,
                color=color,
                price_bucket=random.choice(price_buckets),
                demand_score=random.randint(10, 100),
                stock_quantity=stock,
            )
            products.append(p)
        session.add_all(products)

        with open(LEDGER_FILE, 'r') as f:
            ledger_data = json.load(f)

        parties = []
        # skip header row
        for i, row in enumerate(ledger_data[1:], start=1):
            raw_name = row.get("__EMPTY_2", f"Unknown Party {i}")
            name = str(raw_name).strip()
            if not name:
                continue
                
            account_type = str(row.get("__EMPTY", "")).upper().strip()
            if account_type != 'SUNDRY DEBTORS':
                continue

            purchase_count = random.randint(0, 50)
            rev = purchase_count * random.randint(2000, 15000)

            party = Party(
                id=generate_id('CUS', i),
                name=name,
                mobile_number=str(row.get("__EMPTY_8") or row.get("__EMPTY_6") or "+91 Not Available"),
                address=str(row.get("__EMPTY_14", "Address Not Available")),
                state=str(row.get("__EMPTY_13", random.choice(indian_states))),
                business_type=str(row.get("__EMPTY", "Unknown Type")).upper(),
                gst_number=str(row.get("__EMPTY_4", "Not Registered")),
                purchase_frequency=purchase_count,
                revenue_generated=rev,
                last_contacted_date=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 60)),
            )
            
            intelligence = calculate_customer_intelligence(party, [])
            party.party_score = intelligence["score"]
            party.segment = intelligence["segment"]
            party.average_order_value = intelligence["aov"]
            
            # Attach random tag
            party.tags.append(random.choice(tags))
            
            parties.append(party)
        
        session.add_all(parties)

        # Transactions
        transactions = []
        for i in range(1, 5001):
            party = random.choice(parties)
            product = random.choice(products)
            quantity = random.randint(1, 10)
            base_price = 1500 if product.price_bucket == 'Under 2000' else 3500 if product.price_bucket == '2000-5000' else 7500 if product.price_bucket == '5000-10000' else 15000
            
            t = Transaction(
                id=generate_id('PUR', i),
                party_id=party.id,
                product_id=product.id,
                product_name=product.name,
                category=product.category,
                quantity=quantity,
                amount=quantity * base_price,
                date=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 365))
            )
            transactions.append(t)
            
        session.add_all(transactions)
        await session.commit()
        print("Data imported successfully!")

if __name__ == "__main__":
    asyncio.run(main())
