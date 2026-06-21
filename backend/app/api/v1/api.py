from fastapi import APIRouter
from app.api.v1.endpoints import parties, products, transactions, interactions, analytics, tags, sales_orders, catalog

api_router = APIRouter()
api_router.include_router(parties.router, prefix="/customers", tags=["customers"]) # mapped to customers to match frontend usage or we can map frontend to /parties
api_router.include_router(parties.router, prefix="/parties", tags=["parties"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(transactions.router, prefix="/purchases", tags=["transactions"]) # frontend uses /purchases
api_router.include_router(interactions.router, prefix="/interactions", tags=["interactions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(tags.router, prefix="/tags", tags=["tags"])
api_router.include_router(sales_orders.router, prefix="/sales-orders", tags=["sales-orders"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])

