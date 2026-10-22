from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.gig import Gig
from app.schemas.gig import GigOut, GigCreate, GigUpdate
from app.core.security import get_current_user

router = APIRouter(prefix="/gigs", tags=["Gigs"])

@router.get("", response_model=List[GigOut])
def list_gigs(
    category: Optional[str] = Query(None, description="Filter by category"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    search: Optional[str] = Query(None, description="Search term in title or description"),
    db: Session = Depends(get_db)
):
    query = db.query(Gig).filter(Gig.status == "active")
    
    if category:
        query = query.filter(Gig.category.ilike(f"%{category}%"))
    if experience_level:
        query = query.filter(Gig.experience_level.ilike(f"%{experience_level}%"))
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Gig.title.ilike(search_fmt),
                Gig.description.ilike(search_fmt)
            )
        )
    
    gigs = query.order_by(Gig.created_at.desc()).all()
    return [GigOut.model_validate(g) for g in gigs]

@router.get("/{gig_id}", response_model=GigOut)
def get_gig(gig_id: int, db: Session = Depends(get_db)):
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found.")
    return GigOut.model_validate(gig)

@router.post("", response_model=GigOut, status_code=status.HTTP_201_CREATED)
def create_gig(
    gig_in: GigCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    gig = Gig(**gig_in.model_dump())
    db.add(gig)
    db.commit()
    db.refresh(gig)
    return GigOut.model_validate(gig)

@router.put("/{gig_id}", response_model=GigOut)
def update_gig(
    gig_id: int,
    gig_in: GigUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found.")
    
    update_data = gig_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gig, field, value)
    
    db.commit()
    db.refresh(gig)
    return GigOut.model_validate(gig)

@router.delete("/{gig_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gig(
    gig_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found.")
    db.delete(gig)
    db.commit()
    return None
