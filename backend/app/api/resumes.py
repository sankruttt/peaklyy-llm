import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.resume import Resume, AIResumeProfile
from app.schemas.resume import ResumeOut, AIResumeProfileOut
from app.services.ai.resume_parser import resume_parser
from app.services.ai.resume_analysis import resume_analysis_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file extension
    filename = file.filename or "resume"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["pdf", "docx", "doc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF and DOCX files are supported."
        )

    # Read and check size
    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Secure storage directory
    os.makedirs(settings.UPLOAD_STORAGE_PATH, exist_ok=True)
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex}_{filename}"
    saved_path = os.path.join(settings.UPLOAD_STORAGE_PATH, unique_filename)

    with open(saved_path, "wb") as f:
        f.write(content)

    # Extract text safely
    try:
        extracted_text = resume_parser.extract_text(saved_path, ext)
    except Exception as e:
        # Clean up file on extraction failure
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Text extraction failed: {str(e)}"
        )

    # Save Resume record
    resume = Resume(
        user_id=current_user.id,
        file_name=filename,
        file_path=saved_path,
        file_type=ext,
        extracted_text=extracted_text,
        analysis_status="pending"
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Trigger LLM analysis
    try:
        await resume_analysis_service.analyze_resume(resume, db)
    except Exception as e:
        # We don't fail the upload if LLM has temporary hiccup, status becomes 'failed'
        pass

    db.refresh(resume)
    return ResumeOut.model_validate(resume)

@router.get("", response_model=List[ResumeOut])
def get_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )
    return [ResumeOut.model_validate(r) for r in resumes]

@router.get("/{resume_id}/analysis", response_model=AIResumeProfileOut)
def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    profile = db.query(AIResumeProfile).filter(AIResumeProfile.resume_id == resume.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI profile not yet generated for this resume."
        )
    return AIResumeProfileOut.model_validate(profile)

@router.post("/{resume_id}/analyze", response_model=AIResumeProfileOut)
async def trigger_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    try:
        profile = await resume_analysis_service.analyze_resume(resume, db)
        return AIResumeProfileOut.model_validate(profile)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
