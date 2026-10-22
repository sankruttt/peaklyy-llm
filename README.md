# PEAKLYY – AI-Powered Gig Recommendation & Career Assistant

Peaklyy is an end-to-end, independent AI career platform that extracts structured intelligence from PDF and DOCX resumes, computes dynamic weighted compatibility matches against real PostgreSQL database gigs, and provides a contextual, personalized AI Career Assistant.

---

## 1. Project Architecture

The application is structured into a modern decoupled architecture:

```
peaklyy/
├── frontend/                     # Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
│   ├── app/
│   │   ├── layout.tsx            # Global dark red & black theme + AuthProvider + Navbar + Footer
│   │   ├── page.tsx              # 1. Landing Page
│   │   ├── register/page.tsx     # 2. Registration Page
│   │   ├── login/page.tsx        # 3. Login Page
│   │   ├── dashboard/page.tsx    # 4. User Dashboard
│   │   ├── resume/
│   │   │   ├── upload/page.tsx   # 5. Resume Upload Page
│   │   │   └── analysis/page.tsx # 6. Resume Analysis Page
│   │   ├── recommendations/
│   │   │   └── page.tsx          # 7. Gig Recommendations Page
│   │   ├── gigs/
│   │   │   └── [id]/page.tsx     # 8. Gig Details Page
│   │   ├── assistant/page.tsx    # 9. AI Career Assistant Page
│   │   └── profile/page.tsx      # 10. User Profile Page
│   ├── components/               # Navbar, Footer, Reusable UI Components
│   ├── context/                  # AuthContext (JWT session management)
│   ├── services/                 # Centralized API service (api.ts)
│   └── types/                    # Domain TypeScript interfaces
│
├── backend/                      # Python, FastAPI, SQLAlchemy 2, Pydantic 2
│   ├── app/
│   │   ├── api/                  # Authentication, Resumes, Gigs, Recommendations, Chat
│   │   ├── core/                 # Config, Security (bcrypt + JWT)
│   │   ├── database/             # SQLAlchemy engine, sessionmaker, seed script
│   │   ├── models/               # User, Resume, AIResumeProfile, Gig, GigRecommendation, AIConversation, AIMessage
│   │   ├── schemas/              # Pydantic request & response validation schemas
│   │   ├── services/ai/          # LLM Service, Resume Parser, Resume Analysis, Skill Extraction, Hybrid Gig Matcher, Chatbot
│   │   └── main.py               # FastAPI entrypoint, CORS, lifespan database auto-creation & seeding
│   ├── storage/resumes/          # Isolated secure resume storage directory
│   ├── test_pipeline.py          # Automated end-to-end integration test suite
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment configuration
│
├── docker-compose.yml            # Multi-container orchestration (DB, Backend, Frontend)
├── .env.example                  # Template configuration file
└── README.md                     # Complete project documentation
```

---

## 2. Design Aesthetics

- **Palette**: Deep Obsidian Black (`#070709`, `#0e0e13`) with Crimson & Ruby Red Accents (`#ef4444`, `#dc2626`, `#f87171`, `#991b1b`).
- **Surface**: Subtle red ambient radial spotlights, red glassmorphism cards (`glass-panel`), crisp typography, and red glow micro-interactions.
- **Scrollbar & Focus States**: Tailored dark-red borders and custom scrollbars.

---

## 3. Database Schema

The platform runs on a dedicated PostgreSQL database (`peaklyy_db`):

| Table | Primary Key | Foreign Keys | Key Columns |
|---|---|---|---|
| `users` | `id` (int) | None | `name`, `email` (unique), `hashed_password`, `created_at` |
| `resumes` | `id` (int) | `user_id` -> `users.id` | `file_name`, `file_path`, `file_type`, `extracted_text`, `analysis_status`, `uploaded_at` |
| `ai_resume_profiles` | `id` (int) | `user_id` -> `users.id`, `resume_id` -> `resumes.id` | `professional_summary`, `skills` (JSON), `experience` (JSON), `education` (JSON), `projects` (JSON), `certifications` (JSON), `interests`, `strengths`, `weaknesses`, `career_suggestions`, `last_analyzed_at` |
| `gigs` | `id` (int) | None | `title`, `description`, `category`, `required_skills` (JSON), `preferred_skills` (JSON), `experience_level`, `eligibility_requirements` (JSON), `location`, `work_type`, `compensation`, `duration`, `status`, `embedding` (JSON) |
| `gig_recommendations` | `id` (int) | `user_id` -> `users.id`, `gig_id` -> `gigs.id` | `match_percentage`, `eligibility_status`, `matched_skills` (JSON), `missing_skills` (JSON), `recommendation_reason`, `created_at` |
| `ai_conversations` | `id` (int) | `user_id` -> `users.id` | `title`, `created_at`, `updated_at` |
| `ai_messages` | `id` (int) | `conversation_id` -> `ai_conversations.id` | `role`, `content`, `created_at` |

---

## 4. Initial Database Gigs

The database is pre-seeded with 9 diverse real contract roles across all required categories:
1. **Frontend Development**: Senior Frontend Engineer (Next.js & Design Systems)
2. **Backend Development**: Backend Microservices Architect (Python / FastAPI)
3. **Full Stack Development**: Full Stack Web Application Developer
4. **Python Development**: Python Automation & Data Pipeline Engineer
5. **Machine Learning**: Machine Learning & LLM Integration Specialist
6. **Data Analysis**: Business Intelligence & Data Analyst
7. **UI/UX Design**: Product Designer (UI/UX & Interactive Design)
8. **Content and Marketing**: Growth Content Strategist & Technical Copywriter
9. **Graphic Design**: Brand Identity & Graphic Designer

---

## 5. AI & Recommendation Engine Details

### Hybrid Recommendation Engine Formula
The compatibility score is dynamically computed from:
1. **Skill Compatibility (40%)**: Proportional ratio of matched required and preferred skills with canonicalized alias mapping.
2. **Experience Compatibility (20%)**: Candidate work experience depth vs required seniority (Entry / Intermediate / Senior / Lead).
3. **Project Relevance (15%)**: Alignment of candidate portfolio projects with the gig tech stack.
4. **Interest & Domain Alignment (15%)**: Career goals & categories matching the gig.
5. **Education Compatibility (10%)**: Degree level and academic background.
6. **Semantic Embedding Similarity (Calibrator)**: Cosine similarity of dense embeddings.
7. **Eligibility Checking**: Hard prerequisite filters mark applications as `Eligible`, `Partially Eligible`, or `Ineligible` (ineligible scores are capped at 48%).

### Centralized LLM Provider Architecture
- Provider switch: supports Google Gemini (`gemini-1.5-flash`, `gemini-2.0-flash`) or OpenAI-compatible APIs (`gpt-4o-mini`, OpenRouter, Groq, Ollama) configured via `.env`.
- Structured output parsing: prompts enforce strict JSON schema, validated against Pydantic models.
- Graceful offline fallback: deep deterministic parser for local development without an active API key, ensuring tests and frontend never crash.

---

## 6. API Documentation

### Authentication
- `POST /api/auth/register` - Create user account (hashes password with bcrypt, issues JWT)
- `POST /api/auth/login` - Verify credentials and return JWT
- `GET /api/auth/me` - Get authenticated user profile

### Resumes
- `POST /api/resumes/upload` - Upload PDF/DOCX file, extract text, trigger LLM analysis
- `GET /api/resumes` - List uploaded resumes for authenticated user
- `GET /api/resumes/{id}/analysis` - Get structured AI profile
- `POST /api/resumes/{id}/analyze` - Re-trigger LLM analysis

### Gigs
- `GET /api/gigs` - Search and filter active gigs
- `GET /api/gigs/{id}` - Get gig details
- `POST /api/gigs` - Create new gig (admin)
- `PUT /api/gigs/{id}` - Update gig (admin)
- `DELETE /api/gigs/{id}` - Delete gig (admin)

### Recommendations
- `GET /api/recommendations` - Retrieve ranked matches for current user
- `POST /api/recommendations/refresh` - Recompute hybrid compatibility scores
- `GET /api/recommendations/{gig_id}` - Get match rationale for a specific gig

### AI Career Assistant
- `POST /api/ai/chat` - Send query, inject resume context & active gigs, return reply
- `GET /api/ai/conversations` - List user conversations
- `GET /api/ai/conversations/{id}` - Get conversation history
- `DELETE /api/ai/conversations/{id}` - Delete conversation

---

## 7. Setup & Run Instructions

### Prerequisites
- Node.js 18+ (Node 22 installed)
- Python 3.10+ (Python 3.14 installed)
- PostgreSQL (running locally or via Docker)

### Step 1: Clone & Configure Environment
```bash
cp .env.example backend/.env
```
Edit `backend/.env` to configure your PostgreSQL credentials and LLM API Key:
```env
DATABASE_URL=postgresql://postgres@localhost:5432/peaklyy_db
JWT_SECRET=your-secure-jwt-key
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-1.5-flash
```

### Step 2: Run Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at `http://localhost:8000/docs`.

### Step 3: Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Docker Setup (Alternative)
```bash
docker compose up --build
```

---

## 8. Verification & Tests Performed

1. **Backend Integration Pipeline (`backend/test_pipeline.py`)**:
   - `GET /health` verification.
   - User registration and bcrypt password hashing.
   - Database gig retrieval (9 seeded records confirmed).
   - In-memory PDF generation with PyMuPDF, file upload, text extraction.
   - Structured JSON validation with Pydantic.
   - Hybrid recommendation execution (76.8% match calculated for Full Stack role, with matched skills: PostgreSQL, Next.js, React, Node.js, TypeScript).
   - AI Career Assistant multi-turn conversation and memory retention.
2. **Frontend Build Verification (`npm run build`)**:
   - All 10 routes compiled without TypeScript or Lint errors:
     - `/` (Landing Page)
     - `/register` (Registration Page)
     - `/login` (Login Page)
     - `/dashboard` (User Dashboard)
     - `/resume/upload` (Resume Upload Page)
     - `/resume/analysis` (Resume Analysis Page)
     - `/recommendations` (Gig Recommendations Page)
     - `/gigs/[id]` (Gig Details Page)
     - `/assistant` (AI Career Assistant Page)
     - `/profile` (User Profile Page)
3. **Live Route Verification**:
   - All 10 frontend routes tested via HTTP requests returning `HTTP 200 OK`.
   - FastAPI `/health` and `/api/gigs` verified returning live data.
