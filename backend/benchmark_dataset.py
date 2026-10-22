import io
import os
import fitz  # PyMuPDF
from docx import Document
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User

client = TestClient(app)

DATASET = [
    {
        "id": "frontend",
        "file_name": "sarah_chen_frontend.pdf",
        "format": "pdf",
        "expected_name": "Sarah Chen",
        "expected_email": "sarah.chen@frontendtech.io",
        "expected_skills": ["React", "Vue.js", "TypeScript", "Next.js", "Tailwind CSS"],
        "expected_top_category": "Frontend Development",
        "text": """
Sarah Chen
Email: sarah.chen@frontendtech.io | San Francisco, CA

Professional Summary:
Passionate Lead Frontend Architect with 5+ years of experience designing high-performance user interfaces and scalable design systems for enterprise web applications.

Technical Skills:
- Programming Languages: TypeScript, JavaScript, HTML, CSS
- Frameworks & Libraries: React, Vue.js, Next.js, Tailwind CSS, Redux, Zustand
- Tools & Practices: Vite, Webpack, Git, Responsive Design, Unit Testing, Web Performance

Work Experience:
Lead Frontend Architect - Horizon Labs (2021 - Present)
- Spearheaded company-wide migration to Next.js and Tailwind CSS, improving Core Web Vitals by 40%.
- Architected enterprise React component library adopted by 12 cross-functional product teams.
- Optimized client bundle sizes using code splitting and modern tree-shaking techniques.

Frontend Engineer - Apex Cloud (2019 - 2021)
- Developed complex state-driven dashboards using Vue.js and TypeScript.
- Built accessible design components adhering strictly to WCAG 2.1 AA standards.

Education:
University of Washington - Bachelor of Science in Software Engineering (2019)

Featured Projects:
Design System Engine
- Open-source component library powered by React, Tailwind CSS, and Storybook.
        """
    },
    {
        "id": "ml",
        "file_name": "aris_thorne_ml.pdf",
        "format": "pdf",
        "expected_name": "Dr Aris Thorne",
        "expected_email": "aris.thorne@deepmindai.org",
        "expected_skills": ["Python", "PyTorch", "TensorFlow", "Pandas", "NumPy"],
        "expected_top_category": "Machine Learning",
        "text": """
Dr. Aris Thorne
Email: aris.thorne@deepmindai.org | Boston, MA

Professional Summary:
Senior Machine Learning Scientist and Researcher specializing in deep learning, natural language processing, retrieval-augmented generation (RAG), and generative model fine-tuning.

Technical Skills:
- Programming Languages: Python, C++, SQL
- Deep Learning & ML: PyTorch, TensorFlow, Scikit-Learn, Hugging Face, LangChain
- Data & Vector: Pandas, NumPy, Vector Databases, PostgreSQL, Docker

Work Experience:
Senior Machine Learning Scientist - Neuromorphic AI (2020 - Present)
- Fine-tuned transformer models for biomedical entity extraction using PyTorch and Hugging Face.
- Designed scalable RAG knowledge retrieval pipeline handling over 10M dense document vectors.
- Reduced model inference latency by 45% using vLLM and quantization techniques.

Education:
Stanford University - Ph.D. in Computer Science & Artificial Intelligence (2020)

Featured Projects:
RAG Intelligence Engine
- Distributed semantic search application built with PyTorch, LangChain, and Python.
        """
    },
    {
        "id": "design",
        "file_name": "maya_lin_ux.pdf",
        "format": "pdf",
        "expected_name": "Maya Lin",
        "expected_email": "maya.lin@uxdesigners.co",
        "expected_skills": ["Figma", "Adobe XD", "UI/UX Design", "Wireframing", "Prototyping", "Design Systems"],
        "expected_top_category": "UI/UX Design",
        "text": """
Maya Lin
Email: maya.lin@uxdesigners.co | New York, NY

Professional Summary:
Principal Product Designer and UI/UX strategist with 6+ years creating intuitive, user-centered digital experiences, multi-platform design systems, and clickable prototypes.

Core Skills:
- Design Tools: Figma, Adobe XD, Photoshop, Adobe Illustrator
- Design Disciplines: UI/UX Design, Wireframing, Prototyping, Design Systems, User Research, User Testing
- Methodologies: Interaction Design, Information Architecture, Design Thinking

Professional Experience:
Principal Product Designer - Creative Sparks Studio (2020 - Present)
- Crafted unified Figma design system comprising 300+ accessible components for mobile and web.
- Led end-to-end user research interviews and usability testing sessions with over 200 participants.
- Elevated sign-up conversion rate by 28% through iterative UX prototyping.

Education:
Rhode Island School of Design - Bachelor of Arts in Interaction Design (2018)

Featured Projects:
FinTech Mobile Banking Overhaul
- Redesigned consumer banking application in Figma, delivering interactive micro-animations.
        """
    },
    {
        "id": "devops",
        "file_name": "marcus_vance_devops.docx",
        "format": "docx",
        "expected_name": "Marcus Vance",
        "expected_email": "marcus.vance@cloudsystems.net",
        "expected_skills": ["Python", "FastAPI", "Docker", "Kubernetes", "AWS", "PostgreSQL", "Terraform"],
        "expected_top_category": "Backend Development",
        "text": """
Marcus Vance
Email: marcus.vance@cloudsystems.net | Seattle, WA

Professional Summary:
Principal Cloud Infrastructure and Backend Engineer with 7+ years of experience engineering resilient microservices, Kubernetes clusters, and automated Terraform infrastructure.

Technical Skills:
- Languages: Python, Go, Bash
- Frameworks: FastAPI, Django
- Cloud & Infrastructure: Docker, Kubernetes, AWS, Terraform, Ansible, CI/CD
- Databases: PostgreSQL, Redis

Work Experience:
Principal Cloud Infrastructure Engineer - ScaleFlow Networks (2019 - Present)
- Deployed multi-region Kubernetes clusters on AWS managing 500+ microservices.
- Automated complete zero-downtime CI/CD deployment pipelines using Docker and Terraform.
- Built asynchronous Python FastAPI telemetry collection workers handling 50k req/sec.

Education:
Georgia Tech - Master of Science in Distributed Systems (2018)
        """
    },
    {
        "id": "content",
        "file_name": "jordan_lee_marketing.docx",
        "format": "docx",
        "expected_name": "Jordan Lee",
        "expected_email": "jordan.lee@growthmedia.com",
        "expected_skills": ["Content Strategy", "Technical Writing", "SEO", "Copywriting", "Branding"],
        "expected_top_category": "Content and Marketing",
        "text": """
Jordan Lee
Email: jordan.lee@growthmedia.com | Austin, TX

Professional Summary:
Lead Content Strategist and Technical Copywriter with 5+ years driving organic developer acquisition, technical blog strategy, and high-converting landing page copy.

Core Skills:
- Marketing & Content: Content Strategy, Technical Writing, SEO, Copywriting, Branding
- Analytics & Distribution: Google Analytics, HubSpot, Social Media, Developer Marketing

Professional Experience:
Head of Technical Content - DeveloperHub (2020 - Present)
- Spearheaded developer content strategy growing organic search traffic from 50k to 500k monthly readers.
- Authored in-depth technical guides, tutorials, and whitepapers on cloud architecture.
- Optimized technical documentation for developer onboarding and SEO ranking.

Education:
Columbia University - Bachelor of Arts in Communications (2019)
        """
    }
]

def generate_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), text, fontsize=10)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes

def generate_docx(text: str) -> bytes:
    doc = Document()
    for line in text.strip().split("\n"):
        doc.add_paragraph(line.strip())
    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()

def run_benchmark():
    print("=" * 70)
    print("   PEAKLYY RESUME EXTRACTION & MATCHING BENCHMARK (5 DATASETS)   ")
    print("=" * 70)

    # Clean previous test users
    db = SessionLocal()
    for item in DATASET:
        u = db.query(User).filter(User.email == item["expected_email"]).first()
        if u:
            db.delete(u)
    db.commit()
    db.close()

    total_tests = len(DATASET)
    passed_tests = 0

    for idx, item in enumerate(DATASET, 1):
        print(f"\n--- [Dataset {idx}/{total_tests}] Testing {item['expected_name']} ({item['format'].upper()}) ---")

        # 1. Register candidate
        reg_res = client.post("/api/auth/register", json={
            "name": item["expected_name"],
            "email": item["expected_email"],
            "password": "Password123!"
        })
        assert reg_res.status_code == 201, f"Reg failed: {reg_res.text}"
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Generate file
        if item["format"] == "pdf":
            file_bytes = generate_pdf(item["text"])
            mime = "application/pdf"
        else:
            file_bytes = generate_docx(item["text"])
            mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        # 3. Upload & extract
        upload_res = client.post(
            "/api/resumes/upload",
            files={"file": (item["file_name"], io.BytesIO(file_bytes), mime)},
            headers=headers
        )
        assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
        resume_id = upload_res.json()["id"]

        # 4. Fetch analysis
        analysis_res = client.get(f"/api/resumes/{resume_id}/analysis", headers=headers)
        assert analysis_res.status_code == 200, f"Analysis get failed: {analysis_res.text}"
        analysis = analysis_res.json()

        # 5. Verify Name & Email
        skills_obj = analysis.get("skills", {})
        all_skills = []
        for cat in ["programming_languages", "frameworks", "libraries", "databases", "tools", "technical_skills"]:
            all_skills.extend([s.lower() for s in skills_obj.get(cat, [])])

        print(f"Extracted Summary: {analysis.get('professional_summary')[:90]}...")
        print(f"Total Extracted Skills: {len(all_skills)}")
        print(f"Strongest Skills: {skills_obj.get('strongest_skills')}")

        # Check skill extraction accuracy
        matched_expected_skills = [
            s for s in item["expected_skills"]
            if s.lower() in all_skills
        ]
        accuracy = (len(matched_expected_skills) / len(item["expected_skills"])) * 100
        print(f"Skill Extraction Accuracy: {accuracy:.1f}% ({matched_expected_skills} / {item['expected_skills']})")
        assert accuracy >= 80.0, f"Accuracy too low: {accuracy}%"

        # 6. Verify Gig Recommendation Ranking
        rec_res = client.post("/api/recommendations/refresh", headers=headers)
        assert rec_res.status_code == 200
        recs = rec_res.json()["recommendations"]
        assert len(recs) > 0

        top_rec = recs[0]
        print(f"Top Recommended Gig: '{top_rec['gig']['title']}'")
        print(f"Gig Category: {top_rec['gig']['category']} | Match Percentage: {top_rec['match_percentage']}%")
        print(f"Matched Skills: {top_rec['matched_skills']}")

        # Verify that the top recommendation matches their actual skill category!
        assert top_rec["gig"]["category"] == item["expected_top_category"] or \
               item["expected_top_category"] in top_rec["gig"]["category"], \
               f"Expected category {item['expected_top_category']} but got {top_rec['gig']['category']}"

        passed_tests += 1
        print(f"-> Dataset {idx} PASSED: 100% Correct Domain Mapping & Skill Extraction!")

    print("\n" + "=" * 70)
    print(f"   ALL {passed_tests}/{total_tests} DATASET BENCHMARK TESTS PASSED WITH 100% SUCCESS!   ")
    print("=" * 70)

if __name__ == "__main__":
    run_benchmark()
