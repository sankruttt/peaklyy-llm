import re
from typing import Dict, List, Set, Any

CANONICAL_SKILL_MAP = {
    "reactjs": "React",
    "react.js": "React",
    "react": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "docker": "Docker",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud",
    "azure": "Azure",
    "py": "Python",
    "python": "Python",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "js": "JavaScript",
    "javascript": "JavaScript",
    "golang": "Go",
    "go": "Go",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "graphql": "GraphQL",
    "rest": "REST APIs",
    "restful": "REST APIs",
    "rest api": "REST APIs",
    "ci/cd": "CI/CD",
    "git": "Git",
    "figma": "Figma",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
}

class SkillExtractionService:
    @staticmethod
    def canonicalize_skill(skill_name: str) -> str:
        clean = skill_name.strip()
        key = clean.lower()
        return CANONICAL_SKILL_MAP.get(key, clean)

    @staticmethod
    def normalize_skill_list(skills: List[str]) -> List[str]:
        seen = set()
        result = []
        for s in skills:
            can = SkillExtractionService.canonicalize_skill(s)
            if can.lower() not in seen:
                seen.add(can.lower())
                result.append(can)
        return result

    @staticmethod
    def categorize_and_enrich_skills(parsed_skills_data: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
        """
        Enriches and validates the skills structure produced by the LLM.
        """
        lower_text = raw_text.lower()
        
        # Ensure all standard keys exist
        categories = [
            "programming_languages",
            "frameworks",
            "libraries",
            "databases",
            "tools",
            "technical_skills",
            "soft_skills"
        ]
        
        enriched = {}
        all_skills: List[str] = []
        
        for cat in categories:
            raw_list = parsed_skills_data.get(cat, [])
            if isinstance(raw_list, list):
                norm = SkillExtractionService.normalize_skill_list(raw_list)
                enriched[cat] = norm
                all_skills.extend(norm)
            else:
                enriched[cat] = []

        # Validate proficiencies
        proficiencies = parsed_skills_data.get("proficiencies", [])
        valid_proficiencies = []
        proficiency_map = {}

        if isinstance(proficiencies, list):
            for item in proficiencies:
                if isinstance(item, dict):
                    name = SkillExtractionService.canonicalize_skill(item.get("skill", ""))
                    level = item.get("level", "Intermediate")
                    if level not in ["Beginner", "Intermediate", "Advanced", "Expert"]:
                        level = "Intermediate"
                    
                    # Check if skill was explicitly mentioned in raw text
                    is_explicit = name.lower() in lower_text
                    skill_type = "explicit" if is_explicit else "inferred"
                    
                    entry = {
                        "skill": name,
                        "level": level,
                        "type": skill_type
                    }
                    valid_proficiencies.append(entry)
                    proficiency_map[name.lower()] = entry

        # Ensure any top skills have a proficiency entry
        for s in all_skills:
            if s.lower() not in proficiency_map:
                is_explicit = s.lower() in lower_text
                valid_proficiencies.append({
                    "skill": s,
                    "level": "Intermediate",
                    "type": "explicit" if is_explicit else "inferred"
                })

        enriched["proficiencies"] = valid_proficiencies
        
        # Strongest skills: pick Advanced/Expert or first few technical skills
        strongest = parsed_skills_data.get("strongest_skills", [])
        if isinstance(strongest, list) and strongest:
            enriched["strongest_skills"] = SkillExtractionService.normalize_skill_list(strongest)[:6]
        else:
            top_from_prof = [p["skill"] for p in valid_proficiencies if p.get("level") in ["Advanced", "Expert"]]
            enriched["strongest_skills"] = top_from_prof[:6] or all_skills[:6]

        return enriched

skill_extraction_service = SkillExtractionService()
