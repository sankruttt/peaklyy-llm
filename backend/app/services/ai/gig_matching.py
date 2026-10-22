import math
import logging
from typing import Dict, List, Any, Tuple
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

class GigMatchingEngine:
    @staticmethod
    def evaluate_match(
        profile: AIResumeProfile,
        gig: Gig,
        profile_embedding: List[float],
        gig_embedding: List[float]
    ) -> Dict[str, Any]:
        """
        Evaluates candidate profile against a gig using hybrid matching logic.
        """
        skills_data = profile.skills or {}
        # Collect all candidate skills into lowercase set and map
        candidate_skills_set = set()
        proficiency_map = {}
        for cat in ["programming_languages", "frameworks", "libraries", "databases", "tools", "technical_skills", "soft_skills"]:
            for s in skills_data.get(cat, []):
                cleaned = s.strip()
                canonical = CANONICAL_SKILL_MAP.get(cleaned.lower(), cleaned)
                candidate_skills_set.add(canonical.lower())
                candidate_skills_set.add(cleaned.lower())

        for p in skills_data.get("proficiencies", []):
            if isinstance(p, dict):
                sname = p.get("skill", "").strip().lower()
                proficiency_map[sname] = p.get("level", "Intermediate")

        # 1. Structured Skill Matching
        req_skills = gig.required_skills or []
        pref_skills = gig.preferred_skills or []
        
        matched_skills = []
        missing_skills = []

        req_matched_count = 0
        for r_skill in req_skills:
            clean_req = r_skill.strip()
            can_req = CANONICAL_SKILL_MAP.get(clean_req.lower(), clean_req)
            if can_req.lower() in candidate_skills_set or clean_req.lower() in candidate_skills_set:
                matched_skills.append(clean_req)
                req_matched_count += 1
            else:
                missing_skills.append(clean_req)

        pref_matched_count = 0
        for p_skill in pref_skills:
            clean_pref = p_skill.strip()
            can_pref = CANONICAL_SKILL_MAP.get(clean_pref.lower(), clean_pref)
            if can_pref.lower() in candidate_skills_set or clean_pref.lower() in candidate_skills_set:
                matched_skills.append(clean_pref)
                pref_matched_count += 1

        total_req = max(1, len(req_skills))
        skill_score = (req_matched_count / total_req) * 85
        if pref_skills:
            skill_score += (pref_matched_count / len(pref_skills)) * 15
        skill_score = min(100.0, skill_score)

        # 2. Experience Compatibility
        exp_list = profile.experience or []
        num_roles = len(exp_list)
        gig_level = (gig.experience_level or "Intermediate").lower()
        
        if "lead" in gig_level:
            req_exp_weight = 4
        elif "senior" in gig_level:
            req_exp_weight = 3
        elif "entry" in gig_level:
            req_exp_weight = 1
        else:
            req_exp_weight = 2  # Intermediate

        if num_roles >= req_exp_weight:
            exp_score = 95.0
        elif num_roles >= req_exp_weight - 1:
            exp_score = 75.0
        else:
            exp_score = 45.0

        # 3. Project Relevance
        projects = profile.projects or []
        proj_score = 50.0
        if projects:
            matched_proj = 0
            for proj in projects:
                techs = [t.lower() for t in proj.get("technologies_used", [])]
                if any(m.lower() in techs for m in matched_skills):
                    matched_proj += 1
            proj_score = min(100.0, 50.0 + (matched_proj * 25.0))

        # 4. Interest & Category Alignment
        interests = [i.lower() for i in (profile.interests or [])]
        categories = [c.lower() for c in (profile.career_suggestions or [])]
        gig_cat = gig.category.lower()
        
        interest_score = 60.0
        if any(gig_cat in i or i in gig_cat for i in interests + categories):
            interest_score = 95.0

        # 5. Education Compatibility
        education = profile.education or []
        edu_score = 80.0 if education else 60.0

        # 6. Semantic Similarity
        semantic_sim = cosine_similarity(profile_embedding, gig_embedding)

        # 7. Eligibility Checking
        if len(req_skills) > 0 and (req_matched_count / total_req) >= 0.70:
            eligibility_status = "Eligible"
        elif len(req_skills) > 0 and (req_matched_count / total_req) >= 0.40:
            eligibility_status = "Partially Eligible"
        else:
            eligibility_status = "Ineligible"

        # Weighted calculation (Suggested: 40% skills, 20% exp, 15% proj, 15% interest, 10% edu)
        composite_score = (
            (skill_score * 0.40) +
            (exp_score * 0.20) +
            (proj_score * 0.15) +
            (interest_score * 0.15) +
            (edu_score * 0.10)
        )
        
        # Factor in semantic vector similarity
        final_percentage = (composite_score * 0.85) + (semantic_sim * 100.0 * 0.15)
        
        if eligibility_status == "Ineligible":
            final_percentage = min(48.0, final_percentage)
        
        match_percentage = round(max(15.0, min(99.0, final_percentage)), 1)

        return {
            "match_percentage": match_percentage,
            "eligibility_status": eligibility_status,
            "matched_skills": list(set(matched_skills)),
            "missing_skills": list(set(missing_skills)),
            "composite_score": composite_score,
            "req_matched_ratio": req_matched_count / total_req
        }

gig_matching_engine = GigMatchingEngine()
