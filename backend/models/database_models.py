from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

# Pydantic models for MongoDB collections

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate)
            ])
        ])

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class ProjectModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    project_type: str
    size: str
    state: str
    city: str
    volume: int
    status: str
    is_predicted: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MaterialModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    project_id: PyObjectId
    name: str
    category: str
    quantity: int
    unit: str
    cost: int
    confidence: float
    vendor_assigned: Optional[PyObjectId] = None  # Reference to assigned vendor
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VendorModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    project_id: Optional[PyObjectId] = None  # Add reference to project
    material_id: Optional[PyObjectId] = None  # Add reference to material
    material_name: Optional[str] = None  # Add material name for easier querying
    name: str
    website: Optional[str]
    rating: Optional[float]
    rating_count: Optional[int]
    item_name: Optional[str]
    item_price: Optional[str]
    item_unit: Optional[str]
    gst_verified: bool = False
    trustseal_verified: bool = False
    member_since: Optional[str]
    location: str
    contact: Optional[str]
    email: Optional[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProcurementItemModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    project_id: PyObjectId
    material_id: PyObjectId
    vendor_id: Optional[PyObjectId]
    order_by: datetime
    delivery_start: datetime
    delivery_end: datetime
    status: str  # critical, warning, on-track
    notes: Optional[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PredictionModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    project_id: PyObjectId
    materials: List[MaterialModel]
    total_cost: int
    confidence: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessageModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    project_id: PyObjectId
    message: str
    is_user: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    username: str
    password: str