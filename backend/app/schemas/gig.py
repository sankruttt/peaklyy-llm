from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

class GigBase(BaseModel):
    title: str
    description: str
    category: str
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    experience_level: str = "Intermediate"
    eligibility_requirements: list[str] = Field(default_factory=list)
    location: str = "Remote"
    work_type: str = "Contract"
    compensation: str
    duration: str = "3 Months"
    application_deadline: Optional[str] = None
    status: str = "active"

class GigCreate(GigBase):
    pass

class GigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    required_skills: Optional[list[str]] = None
    preferred_skills: Optional[list[str]] = None
    experience_level: Optional[str] = None
    eligibility_requirements: Optional[list[str]] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    compensation: Optional[str] = None
    duration: Optional[str] = None
    application_deadline: Optional[str] = None
    status: Optional[str] = None

class GigOut(GigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
