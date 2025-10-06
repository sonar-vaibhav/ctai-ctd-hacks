from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

# Pydantic models for MongoDB collections

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class ProjectModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
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
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MaterialModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    project_id: PyObjectId
    name: str
    category: str
    quantity: int
    unit: str
    cost: int
    confidence: float
    vendor_assigned: Optional[PyObjectId] = None  # Reference to assigned vendor
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class VendorModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
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
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ProcurementItemModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
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
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PredictionModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    project_id: PyObjectId
    materials: List[MaterialModel]
    total_cost: int
    confidence: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ChatMessageModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    project_id: PyObjectId
    message: str
    is_user: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    username: str
    password: str
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}