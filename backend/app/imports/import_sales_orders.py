import json
import os
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.models.sales_order import SalesOrder

SALES_ORDER_FILE = os.path.join(os.path.dirname(__file__), "../../../Office CRM/sales_order_data.json")

def parse_excel_date(val) -> datetime:
    if not val:
        return datetime.now(timezone.utc)
    try:
        # Excel date offset (days since 1899-12-30)
        days = int(float(val))
        return datetime(1899, 12, 30, tzinfo=timezone.utc) + timedelta(days=days)
    except (ValueError, TypeError):
        try:
            return datetime.fromisoformat(str(val)).replace(tzinfo=timezone.utc)
        except Exception:
            return datetime.now(timezone.utc)

async def main():
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    if not os.path.exists(SALES_ORDER_FILE):
        print(f"Error: Sales order file not found at {SALES_ORDER_FILE}")
        return

    with open(SALES_ORDER_FILE, 'r') as f:
        sales_order_data = json.load(f)

    async with AsyncSessionLocal() as session:
        # Clear existing sales orders
        from sqlalchemy import delete
        await session.execute(delete(SalesOrder))
        
        orders = []
        # Skip header row (index 0 is header labels)
        for i, row in enumerate(sales_order_data[1:], start=1):
            cust_name = row.get("__EMPTY_1")
            if not cust_name or str(cust_name).strip() == "":
                continue

            order_id = f"SO{str(i).zfill(4)}"
            date_val = parse_excel_date(row.get("__EMPTY"))
            
            order = SalesOrder(
                id=order_id,
                date=date_val,
                customer_name=str(row.get("__EMPTY_1")).strip(),
                gst_number=str(row.get("__EMPTY_2", "")).strip(),
                broker=str(row.get("__EMPTY_3", "DIRECT")).strip(),
                order_no=int(row.get("__EMPTY_4", 0)),
                city_name=str(row.get("__EMPTY_5", "")).strip(),
                catalog=str(row.get("__EMPTY_6", "")).strip(),
                vol=str(row.get("__EMPTY_7", "")).strip(),
                product_code=str(row.get("__EMPTY_8", "")).strip(),
                packing=str(row.get("__EMPTY_9", "")).strip(),
                color=str(row.get("__EMPTY_10", "")).strip(),
                order_pcs=int(row.get("__EMPTY_11", 0)),
                disp_pcs=int(row.get("__EMPTY_12", 0)),
                bal_pcs=int(row.get("__EMPTY_13", 0)),
                rate=float(row.get("__EMPTY_14", 0.0)),
                amount=float(row.get("__EMPTY_15", 0.0)),
                over_due_days=int(row.get("__EMPTY_16", 0)),
                due_days=int(row.get("__EMPTY_17", 0)),
                sales_man=str(row.get("__EMPTY_18", "")).strip()
            )
            orders.append(order)

        session.add_all(orders)
        await session.commit()
        print(f"Successfully imported {len(orders)} sales orders into the SQLite database!")

if __name__ == "__main__":
    asyncio.run(main())
