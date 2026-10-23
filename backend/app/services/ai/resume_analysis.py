import logging
import re
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.resume import Resume, AIResumeProfile
from app.schemas.resume import AIResumeProfileStructured
from app.services.ai.llm_service import llm_service
from app.services.ai.skill_extraction import skill_extraction_service

logger = logging.getLogger(__name__)

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"
    "\U0001FA70-\U0001FAFF"
    "]+",
    flags=re.UNICODE
)

def strip_emojis(obj):
    if isinstance(obj, str):
        return EMOJI_PATTERN.sub("", obj).strip()
    elif isinstance(obj, list):
        return [strip_emojis(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: strip_emojis(v) for k, v in obj.items()}
    return obj

RESUME_ANALYSIS_SYSTEM_PROMPT = """
You are an expert AI Resume Analyst and Career Architect for Peaklyy.
Analyze the provided resume thoroughly and return ONLY a valid JSON object matching the exact schema specified below.

Schema requirements:
{
  "name": "Candidate full name",
  "email": "Candidate email if found, or null",
  "professional_summary": "Crisp 3-4 sentence high-impact professional overview",
  "skills": {
    "programming_languages": ["Python", "TypeScript", ...],
    "frameworks": ["FastAPI", "React", ...],
    "libraries": ["Tailwind CSS", ...],
    "databases": ["PostgreSQL", ...],
    "tools": ["Docker", "Git", ...],
    "technical_skills": ["RESTful API Design", "Microservices", ...],
    "soft_skills": ["Cross-functional Leadership", "Communication", ...],
    "proficiencies": [
      {"skill": "Python", "level": "Advanced", "type": "explicit"},
      {"skill": "React", "level": "Intermediate", "type": "explicit"}
    ],
    "strongest_skills": ["Top 3-5 strongest skills"]
  },
  "experience": [
    {
      "role": "Job Title",
      "company_or_org": "Company Name",
      "duration": "e.g. 2022 - Present",
      "responsibilities": ["Key achievement or responsibility with metrics if available"],
      "technologies_used": ["Technologies used in this role"]
    }
  ],
  "education": [
    {
      "institution": "University / College",
      "degree": "Degree (e.g. B.S., M.S.)",
      "field_of_study": "Field (e.g. Computer Science)",
      "graduation_year": "Year"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does and impact",
      "technologies_used": ["Tech used"],
      "skills_demonstrated": ["Skills demonstrated"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuing_organization": "Issuer",
      "date": "Date if available"
    }
  ],
  "interests": ["Technical and career interests"],
  "strengths": ["3-5 prominent candidate strengths backed by their experience"],
  "weaknesses": ["2-4 critical gaps, missing technologies or resume structure flaws"],
  "career_suggestions": ["Actionable career development steps and learning paths"],
  "potential_job_and_gig_categories": [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "Python Development",
    "Machine Learning",
    "Data Analysis",
    "UI/UX Design",
    "Content and Marketing",
    "Graphic Design"
  ],
  "missing_information": ["Missing metrics, contact details, or portfolio links"],
  "resume_improvement_suggestions": ["Specific suggestions to elevate the resume's marketability"]
}

Rules:
1. Do NOT hallucinate skills or qualifications not evidenced in the resume.
2. Mark proficiencies accurately: 'Beginner', 'Intermediate', 'Advanced', or 'Expert'.
3. Distinguish between explicit skills (directly mentioned in text) and inferred skills (evidenced by project context).
4. Return ONLY valid JSON, no markdown intro, no conversational text.
5. SHORT & WELL-STRUCTURED: Keep all executive summaries, strengths, weaknesses, and improvement suggestions brief, crisp, and high-signal (max 2-3 sentences).
6. ABSOLUTELY NO EMOJIS: Do NOT include any emojis anywhere in any JSON strings or keys. Strictly zero emojis.
"""

def calculate_ats_evaluation(data: dict, raw_text: str) -> dict:
    """
    Evaluates resume against standard ATS (Applicant Tracking System) benchmarks:
    - Formatting & Section Compliance (Max 25)
    - Quantifiable Impact & Action Verbs (Max 25)
    - Keyword & Technical Competency Density (Max 30)
    - Brevity & Readability (Max 20)
    """
    formatting_score = 0
    impact_score = 0
    keywords_score = 0
    brevity_score = 0
    feedback = []

    # 1. Formatting & Section Compliance (Max 25 pts)
    if data.get("professional_summary") and len(data["professional_summary"].strip()) > 30:
        formatting_score += 5
    else:
        feedback.append("Add a targeted 2-3 sentence Professional Summary at the top of your resume.")

    experience = data.get("experience") or []
    if len(experience) >= 1:
        formatting_score += 8
    else:
        feedback.append("Ensure employment history includes clear job titles, companies, and date ranges.")

    skills = data.get("skills") or {}
    total_skills = (
        len(skills.get("programming_languages") or []) +
        len(skills.get("frameworks") or []) +
        len(skills.get("databases") or []) +
        len(skills.get("tools") or []) +
        len(skills.get("technical_skills") or [])
    )
    if total_skills >= 5:
        formatting_score += 5
    else:
        feedback.append("Group your technical proficiencies under a dedicated Skills section.")

    education = data.get("education") or []
    if len(education) >= 1:
        formatting_score += 4
    else:
        feedback.append("Include your highest academic degree, institution, and field of study.")

    projects = data.get("projects") or []
    certs = data.get("certifications") or []
    if len(projects) >= 1 or len(certs) >= 1:
        formatting_score += 3

    # 2. Impact Metrics & Action Verbs (Max 25 pts)
    bullet_texts = []
    for exp in experience:
        bullet_texts.extend(exp.get("responsibilities") or [])
    for proj in projects:
        if proj.get("description"):
            bullet_texts.append(proj["description"])
    
    full_text_sample = " ".join(bullet_texts) + " " + raw_text

    ACTION_VERBS = {
        "architected", "engineered", "developed", "optimized", "scaled", "implemented",
        "spearheaded", "designed", "automated", "streamlined", "led", "built", "migrated",
        "reduced", "increased", "delivered", "orchestrated", "refactored", "resolved", "launched"
    }
    words_found = {w.lower() for w in re.findall(r"\b[A-Za-z]{3,}\b", full_text_sample)}
    matched_verbs = ACTION_VERBS.intersection(words_found)
    if len(matched_verbs) >= 6:
        impact_score += 10
    elif len(matched_verbs) >= 3:
        impact_score += 7
    elif len(matched_verbs) >= 1:
        impact_score += 4
    else:
        feedback.append("Begin bullet points with active engineering verbs (e.g., 'Architected', 'Optimized', 'Automated').")

    metric_matches = re.findall(r"\b\d+(?:\.\d+)?(?:%|\+|k|m|x|ms|s|gb|tb|tbps|users|req/s|\$|₹)\b|\$\d+", full_text_sample, re.IGNORECASE)
    if len(metric_matches) >= 5:
        impact_score += 15
    elif len(metric_matches) >= 3:
        impact_score += 11
    elif len(metric_matches) >= 1:
        impact_score += 6
    else:
        feedback.append("Quantify your achievements with measurable metrics (e.g., 'Reduced latency by 40%', 'Scaled to 10k users').")

    # 3. Keyword Density & Hard Skills (Max 30 pts)
    if total_skills >= 12:
        keywords_score += 20
    elif total_skills >= 8:
        keywords_score += 16
    elif total_skills >= 4:
        keywords_score += 11
    else:
        keywords_score += 6
        feedback.append("Increase coverage of specific technical keywords and tools relevant to target engineering roles.")

    proficiencies = skills.get("proficiencies") or []
    if len(proficiencies) >= 4 or len(skills.get("strongest_skills") or []) >= 3:
        keywords_score += 10
    elif len(proficiencies) >= 1:
        keywords_score += 5

    # 4. Brevity & Readability (Max 20 pts)
    raw_word_count = len(raw_text.split()) if raw_text else 0
    if 350 <= raw_word_count <= 1100:
        brevity_score += 12
    elif raw_word_count > 1100:
        brevity_score += 6
        feedback.append("Resume exceeds ideal ATS 1-2 page length; tighten descriptions.")
    elif raw_word_count > 100:
        brevity_score += 7
    else:
        brevity_score += 3

    if bullet_texts:
        avg_len = sum(len(b) for b in bullet_texts) / len(bullet_texts)
        if 40 <= avg_len <= 220:
            brevity_score += 8
        else:
            brevity_score += 4
    else:
        brevity_score += 4

    total_score = min(100, max(10, formatting_score + impact_score + keywords_score + brevity_score))

    if total_score >= 85:
        label = "EXCELLENT ATS FIT"
        tier = "TOP 5%"
    elif total_score >= 70:
        label = "STRONG ATS FIT"
        tier = "TOP 15%"
    elif total_score >= 55:
        label = "MODERATE ATS FIT"
        tier = "MID TIER"
    else:
        label = "NEEDS ATS OPTIMIZATION"
        tier = "EARLY STAGE"

    return {
        "score": total_score,
        "formatting_score": formatting_score,
        "impact_score": impact_score,
        "keywords_score": keywords_score,
        "brevity_score": brevity_score,
        "label": label,
        "tier": tier,
        "feedback": feedback[:3]
    }

class ResumeAnalysisService:
    @staticmethod
    async def analyze_resume(resume: Resume, db: Session) -> AIResumeProfile:
        """
        Analyzes extracted resume text using LLM and saves AIResumeProfile.
        """
        resume.analysis_status = "analyzing"
        db.commit()

        try:
            user_prompt = f"Resume text to analyze:\n\n{resume.extracted_text[:12000]}"
            
            raw_data = await llm_service.generate_structured(
                prompt=user_prompt,
                system_instruction=RESUME_ANALYSIS_SYSTEM_PROMPT
            )
            raw_data = strip_emojis(raw_data)
            
            # Enrich skills
            raw_skills = raw_data.get("skills", {})
            enriched_skills = skill_extraction_service.categorize_and_enrich_skills(
                raw_skills, resume.extracted_text or ""
            )

            # Compute standard ATS Evaluation Rubric
            ats_evaluation = calculate_ats_evaluation(raw_data, resume.extracted_text or "")
            enriched_skills["ats_evaluation"] = ats_evaluation

            raw_data["skills"] = enriched_skills

            # Validate against Pydantic schema
            structured_profile = AIResumeProfileStructured.model_validate(raw_data)

            # Generate semantic text representation for embedding
            summary_for_embedding = f"{structured_profile.professional_summary} " + \
                f"Skills: {', '.join(enriched_skills.get('strongest_skills', []))} " + \
                f"Roles: {', '.join([exp.role for exp in structured_profile.experience])} " + \
                f"Categories: {', '.join(structured_profile.potential_job_and_gig_categories)}"
            
            embedding_vector = await llm_service.get_embedding(summary_for_embedding)

            # Prepare skills dump with ats_evaluation preserved
            skills_payload = structured_profile.skills.model_dump()
            skills_payload["ats_evaluation"] = ats_evaluation

            # Check if profile already exists for this resume
            existing_profile = db.query(AIResumeProfile).filter(AIResumeProfile.resume_id == resume.id).first()
            if not existing_profile:
                profile = AIResumeProfile(
                    user_id=resume.user_id,
                    resume_id=resume.id,
                    professional_summary=structured_profile.professional_summary,
                    skills=skills_payload,
                    experience=[e.model_dump() for e in structured_profile.experience],
                    education=[e.model_dump() for e in structured_profile.education],
                    projects=[p.model_dump() for p in structured_profile.projects],
                    certifications=[c.model_dump() for c in structured_profile.certifications],
                    interests=structured_profile.interests,
                    strengths=structured_profile.strengths,
                    weaknesses=structured_profile.weaknesses,
                    career_suggestions=structured_profile.career_suggestions + structured_profile.potential_job_and_gig_categories,
                    last_analyzed_at=datetime.utcnow()
                )
                db.add(profile)
            else:
                existing_profile.professional_summary = structured_profile.professional_summary
                existing_profile.skills = skills_payload
                existing_profile.experience = [e.model_dump() for e in structured_profile.experience]
                existing_profile.education = [e.model_dump() for e in structured_profile.education]
                existing_profile.projects = [p.model_dump() for p in structured_profile.projects]
                existing_profile.certifications = [c.model_dump() for c in structured_profile.certifications]
                existing_profile.interests = structured_profile.interests
                existing_profile.strengths = structured_profile.strengths
                existing_profile.weaknesses = structured_profile.weaknesses
                existing_profile.career_suggestions = structured_profile.career_suggestions + structured_profile.potential_job_and_gig_categories
                existing_profile.last_analyzed_at = datetime.utcnow()
                profile = existing_profile

            resume.analysis_status = "completed"
            db.commit()
            db.refresh(profile)
            return profile

        except Exception as e:
            logger.error(f"Error analyzing resume {resume.id}: {e}")
            resume.analysis_status = "failed"
            db.commit()
            raise e

resume_analysis_service = ResumeAnalysisService()
