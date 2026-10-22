# Peaklyy – Complete Frontend UI Specification & Remodeling Blueprint

This document provides a comprehensive, component-by-component architectural blueprint of the entire Peaklyy web application. It specifies every page, layout, component, tab, modal, interactive state, design token, and data contract needed to remodel or completely recreate the user interface without missing any functionality.

---

## 1. Global Design System & Styling Architecture

### 1.1 Color Tokens & Aesthetic
Peaklyy utilizes a custom **Obsidian Red & Black** dark-mode visual hierarchy with subtle glassmorphism and ambient red luminescence:

| Token | Hex / CSS Value | Description / Usage |
| :--- | :--- | :--- |
| **`--background`** | `#070709` | Deep obsidian ultra-dark background |
| **`--foreground`** | `#f4f4f5` | Zinc-100 high-contrast primary typography |
| **`--card`** | `#0e0e13` | Deep card background with 80% backdrop blur |
| **`--card-border`**| `rgba(220, 38, 38, 0.22)` | Subtle crimson border for cards |
| **`--accent-red`** | `#ef4444` | Vivid red primary brand accent |
| **`--accent-red-hover`** | `#dc2626` | Darker red hover state |
| **`--accent-red-glow`** | `rgba(239, 68, 68, 0.25)` | Outer glow for buttons, badges, and focus rings |
| **`--emerald`** | `#10b981` | Success states, >=70% match score, verified badges |
| **`--amber`** | `#f59e0b` | Partially eligible (40-69%) match score, suggestions |

### 1.2 Glassmorphism & Utility Classes
* **`.glass-panel`**: `background: rgba(14, 14, 19, 0.82); backdrop-filter: blur(16px); border: 1px solid rgba(239, 68, 68, 0.16); box-shadow: 0 4px 30px rgba(0,0,0,0.5);`
* **`.glass-panel-hover`**: Adds translateY(-2px), glow intensification, and transition on hover.
* **`.gradient-button-red`**: `linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)` with hover brightness and glow.
* **`.gradient-text-red`**: `linear-gradient(135deg, #ffffff 30%, #f87171 70%, #ef4444 100%)` clip-text.
* **`.bg-radial-vignette`**: Dual radial spotlights centered at top and bottom for ambient depth.

### 1.3 Iconography
Exclusively uses **`lucide-react`**:
* Navigation: `Sparkles`, `FileText`, `Briefcase`, `Bot`, `User`, `LogOut`, `ArrowRight`
* Status & Feedback: `CheckCircle2`, `AlertTriangle`, `AlertCircle`, `Clock`, `RefreshCw`, `FileSearch`, `Layers`, `Award`

---

## 2. Global Layout & Shell Components

### 2.1 Navigation Bar (`Navbar.tsx`)
* **Position**: Sticky top (`sticky top-0 z-50 backdrop-blur-xl bg-[#070709]/80 border-b border-red-950/40`)
* **Left**: Brand Logo (Crimson square icon with bold "P", "PEAKLYY." title, and "AI Career Intelligence" subtitle).
* **Center (Desktop)**: 4 Primary Nav Links with active state highlight (red background tint and red icon):
  1. **Dashboard** (`/dashboard`) – Icon: `Sparkles`
  2. **Resume AI** (`/resume/upload` & `/resume/analysis`) – Icon: `FileText`
  3. **Gig Matches** (`/recommendations`) – Icon: `Briefcase`
  4. **Career Assistant** (`/assistant`) – Icon: `Bot`
* **Right**:
  * **Authenticated State**:
    * User Badge with round initial avatar (`user.name[0]`) linking to `/profile`.
    * Quick Logout Icon button (`LogOut`) triggering `api.logout()`.
  * **Unauthenticated State**:
    * "Sign In" link (`/login`).
    * "Get Started" gradient button (`/register`) with `ArrowRight`.

### 2.2 Global Footer (`Footer.tsx`)
* **Top Grid (4 Columns)**:
  1. *Brand Statement*: Logo, tagline, and platform description.
  2. *Capabilities Links*: AI Resume Analysis, Hybrid Gig Matching, Career Assistant, Explore Gigs.
  3. *Technology Pillars*: FastAPI & PyMuPDF, PostgreSQL Database, Next.js 16 & React 19, OpenRouter/LLM Inference.
  4. *Real-time System Status*: Live green indicator ("All Systems Operational"), Database Connected badge.
* **Bottom Bar**: Copyright, Terms of Service, Privacy Policy.

---

## 3. Screen-by-Screen Component Specifications

```
                     ┌──────────────────────────────────────────────┐
                     │              Landing Page (/)                │
                     └──────────────────────┬───────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
       ┌───────▼────────┐           ┌───────▼────────┐           ┌───────▼────────┐
       │ Login (/login) │           │ Register (/reg)│           │ Dashboard (/d) │
       └────────────────┘           └────────────────┘           └───────┬────────┘
                                                                         │
       ┌────────────────────────────┬────────────────────────────────────┼───────────────────────┐
       │                            │                                    │                       │
┌──────▼────────┐           ┌───────▼────────┐                   ┌───────▼────────┐      ┌───────▼────────┐
│ Resume Upload │           │ Resume Analysis│                   │  Gig Matches   │      │ AI Assistant   │
│(/resume/upl)  │──────────►│(/resume/analy) │                   │(/recommendat.) │      │  (/assistant)  │
└───────────────┘           └────────────────┘                   └───────┬────────┘      └────────────────┘
                                                                         │
                                                                 ┌───────▼────────┐
                                                                 │  Gig Details   │
                                                                 │  (/gigs/[id])  │
                                                                 └────────────────┘
```

---

### Screen 1: Landing Page (`/`)
* **Route**: `/`
* **File**: `frontend/app/page.tsx`
* **Sections**:
  1. **Hero Section**:
     - Pill badge: "Next-Generation Career Intelligence" with spinning `Sparkles`.
     - Heading: "Find Your Dream Gigs with AI Precision."
     - Subtitle explaining resume analysis, semantic skill extraction, and gig matching.
     - Dual CTAs: Primary gradient button ("Analyze My Resume" -> `/resume/upload`) & Secondary button ("Explore Recommended Gigs" -> `/recommendations`).
  2. **4 Trust/Feature Badges**: Actual LLM Extraction, Hybrid Recommendations, Contextual Chatbot, Isolated PostgreSQL Storage.
  3. **3 Core Capability Pillars (Cards)**:
     - Card 1: *AI Resume Analysis* (Deep PDF/DOCX parsing, proficiencies, weaknesses).
     - Card 2: *AI Gig Recommendations* (Weighted hybrid scoring: 40% skills, 20% experience, 15% projects, 15% interests, 10% education).
     - Card 3: *AI Career Assistant* (Conversational mentor grounded in user resume and live database gigs).
  4. **Active Gig Category Explorer**: 6 category chips (Frontend, Backend, Full Stack, Machine Learning, Python Engineering, UI/UX Design).
  5. **Bottom Conversion CTA**: "Ready to Accelerate Your Freelance Career?" with quick signup button.

---

### Screen 2: User Authentication (`/login` & `/register`)
* **Routes**: `/login` and `/register`
* **Files**: `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`
* **Components & Form Controls**:
  - Centered glassmorphism modal with glowing red header icon.
  - Form Fields:
    - Name (register only): `input[type="text"]` with leading `User` icon.
    - Email: `input[type="email"]` with leading `Mail` icon.
    - Password: `input[type="password"]` with leading `Lock` icon.
    - Password Confirm (register only).
  - Submit Button: `gradient-button-red` with loading spinner.
  - Error Alert Banner: Displays API error (e.g. "Invalid credentials").
  - Switch Link: "Already have an account? Sign In" / "Don't have an account? Sign Up".

---

### Screen 3: User Dashboard (`/dashboard`)
* **Route**: `/dashboard`
* **File**: `frontend/app/dashboard/page.tsx`
* **API Endpoints**: `GET /api/resumes`, `GET /api/recommendations`, `POST /api/recommendations/refresh`
* **Components & Sections**:
  1. **Welcome Banner**:
     - Personalized greeting: "Welcome back, {User Name}".
     - Quick Action Buttons: "Upload Resume" and "Ask AI Assistant".
  2. **4 Key Metric Cards (KPI Grid)**:
     - Card 1: *Resumes Analyzed* (Count of uploaded documents).
     - Card 2: *Top Match Score* (Highest % match across all active gigs, colored emerald/amber).
     - Card 3: *Active Gigs in Database* (Count of available database gigs).
     - Card 4: *AI Assistant Status* ("Online & Context-Loaded" / "Awaiting Resume").
  3. **Latest Resume Intelligence Card**:
     - Shows current active document name, file type badge, and upload timestamp.
     - Extracted Professional Summary snippet.
     - Core Strengths skill tags.
     - Button: "View Full Analysis Report" -> `/resume/analysis?id={resume.id}`.
  4. **Top Recommended Gigs (Top 3 Matches)**:
     - Header with "Recompute Matches" refresh button.
     - Match Cards with percentage gauge (`85% Match`), Title, Category, Matched Skills, and "View Details" button.
  5. **Empty State**: If no resume has been uploaded, renders an intuitive prompt to upload a first resume with a drag-and-drop shortcut.

---

### Screen 4: Resume Upload (`/resume/upload`)
* **Route**: `/resume/upload`
* **File**: `frontend/app/resume/upload/page.tsx`
* **API Endpoints**: `POST /api/resumes/upload`, `GET /api/resumes`
* **Components & Interactions**:
  1. **Interactive Drag-and-Drop Zone**:
     - Dashed border with red glow activation on drag over (`dragActive`).
     - Supports `.pdf`, `.docx`, `.doc` up to 15MB.
     - File picker trigger button ("Browse Computer").
     - Selected File Preview card: File name, file size in KB/MB, remove file button.
  2. **Multi-Stage Processing Progress Indicator**:
     - When user clicks "Upload & Run AI Analysis", steps animate:
       - Step 1: "Extracting raw text from document structure..."
       - Step 2: "Querying LLM for structured semantic extraction..."
       - Step 3: "Generating profile embeddings & computing gig recommendations..."
  3. **Previous Uploads Library Table / Grid**:
     - Displays all uploaded resumes for the user.
     - Columns/Items: File Name, Upload Date, File Format, Status Badge:
       - `completed`: Green badge with "View Analysis" button -> `/resume/analysis?id={r.id}`.
       - `analyzing`: Pulsing yellow badge with spinner.
       - `failed`: Red badge with retry button.

---

### Screen 5: Deep Resume Analysis Report (`/resume/analysis`)
* **Route**: `/resume/analysis` (Supports `?id={resumeId}`)
* **File**: `frontend/app/resume/analysis/page.tsx`
* **API Endpoints**: `GET /api/resumes`, `GET /api/resumes/{id}/analysis`, `POST /api/resumes/{id}/analyze`
* **Tabs & Sub-Views**:
  1. **Header & Document Switcher**:
     - Resume selector `<select>` dropdown to switch between multiple uploaded resumes without leaving the page.
     - "Reanalyze" button: Triggers fresh LLM semantic extraction on demand.
     - "View Gig Matches" shortcut button.
  2. **Executive Summary Card**:
     - Full professional summary paragraph synthesized by the AI.
     - "Core Strengths" tag list.
     - Document metadata side-panel (file type, character count, analyzed timestamp).
  3. **Strengths vs Weaknesses Comparison (2-Column Grid)**:
     - Left Column: *Key Profile Strengths* with emerald checkmark bullets.
     - Right Column: *Identified Gaps & Weaknesses* with crimson alert bullets.
  4. **Categorized Skills & Proficiency Matrix**:
     - Estimated Skill Proficiencies grid (Skill name, level: *Beginner/Intermediate/Advanced/Expert*, type: *Explicit vs Inferred*).
     - 7 Categorized skill groups:
       - Programming Languages
       - Frameworks
       - Libraries
       - Databases
       - Developer Tools
       - Technical Skills
       - Soft Skills
  5. **Work & Professional Experience Timeline**:
     - Card per role: Job Title, Company, Duration, Responsibilities bullet list, and Technologies Used chips.
  6. **Projects & Education (2-Column Grid)**:
     - Left: *Featured Projects* (Project name, description, tech stack tags).
     - Right: *Education & Certifications* (Institution, Degree, Field of Study, Graduation Year, Certification issuers).
  7. **Career Roadmap & Strategic Suggestions**:
     - Numbered actionable growth actions synthesized by the AI for marketplace competitiveness.

---

### Screen 6: Gig Recommendations & Matching Engine (`/recommendations`)
* **Route**: `/recommendations`
* **File**: `frontend/app/recommendations/page.tsx`
* **API Endpoints**: `GET /api/recommendations`, `POST /api/recommendations/refresh`
* **Components & Filters**:
  1. **Search & Filter Bar**:
     - Search input (searches gig titles, categories, required skills).
     - Category Filter pills (All, Frontend, Backend, Full Stack, Python, Machine Learning, UI/UX, etc.).
     - Eligibility Tabs:
       - **All Matches**
       - **Eligible** (>=70% match)
       - **Partially Eligible** (40-69% match)
       - **Ineligible** (<40% match)
     - "Recompute Matches" button with refresh spinner.
  2. **Gig Recommendation Cards (Grid Layout)**:
     - Card Header:
       - Percentage Match Gauge (Circle or badge: >=70% emerald, 40-69% amber, <40% red).
       - Eligibility Status Chip (`Eligible`, `Partially Eligible`).
       - Experience Level tag (`Senior`, `Intermediate`, `Entry Level`).
     - Card Body:
       - Gig Title (`h3` linking to `/gigs/[id]`).
       - Category, Compensation (`$4,500 - $6,500/mo`), Duration (`3 Months`), Location (`Remote`).
       - Recommendation Reason box: Explains specifically why the candidate was recommended based on their actual skills.
       - Matched Skills chips (green outline/bg).
       - Missing Skills chips (red/zinc outline).
     - Card Footer:
       - "View Details & Apply" button -> `/gigs/[id]`.
       - "Quick Apply" button with instant submission confirmation.

---

### Screen 7: Gig Details & Application View (`/gigs/[id]`)
* **Route**: `/gigs/[id]`
* **File**: `frontend/app/gigs/[id]/page.tsx`
* **API Endpoints**: `GET /api/gigs/{id}`, `GET /api/recommendations/{id}`
* **Components**:
  1. **Breadcrumb / Return Link**: `ArrowLeft` -> "Return to Recommendations".
  2. **Gig Hero Header**:
     - Title, Category, Work Type (Remote/On-site), Duration, Compensation, Created Date.
  3. **Personalized Match Evaluation Banner** (If logged in & resume analyzed):
     - Displays the user's specific match percentage for this gig.
     - Breakdown of Matched Skills vs Missing Skills to learn.
     - AI Recommendation Rationale: Narrative explaining fit.
     - Link to Assistant: "Discuss this gig with AI Career Assistant" -> `/assistant?q=How can I prepare for the {gig.title} role?`.
  4. **Detailed Job Description**:
     - Full role breakdown, responsibilities, project scope.
  5. **Skills & Criteria Matrices**:
     - Required Skills list.
     - Preferred Skills list.
     - Eligibility Criteria bullet points.
  6. **Application Sidebar / Action Card**:
     - Contract terms summary.
     - "Submit Application" button with success state.
     - Verified Employer Trust badge.

---

### Screen 8: AI Career Assistant & Chatbot (`/assistant`)
* **Route**: `/assistant` (Supports `?q={initialPrompt}`)
* **File**: `frontend/app/assistant/page.tsx`
* **API Endpoints**: `GET /api/ai/conversations`, `GET /api/ai/conversations/{id}`, `POST /api/ai/chat`, `DELETE /api/ai/conversations/{id}`
* **Components (2-Column Chat Layout)**:
  1. **Left Sidebar – Conversations History**:
     - "New Discussion" button (`Plus` icon).
     - List of saved conversations with titles and timestamps.
     - Active conversation highlighted with red border.
     - Delete conversation button (`Trash2` icon) per item.
     - Resume Status Badge (shows whether resume context is currently loaded).
  2. **Main Chat Area**:
     - **Header**: Active chat title & context indicator badge ("Grounded in Resume & Database Gigs").
     - **Message Stream Container**:
       - User Message Bubble: Right-aligned, dark zinc/red accent border.
       - Assistant Message Bubble: Left-aligned glass panel with red avatar, markdown formatting for lists, bold text, and code blocks.
       - Thinking / Typing indicator when waiting for LLM response.
     - **Quick Prompt Suggestion Pills** (Displayed when chat starts):
       - "What are my strongest skills for the market?"
       - "Which active gigs am I best suited for?"
       - "What skills should I learn to qualify for senior roles?"
       - "How should I structure my resume to land higher rates?"
     - **Bottom Message Input**:
       - Auto-resizing textarea / input field.
       - Send button (`Send` icon, disabled when empty or loading).
       - Keyboard shortcut: Enter to send, Shift+Enter for newline.

---

### Screen 9: User Profile & Account Settings (`/profile`)
* **Route**: `/profile`
* **File**: `frontend/app/profile/page.tsx`
* **API Endpoints**: `GET /api/auth/me`, `GET /api/resumes`, `GET /api/recommendations`
* **Components**:
  1. **Profile Header Card**:
     - Large initial avatar in gradient red box.
     - User full name, email, member since date.
     - Sign Out button.
  2. **Overview Statistics Grid**:
     - Total resumes uploaded.
     - Top match percentage.
     - Account standing / verification.
  3. **Uploaded Resumes Management Card**:
     - List of resumes with direct links to `/resume/analysis?id={id}`.
     - "Upload New Document" button.
  4. **Security & System Configuration Card**:
     - Password update placeholders, connected LLM provider info (`OpenRouter / Gemma`), and data isolation notice.

---

## 4. Complete Tab & Filter Matrix

When remodeling the UI, ensure every one of these tabs and filters is implemented:

| Page | Tab / Filter Group | Options / States | Purpose |
| :--- | :--- | :--- | :--- |
| **`/resume/analysis`** | Document Selector | Dropdown of all user's uploaded resumes | Switches analysis view between different documents |
| **`/resume/analysis`** | Profile Sections | Executive Summary, Strengths/Gaps, Skills Matrix, Experience, Projects/Education, Roadmap | Complete visibility into structured AI analysis |
| **`/recommendations`** | Eligibility Filter | `All`, `Eligible (>=70%)`, `Partially Eligible (40-69%)`, `Ineligible (<40%)` | Quickly isolates top matches from stretch gigs |
| **`/recommendations`** | Category Filter | `All`, `Frontend`, `Backend`, `Full Stack`, `Python`, `Machine Learning`, `Data Analysis`, `UI/UX Design`, `Content/Marketing`, `Graphic Design` | Filters gig catalog by discipline |
| **`/assistant`** | Conversation List | Dynamic list of past conversations + "New Discussion" button | Preserves multi-session career advice and interview prep |
| **`/assistant`** | Quick Prompts | 4 contextual starter chips | Enables 1-click prompt execution for new chats |

---

## 5. Frontend Services & API Contract Reference

All pages communicate through `frontend/services/api.ts`. Ensure your remodeled components call these exact service methods:

```typescript
// Auth
api.register(name, email, password)
api.login(email, password)
api.getMe()
api.logout()

// Resumes
api.uploadResume(file)
api.getUserResumes()
api.getResumeAnalysis(resumeId)
api.triggerAnalysis(resumeId)

// Gigs & Recommendations
api.listGigs(category?, experienceLevel?, search?)
api.getGig(gigId)
api.getRecommendations()
api.refreshRecommendations()
api.getGigRecommendation(gigId)

// AI Assistant
api.sendChatMessage(message, conversationId?)
api.listConversations()
api.getConversation(conversationId)
api.deleteConversation(conversationId)
```

---

## 6. Remodeling Recommendations & Best Practices

1. **Maintain Design Tokens**: Keep the dark obsidian theme (`#070709`) and crimson red accent (`#ef4444`) consistent across all pages.
2. **Preserve Reactivity**: Ensure `AuthContext` wraps the application so auth status, user initial, and route protection work without page reloads.
3. **Keep Real Data Flow**: Never replace the `api.*` service calls with static mock arrays. Every page is wired to PostgreSQL and live LLM inference.
4. **Mobile Responsiveness**: Ensure grids (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) collapse cleanly on mobile viewports.
5. **Loading Skeletons & Feedback**: Keep pulse animations, spin icons on refresh/reanalyze buttons, and explicit error alert banners.
