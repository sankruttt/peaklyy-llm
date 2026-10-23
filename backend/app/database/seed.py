import logging
from sqlalchemy.orm import Session
from app.models.gig import Gig

logger = logging.getLogger(__name__)

INITIAL_GIGS = [
    {
        "title": "Senior Frontend Engineer (Next.js & Design Systems)",
        "description": "Architect and implement high-performance, accessible web interfaces and component libraries for our enterprise SaaS product.",
        "category": "Frontend Development",
        "required_skills": ["React", "Next.js", "TypeScript", "Tailwind CSS"],
        "preferred_skills": ["GraphQL", "Figma", "Web Performance", "Jest"],
        "experience_level": "Senior",
        "eligibility_requirements": ["Minimum 4+ years frontend web engineering", "Demonstrated proficiency with Next.js App Router"],
        "location": "Remote (Global)",
        "work_type": "Contract",
        "compensation": "₹6,000 - ₹8,000 / hr",
        "duration": "6 Months",
        "application_deadline": "Rolling",
        "status": "active"
    },
    {
        "title": "Backend Microservices Architect (Python / FastAPI)",
        "description": "Lead the design and scaling of low-latency asynchronous microservices handling millions of events daily.",
        "category": "Backend Development",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "preferred_skills": ["Redis", "Kubernetes", "Kafka", "AWS"],
        "experience_level": "Senior",
        "eligibility_requirements": ["Minimum 4+ years backend Python development", "Strong relational database optimization skills"],
        "location": "Remote (US/Canada/Europe)",
        "work_type": "Contract",
        "compensation": "₹7,000 - ₹9,000 / hr",
        "duration": "4 Months",
        "application_deadline": "Rolling",
        "status": "active"
    },
    {
        "title": "Full Stack Web Application Developer",
        "description": "Build end-to-end features for a high-growth collaboration platform connecting founders with talent.",
        "category": "Full Stack Development",
        "required_skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs"],
        "preferred_skills": ["Next.js", "Prisma", "Tailwind CSS", "Docker"],
        "experience_level": "Intermediate",
        "eligibility_requirements": ["Minimum 2+ years full-stack experience", "Experience delivering customer-facing web apps"],
        "location": "Remote",
        "work_type": "Contract",
        "compensation": "₹4,500 - ₹6,000 / hr",
        "duration": "3 Months",
        "application_deadline": "Rolling",
        "status": "active"
    },
    {
        "title": "Python Automation & Data Pipeline Engineer",
        "description": "Develop high-throughput web extractors, asynchronous ETL scripts, and data synchronization workers.",
        "category": "Python Development",
        "required_skills": ["Python", "BeautifulSoup", "Pandas", "SQLAlchemy"],
        "preferred_skills": ["Asyncio", "Playwright", "PostgreSQL", "Airflow"],
        "experience_level": "Intermediate",
        "eligibility_requirements": ["2+ years specialized Python scripting and ETL experience"],
        "location": "Remote",
        "work_type": "Freelance",
        "compensation": "₹4,000 - ₹5,500 / hr",
        "duration": "2 Months",
        "application_deadline": "Rolling",
        "status": "active"
    },
    {
        "title": "Machine Learning & LLM Integration Specialist",
        "description": "Fine-tune and deploy open-source models, construct RAG pipelines, and integrate generative AI capabilities into production.",
        "category": "Machine Learning",
        "required_skills": ["Python", "PyTorch", "Hugging Face", "LangChain", "Vector Databases"],
        "preferred_skills": ["vLLM", "Docker", "FastAPI", "Prompt Engineering"],
        "experience_level": "Senior",
        "eligibility_requirements": ["Hands-on experience building generative AI / RAG pipelines in production"],
        "location": "Remote",
        "work_type": "Contract",
        "compensation": "₹7,500 - ₹10,500 / hr",
        "duration": "6 Months",
        "application_deadline": "Rolling",
        "status": "active"
    },
    {
        "title": "Business Intelligence & Data Analyst",
        "description": "Transform multi-source product analytics into actionable executive dashboards, cohort retention models, and churn predictions.",
        "category": "Data Analysis",
        "required_skills": ["SQL", "Python", "Tableau", "Data Analysis"],
        "preferred_skills": ["PostgreSQL", "Power BI", "Snowflake", "dbt"],
        "experience_level": "Intermediate",
        "eligibility_requirements": ["Strong SQL query mastery and data storytelling experience"],
        "location": "Remote",
        "work_type": "Contract",
        "compensation": "₹3,500 - ₹5,000 / hr",
        "duration": "3 Months",
        "application_deadline": "Rolling",
        "status": "active"
    },
    {
        "title": "Product Designer (UI/UX & Interactive Design)",
        "description": "Craft intuitive user journeys, wireframes, high-fidelity prototypes, and design systems for web and mobile products.",
        "category": "UI/UX Design",
        "required_skills": ["Figma", "UI/UX Design", "Wireframing", "Prototyping", "Design Systems"],
        "preferred_skills": ["User Research", "Webflow", "Design Tokens", "HTML/CSS"],
        "experience_level": "Intermediate",
        "eligibility_requirements": ["Portfolio of shipped interactive digital products"],
        "location": "Remote",
        "work_type": "Freelance",
        "compensation": "₹4,000 - ₹6,500 / hr",
        "duration": "3 Months",
        "application_deadline": "Rolling",
        "status": "active"
    },
    {
        "title": "Growth Content Strategist & Technical Copywriter",
        "description": "Create in-depth technical blogs, developer tutorials, newsletters, and conversion-focused landing page copy.",
        "category": "Content and Marketing",
        "required_skills": ["Content Strategy", "Technical Writing", "SEO", "Copywriting"],
        "preferred_skills": ["Developer Marketing", "Social Media", "HubSpot", "Email Campaigns"],
        "experience_level": "Intermediate",
        "eligibility_requirements": ["Demonstrated portfolio of published technical or B2B articles"],
        "location": "Remote",
        "work_type": "Freelance",
        "compensation": "₹3,000 - ₹5,000 / hr",
        "duration": "Ongoing",
        "application_deadline": "Rolling",
        "status": "active"
    },
    {
        "title": "Brand Identity & Graphic Designer",
        "description": "Design visual assets, illustrations, marketing collateral, social banners, and promotional campaign artwork.",
        "category": "Graphic Design",
        "required_skills": ["Graphic Design", "Adobe Illustrator", "Photoshop", "Branding"],
        "preferred_skills": ["Figma", "After Effects", "Motion Graphics", "Typography"],
        "experience_level": "Intermediate",
        "eligibility_requirements": ["Strong creative design portfolio"],
        "location": "Remote",
        "work_type": "Contract",
        "compensation": "₹3,500 - ₹5,500 / hr",
        "duration": "2 Months",
        "application_deadline": "Rolling",
        "status": "active"
    }
]

from app.models.user import User
from app.core.security import hash_password

def seed_database(db: Session):
    """
    Seeds initial gigs and default demo user in PostgreSQL if tables are empty.
    """
    # 1. Seed Demo User
    demo_user = db.query(User).filter(User.email == "alex.mercer@example.com").first()
    if not demo_user:
        logger.info("Seeding default demo user alex.mercer@example.com...")
        user = User(
            name="Alex Mercer",
            email="alex.mercer@example.com",
            hashed_password=hash_password("password123")
        )
        db.add(user)
        db.commit()
        logger.info("Demo user alex.mercer@example.com seeded successfully.")

    # 2. Seed Initial Gigs
    existing_count = db.query(Gig).count()
    if existing_count == 0:
        logger.info("Seeding initial database gigs across all 9 categories...")
        for gig_data in INITIAL_GIGS:
            gig = Gig(**gig_data)
            db.add(gig)
        db.commit()
        logger.info(f"Successfully seeded {len(INITIAL_GIGS)} gigs.")
    else:
        logger.info(f"Database already contains {existing_count} gigs. Skipping seed.")
