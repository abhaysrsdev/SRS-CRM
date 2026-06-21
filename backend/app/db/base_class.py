from typing import Any
from sqlalchemy.orm import as_declarative, declared_attr

@as_declarative()
class Base:
    id: Any
    __name__: str
    metadata: Any
    
    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> Any:
        return cls.__name__.lower()
