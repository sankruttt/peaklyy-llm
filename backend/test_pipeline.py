import io
import fitz
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, Base, engine
from app.models.user import User
from app.models.gig import Gig

client = TestClient(app)

def test_full_pipeline():
    print("\n--- [1] Testing Health Endpoint ---")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health check OK:", res.json())

    print("\n--- [2] Testing User Registration & Authentication ---")
    test_email = "alex.coder@example.com"
    # Clean previous user if exists
    db = SessionLocal()
    existing_user = db.query(User).filter(User.email == test_email).first()
    if existing_user:
        db.delete(existing_user)
        db.commit()
    db.close()

    reg_payload = {
        "name": "Alex Mercer",
        "email": test_email,
        "password": "Password123!"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201, f"Registration failed: {res.text}"
    auth_data = res.json()
    token = auth_data["access_token"]
    user_id = auth_data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Registered user ID: {user_id}, Name: {auth_data['user']['name']}")

    # Check /me
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email
    print("User /me verification passed.")

    print("\n--- [3] Testing Gigs Database Retrieval ---")
    gigs_res = client.get("/api/gigs")
    assert gigs_res.status_code == 200
    gigs = gigs_res.json()
    print(f"Retrieved {len(gigs)} active database gigs.")
    assert len(gigs) >= 9, "Expected at least 9 seeded gigs"

    print("\n--- [4] Generating & Uploading Real PDF Resume ---")
    # Create an in-memory PDF using PyMuPDF
    doc = fitz.open()
    page = doc.new_page()
    resume_text = """
    Alex Mercer
    Email: alex.mercer@example.com | San Francisco, CA
    Professional Summary:
    Full Stack Software Engineer with 3+ years of experience building scalable backend APIs and responsive modern web applications.
    
    Technical Skills:
    - Programming Languages: Python, TypeScript, JavaScript
    - Frameworks & Libraries: FastAPI, React, Next.js, Node.js, Tailwind CSS
    - Databases: PostgreSQL, Redis
    - Developer Tools: Docker, Git, Linux, REST APIs

    Professional Experience:
    Software Engineer - Apex Cloud Solutions (2022 - Present)
    - Developed and scaled asynchronous RESTful APIs using Python and FastAPI.
    - Designed interactive client dashboards using React, Next.js, and TypeScript.
    - Improved database query performance in PostgreSQL by 35%.

    Projects:
    Enterprise Workflow Engine
    - Implemented a background task worker with Python and Docker.
    - Built frontend management portal using Next.js and Tailwind CSS.

    Education:
    Bachelor of Science in Computer Science, University of California (2022)
    """
    page.insert_text((50, 50), resume_text, fontsize=11)
    pdf_bytes = doc.write()
    doc.close()

    files = {
        "file": ("alex_mercer_resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    }
    upload_res = client.post("/api/resumes/upload", files=files, headers=headers)
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
    resume_data = upload_res.json()
    resume_id = resume_data["id"]
    print(f"Uploaded resume ID: {resume_id}, Status: {resume_data['analysis_status']}")

    print("\n--- [5] Verifying Structured AI Resume Analysis ---")
    analysis_res = client.get(f"/api/resumes/{resume_id}/analysis", headers=headers)
    assert analysis_res.status_code == 200, f"Analysis get failed: {analysis_res.text}"
    analysis = analysis_res.json()
    print("Professional Summary:", analysis.get("professional_summary")[:80] + "...")
    print("Extracted Skills Keys:", list(analysis.get("skills", {}).keys()))
    print("Strongest Skills:", analysis.get("skills", {}).get("strongest_skills"))

    print("\n--- [6] Testing AI Gig Recommendations Engine ---")
    rec_res = client.post("/api/recommendations/refresh", headers=headers)
    assert rec_res.status_code == 200, f"Recommendation refresh failed: {rec_res.text}"
    rec_data = rec_res.json()
    print(f"Generated {rec_data['count']} recommendations.")
    recs = rec_data["recommendations"]
    assert len(recs) > 0

    top_rec = recs[0]
    print(f"Top Recommended Gig: {top_rec['gig']['title']}")
    print(f"Category: {top_rec['gig']['category']}")
    print(f"Match Score: {top_rec['match_percentage']}% ({top_rec['eligibility_status']})")
    print(f"Matched Skills: {top_rec['matched_skills']}")
    print(f"Missing Skills: {top_rec['missing_skills']}")
    print(f"AI Reason: {top_rec['recommendation_reason']}")

    print("\n--- [7] Testing Context-Aware Mawa AI Chatbot ---")
    chat_payload = {
        "message": "Which gigs match my skills best, and what should I learn next?"
    }
    chat_res = client.post("/api/ai/chat", json=chat_payload, headers=headers)
    assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
    chat_resp = chat_res.json()
    conv_id = chat_resp["conversation_id"]
    reply_1 = chat_resp["message"]["content"]
    print(f"Conversation ID: {conv_id}")
    print("Mawa Initial Reply:\n", reply_1[:250], "...\n")

    # Follow-up message testing memory
    follow_payload = {
        "conversation_id": conv_id,
        "message": "Why was the top gig recommended over the others?"
    }
    follow_res = client.post("/api/ai/chat", json=follow_payload, headers=headers)
    assert follow_res.status_code == 200
    reply_2 = follow_res.json()["message"]["content"]
    print("Mawa Follow-up Reply:\n", reply_2[:250], "...\n")

    print("\n🎉 ALL P0 & P1 BACKEND PIPELINE TESTS PASSED SUCCESSFULLY! 🎉\n")

if __name__ == "__main__":
    test_full_pipeline()
