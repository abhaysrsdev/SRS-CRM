from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

DataT = TypeVar("DataT")

class ResponseModel(BaseModel, Generic[DataT]):
    success: bool = True
    message: str = ""
    data: Optional[DataT] = None
