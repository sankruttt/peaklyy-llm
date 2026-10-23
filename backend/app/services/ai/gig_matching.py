import re
import math
import logging
from typing import Dict, List, Any, Tuple, Set
from app.models.gig import Gig
from app.models.resume import AIResumeProfile
from app.services.ai.skill_extraction import CANONICAL_SKILL_MAP

logger = logging.getLogger(__name__)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.5
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    val = dot / (norm_a * norm_b)
    return max(0.0, min(1.0, (val + 1.0) / 2.0))

def normalize_skill(s: str) -> str:
    cleaned = s.strip().lower()
    if cleaned in CANONICAL_SKILL_MAP:
        return CANONICAL_SKILL_MAP[cleaned].lower()
    stripped = re.sub(r"[\.\-_/]", " ", cleaned)
    stripped = re.sub(r"\s+", " ", stripped).strip()
    return CANONICAL_SKILL_MAP.get(stripped, stripped).lower()

EXCLUDE_SHORT_TOKENS = {"c", "r", "go", "js", "ts", "ui", "ai", "sql", "git", "aws", "gcp"}

def is_skill_matched(target_skill: str, candidate_skills: Set[str]) -> bool:
    """
    Checks if target_skill matches any candidate skill via exact, canonical, or verified word token overlap.
    Guards strictly against single-letter or partial substring false matches (e.g. 'c' matching 'Docker').
    """
    target_clean = target_skill.strip().lower()
    target_norm = normalize_skill(target_clean)

    # 1. Exact or canonical match
    for cs in candidate_skills:
        cs_clean = cs.strip().lower()
        cs_norm = normalize_skill(cs_clean)
        if target_clean == cs_clean or target_norm == cs_norm:
            return True
        if target_clean == cs_norm or target_norm == cs_clean:
            return True

    # 2. Word boundary / token match (only for tokens >= 4 chars not in EXCLUDE_SHORT_TOKENS)
    target_tokens = [t for t in re.split(r"[\s\-_/]+", target_clean) if t]
    for cs in candidate_skills:
        cs_clean = cs.strip().lower()
        cs_tokens = [t for t in re.split(r"[\s\-_/]+", cs_clean) if t]
        
        # Avoid Java matching JavaScript or vice-versa
        if ("java" in target_tokens and "javascript" in cs_tokens) or ("java" in cs_tokens and "javascript" in target_tokens):
            continue

        if target_clean not in EXCLUDE_SHORT_TOKENS and len(target_clean) >= 4:
            pattern = r"(?:\b|_)" + re.escape(target_clean) + r"(?:\b|_)"
            if re.search(pattern, cs_clean):
                return True

        if target_norm not in EXCLUDE_SHORT_TOKENS and len(target_norm) >= 4:
            pattern = r"(?:\b|_)" + re.escape(target_norm) + r"(?:\b|_)"
            if re.search(pattern, cs_clean) or re.search(pattern, normalize_skill(cs_clean)):
                return True

        if cs_clean not in EXCLUDE_SHORT_TOKENS and len(cs_clean) >= 4:
            pattern = r"(?:\b|_)" + re.escape(cs_clean) + r"(?:\b|_)"
            if re.search(pattern, target_clean):
                return True

    return False

class GigMatchingEngine:
    @staticmethod
    def evaluate_match(
        profile: AIResumeProfile,
        gig: Gig,
        profile_embedding: List[float],
        gig_embedding: List[float]
    ) -> Dict[str, Any]:
        """
        Evaluates candidate profile against a gig using calibrated hybrid matching logic grounded in resume skills.
        """
        skills_data = profile.skills or {}
        # Collect all candidate skills into lowercase set and map
        candidate_skills_set = set()
        for cat in ["programming_languages", "frameworks", "libraries", "databases", "tools", "technical_skills", "soft_skills", "strongest_skills"]:
            for s in skills_data.get(cat, []):
                cleaned = s.strip().lower()
                canonical = CANONICAL_SKILL_MAP.get(cleaned, cleaned).lower()
                candidate_skills_set.add(cleaned)
                candidate_skills_set.add(canonical)

        # Collect proficiencies
        for p in skills_data.get("proficiencies", []):
            if isinstance(p, dict) and "skill" in p:
                cleaned = p["skill"].strip().lower()
                canonical = CANONICAL_SKILL_MAP.get(cleaned, cleaned).lower()
                candidate_skills_set.add(cleaned)
                candidate_skills_set.add(canonical)

        # Collect technologies evidenced in work experiences
        for exp in (profile.experience or []):
            if isinstance(exp, dict):
                for tech in exp.get("technologies_used", []):
                    cleaned = tech.strip().lower()
                    canonical = CANONICAL_SKILL_MAP.get(cleaned, cleaned).lower()
                    candidate_skills_set.add(cleaned)
                    candidate_skills_set.add(canonical)

        # Collect technologies and skills evidenced in project work
        for proj in (profile.projects or []):
            if isinstance(proj, dict):
                for tech in proj.get("technologies_used", []):
                    cleaned = tech.strip().lower()
                    canonical = CANONICAL_SKILL_MAP.get(cleaned, cleaned).lower()
                    candidate_skills_set.add(cleaned)
                    candidate_skills_set.add(canonical)
                for s in proj.get("skills_demonstrated", []):
                    cleaned = s.strip().lower()
                    canonical = CANONICAL_SKILL_MAP.get(cleaned, cleaned).lower()
                    candidate_skills_set.add(cleaned)
                    candidate_skills_set.add(canonical)

        # 1. Structured Skill Matching
        req_skills = gig.required_skills or []
        pref_skills = gig.preferred_skills or []
        
        matched_skills = []
        missing_skills = []

        if not req_skills:
            req_ratio = 1.0
            req_matched_count = 1
            total_req = 1
        else:
            req_matched_count = 0
            for r_skill in req_skills:
                if is_skill_matched(r_skill, candidate_skills_set):
                    matched_skills.append(r_skill)
                    req_matched_count += 1
                else:
                    missing_skills.append(r_skill)
            total_req = len(req_skills)
            req_ratio = req_matched_count / total_req
        
        pref_matched_count = 0
        for p_skill in pref_skills:
            if is_skill_matched(p_skill, candidate_skills_set):
                matched_skills.append(p_skill)
                pref_matched_count += 1

        # Skill score computation
        if pref_skills:
            pref_ratio = pref_matched_count / len(pref_skills)
            skill_score = (req_ratio * 80.0) + (pref_ratio * 20.0)
        else:
            skill_score = req_ratio * 100.0
        skill_score = min(100.0, max(0.0, skill_score))

        # 2. Experience Compatibility
        exp_list = profile.experience or []
        num_roles = len(exp_list)
        gig_level = (gig.experience_level or "Intermediate").lower()
        
        if "lead" in gig_level:
            target_roles = 4
        elif "senior" in gig_level:
            target_roles = 3
        elif "entry" in gig_level:
            target_roles = 1
        else:
            target_roles = 2

        if num_roles >= target_roles:
            exp_score = 95.0
        elif num_roles >= target_roles - 1:
            exp_score = 75.0
        elif num_roles > 0:
            exp_score = 50.0
        else:
            exp_score = 20.0

        # 3. Project Relevance
        projects = profile.projects or []
        if not projects:
            proj_score = 30.0 if req_matched_count > 0 else 10.0
        else:
            matched_proj = 0
            for proj in projects:
                techs = [t.lower() for t in proj.get("technologies_used", [])]
                if any(any(m.lower() in t or t in m.lower() for t in techs) for m in matched_skills):
                    matched_proj += 1
            proj_score = min(100.0, (matched_proj / max(1, len(projects))) * 75.0 + (25.0 if matched_proj > 0 else 10.0))

        # 4. Interest & Category Alignment
        interests = [i.lower() for i in (profile.interests or [])]
        categories = [c.lower() for c in (profile.career_suggestions or [])]
        gig_cat = gig.category.lower()
        
        if any(gig_cat in i or i in gig_cat for i in interests + categories):
            interest_score = 95.0
        elif req_ratio >= 0.5:
            interest_score = 75.0
        else:
            interest_score = 35.0

        # 5. Education Compatibility
        education = profile.education or []
        edu_score = 85.0 if education else 60.0

        # 6. Semantic Vector Similarity
        semantic_sim = cosine_similarity(profile_embedding, gig_embedding)

        # 7. Weighted Composite Calculation (Skills: 50%, Experience: 20%, Projects: 15%, Domain: 10%, Education: 5%)
        composite_score = (
            (skill_score * 0.50) +
            (exp_score * 0.20) +
            (proj_score * 0.15) +
            (interest_score * 0.10) +
            (edu_score * 0.05)
        )
        
        # Factor in semantic vector similarity (90% composite + 10% semantic embedding)
        final_percentage = (composite_score * 0.90) + (semantic_sim * 100.0 * 0.10)
        
        # 8. Strict Eligibility Guardrails
        if req_matched_count == 0:
            final_percentage = min(20.0, final_percentage)
            eligibility_status = "Ineligible"
        elif req_ratio < 0.40:
            final_percentage = min(40.0, final_percentage)
            eligibility_status = "Ineligible"
        elif req_ratio < 0.70:
            eligibility_status = "Partially Eligible"
        else:
            eligibility_status = "Eligible"

        match_percentage = round(max(5.0, min(99.0, final_percentage)), 1)

        return {
            "match_percentage": match_percentage,
            "eligibility_status": eligibility_status,
            "matched_skills": list(set(matched_skills)),
            "missing_skills": list(set(missing_skills)),
            "composite_score": composite_score,
            "req_matched_ratio": req_matched_count / total_req
        }

gig_matching_engine = GigMatchingEngine()
