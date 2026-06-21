from app.db.base_class import Base

# Import all models here for Alembic to discover them
from app.models.party import Party, PartyTag
from app.models.product import Product
from app.models.transaction import Transaction
from app.models.interaction import Interaction, VoiceNote
from app.models.sales_order import SalesOrder
from app.models.catalog import CatalogFolder, CatalogImage

