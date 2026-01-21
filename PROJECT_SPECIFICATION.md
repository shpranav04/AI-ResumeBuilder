# AI Resume Builder + Checker - Complete Project Specification

## 1. PRODUCT OVERVIEW & UNIQUE VALUE PROPOSITION

### Problem Statement
Most resume builders are generic, clunky, and don't provide real ATS optimization feedback. Users struggle with formatting, keyword matching, and crafting impactful bullet points.

### Solution
A **modern, AI-powered resume platform** that combines:
- **Guided builder** with live preview
- **Intelligent checker** with ATS scoring
- **Smart suggestions** powered by Google Gemini
- **Dark theme** with premium UX and smooth interactions

### Why This Stands Out
✨ **Real-time visual scoring dashboard** (not just a number)
✨ **Interactive heatmap** showing where recruiters' eyes focus
✨ **Before/After comparison view** for AI suggestions
✨ **Recruiter mode preview** (how your resume looks to ATS)
✨ **Intelligent action buttons** (not generic templates)
✨ **Tone selector** that rewrites your resume style
✨ **Keyword matching engine** that highlights job description alignment

---

## 2. USER FLOW & PRODUCT JOURNEY

### Landing Page
```
┌─────────────────────────────────────┐
│   Resume Builder + ATS Checker      │
│  "Your Resume, AI-Perfected"        │
├─────────────────────────────────────┤
│ [Build New] [Upload to Check] [Demo]│
│ Hero: Animated resume preview       │
│ Social proof: "Optimized by 1000+"  │
└─────────────────────────────────────┘
```

### Path 1: Build Resume (Guided Builder)
```
Landing → Templates Selection → Step-by-Step Form
  ↓
Contact Info → Professional Summary → Experience → Education
  ↓
Skills → Certifications → Projects → Preferences
  ↓
Live Preview (Side Panel) → Tone Selector → Save/Export
```

### Path 2: Check Resume (ATS Checker)
```
Landing → Upload/Paste Resume → Paste Job Description
  ↓
AI Analysis → Scoring Dashboard
  ↓
Detailed Feedback → Smart Suggestions
  ↓
Apply Suggestions → Download Improved Version
```

### Path 3: Improve Resume (Hybrid)
```
Upload Resume → View Current Score → See Issues
  ↓
Use Smart Actions (Improve Impact, Add Metrics, etc.)
  ↓
Preview Changes → Download
```

---

## 3. CORE FEATURES BREAKDOWN

### MVP (Week 1-2)
- [x] Dark theme responsive UI (React + Tailwind)
- [x] 2 Template styles (Minimal, Modern)
- [x] Multi-step builder with form validation
- [x] Live resume preview
- [x] Save to localStorage (draft management)
- [x] PDF export (print-to-PDF or WeasyPrint)
- [x] Resume checker: paste + analyze
- [x] ATS scoring algorithm (basic)
- [x] Gemini integration (bullet point improvement)
- [x] Basic backend: FastAPI + SQLite

### Phase 2 (Week 2-3)
- [x] Drag-and-drop reorder sections
- [x] Smart action buttons (3 buttons: Improve Impact, Add Metrics, ATS-Friendly)
- [x] Keyword matcher with highlights
- [x] Tone selector (Formal, Modern, Minimal, Creative)
- [x] Section-wise feedback
- [x] Version history / draft management
- [x] Better PDF export (WeasyPrint for styled PDFs)

### Advanced (Future)
- [x] User authentication (simple: email + password)
- [x] Cloud storage for resumes
- [x] Job description keyword extraction
- [x] Skill gap analysis
- [x] Recruiter mode (ATS-only view)
- [x] Analytics: which sections score best
- [x] Resume templates (Premium: Professional, Creative)

---

## 4. PAGE-WISE STRUCTURE

### Page 1: Landing Page (`/`)
**Components:**
- Header (Logo, Nav: Build/Check/Pricing, Dark Mode Toggle)
- Hero Section (Title, CTA buttons, Background animation)
- Features Showcase (3 cards: Builder, Checker, Smart Suggestions)
- How It Works (3-step visual flow)
- Testimonials / Social Proof
- Footer

### Page 2: Builder (`/builder`)
**Layout:** 3-column
- Left: Form Steps (Stepper component)
- Center: Input Form (Dynamic based on step)
- Right: Live Preview (Resume card)

**Components:**
- StepperNav (6 steps with progress)
- FormSection (Contact, Experience, Education, Skills, etc.)
- LivePreview (Renders resume in real-time)
- DraftManager (Save/Load buttons)
- ExportModal (PDF + Download)

### Page 3: Resume Checker (`/checker`)
**Layout:** 2 sections
- Upload/Paste Area (Resume input)
- Job Description Paste Area

**Components:**
- FileUpload (Drag-drop or file input)
- TextArea (Paste resume/JD)
- ScoringDashboard (Visual breakdown)
- FeedbackPanel (Section-wise feedback + suggestions)
- ApplyButton (Use smart suggestions)

### Page 4: Result/Preview (`/result/:resumeId`)
**Components:**
- ResumePreview (PDF view)
- ScoreDashboard (Heatmap + metrics)
- SmartActionButtons (3-5 contextual buttons)
- BeforeAfterComparison (Show changes)
- DownloadSection (PDF + JSON export)

### Page 5: Dashboard/History (`/dashboard`)
**Components:**
- RecentDrafts (List of saved resumes)
- VersionHistory (Timeline of changes)
- QuickStats (Total score, best section, improvement over time)

---

## 5. UI/UX PRINCIPLES & DESIGN TOKENS

### Dark Theme Color Palette
```
Primary Brand: #00D9FF (Cyan) - CTAs, highlights, accents
Secondary: #7C3AED (Purple) - Gradients, interactive elements
Background: #0F172A (Dark navy) - Main canvas
Surface: #1E293B (Slightly lighter) - Cards, panels
Accent: #10B981 (Green) - Success, positive feedback
Warning: #F59E0B (Amber) - Warnings
Error: #EF4444 (Red) - Errors
Text Primary: #F1F5F9 (Light gray)
Text Secondary: #94A3B8 (Medium gray)
Border: #334155 (Slate)
```

### Typography
- **Headings:** Inter (Bold, 24-48px)
- **Body:** Inter (Regular, 14-16px)
- **Code/Data:** Monospace (12-14px)

### Spacing & Grid
- 8px base unit
- 1rem = 16px
- Gutters: 24px desktop, 16px mobile

### Micro-interactions
- Smooth transitions (200-300ms)
- Hover effects on interactive elements
- Toast notifications for actions
- Skeleton loaders for data fetching
- Confetti animation on resume completion
- Typewriter effect for suggestions

---

## 6. BACKEND ARCHITECTURE (FastAPI)

### Project Structure
```
backend/
├── main.py                 # FastAPI app entry point
├── config.py              # Settings, env variables
├── requirements.txt       # Dependencies
├── .env                   # Google Gemini API key (git ignored)
├── database/
│   ├── db.py             # SQLAlchemy setup
│   ├── models.py         # SQLAlchemy ORM models
│   └── session.py        # DB session management
├── schemas/
│   ├── resume.py         # Pydantic models for Resume
│   ├── feedback.py       # Feedback response models
│   └── user.py           # User models
├── routes/
│   ├── builder.py        # Resume creation/update endpoints
│   ├── checker.py        # Resume analysis endpoints
│   ├── ai.py            # Gemini integration endpoints
│   ├── export.py        # PDF export endpoints
│   └── auth.py          # Optional: user authentication
├── services/
│   ├── gemini_service.py   # Gemini API wrapper
│   ├── ats_scorer.py       # ATS scoring logic
│   ├── resume_parser.py    # Parse uploaded resumes
│   └── pdf_generator.py    # PDF export
├── utils/
│   ├── validators.py       # Input validation
│   └── constants.py        # App constants
└── logs/
    └── app.log
```

### Key Dependencies
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
google-generativeai==0.3.0
python-multipart==0.0.6
python-dotenv==1.0.0
weasyprint==60.0           # PDF generation
PyPDF2==4.0.1             # PDF parsing
python-docx==0.8.11        # Word doc parsing
aiofiles==23.2.1          # Async file handling
cors-fastapi==0.0.6       # CORS support
pydantic-settings==2.1.0  # Environment settings
```

---

## 7. DATABASE SCHEMA (SQLAlchemy Models)

### User Model
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String)  # Optional for MVP
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
```

### Resume Model
```python
class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String, primary_key=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, default="Untitled Resume")
    
    # Resume content (JSON)
    contact_info = Column(JSON)
    professional_summary = Column(String)
    experience = Column(JSON)  # List of jobs
    education = Column(JSON)   # List of schools
    skills = Column(JSON)      # List of skills
    certifications = Column(JSON)
    projects = Column(JSON)
    
    # Settings
    template_style = Column(String, default="modern")  # minimal, modern, professional
    tone = Column(String, default="formal")  # formal, modern, minimal, creative
    
    # Metadata
    version = Column(Integer, default=1)
    is_draft = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    feedback = relationship("ResumeFeedback", back_populates="resume", cascade="all, delete-orphan")
```

### ResumeFeedback Model
```python
class ResumeFeedback(Base):
    __tablename__ = "resume_feedback"
    
    id = Column(Integer, primary_key=True)
    resume_id = Column(String, ForeignKey("resumes.id"))
    
    # Scores
    ats_score = Column(Float, default=0.0)
    clarity_score = Column(Float, default=0.0)
    impact_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    
    # Feedback
    ats_feedback = Column(JSON)  # List of suggestions
    clarity_feedback = Column(JSON)
    impact_feedback = Column(JSON)
    keyword_matches = Column(JSON)  # Keywords found/missing
    
    # Job description (if analyzed against JD)
    job_description = Column(Text)
    matched_keywords = Column(JSON)
    missing_keywords = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    resume = relationship("Resume", back_populates="feedback")
```

---

## 8. API ENDPOINTS SPECIFICATION

### 1. Resume Builder Endpoints

#### POST `/api/builder/create`
**Description:** Create a new resume
**Request:**
```json
{
  "title": "My Resume",
  "template_style": "modern",
  "tone": "formal"
}
```
**Response:**
```json
{
  "resume_id": "uuid-1234",
  "title": "My Resume",
  "created_at": "2026-01-21T10:00:00Z",
  "status": "success"
}
```

#### PUT `/api/builder/{resume_id}/update`
**Description:** Update resume section
**Request:**
```json
{
  "section": "experience",
  "data": [
    {
      "company": "Tech Corp",
      "position": "Software Engineer",
      "start_date": "2023-01-01",
      "end_date": "2024-01-01",
      "description": ["Built API", "Led migrations"]
    }
  ]
}
```
**Response:** `200 OK` with updated resume

#### GET `/api/builder/{resume_id}`
**Description:** Get full resume data
**Response:** Complete resume object (JSON)

#### POST `/api/builder/{resume_id}/save-draft`
**Description:** Save as draft (for versioning)
**Response:** `{ "version": 2, "saved_at": "..." }`

#### GET `/api/builder/{resume_id}/versions`
**Description:** List all versions of a resume
**Response:**
```json
{
  "versions": [
    { "version": 1, "saved_at": "...", "is_current": false },
    { "version": 2, "saved_at": "...", "is_current": true }
  ]
}
```

---

### 2. Resume Checker Endpoints

#### POST `/api/checker/analyze`
**Description:** Analyze resume + extract keywords
**Request:**
```json
{
  "resume_text": "John Doe...",
  "job_description": "We are looking for...",
  "quick_check": false
}
```
**Response:**
```json
{
  "analysis_id": "uuid-5678",
  "ats_score": 78,
  "clarity_score": 85,
  "impact_score": 72,
  "overall_score": 78.3,
  "keyword_matches": {
    "matched": ["Python", "FastAPI", "AWS"],
    "missing": ["Kubernetes", "Docker", "Microservices"]
  },
  "feedback": {
    "ats": [
      "Remove special characters in Experience section",
      "Add more action verbs"
    ],
    "clarity": ["Shorten bullet points > 20 words"],
    "impact": ["Quantify metrics: 'Built API' → 'Built REST API handling 10K+ daily requests'"]
  }
}
```

#### POST `/api/checker/upload`
**Description:** Upload resume file (.pdf, .docx, .txt)
**Request:** FormData with file
**Response:** `{ "extracted_text": "..." }`

---

### 3. AI Suggestion Endpoints

#### POST `/api/ai/improve-bullet`
**Description:** Rewrite bullet point with impact
**Request:**
```json
{
  "bullet": "Worked on projects",
  "context": "Software Engineer role",
  "tone": "formal"
}
```
**Response:**
```json
{
  "original": "Worked on projects",
  "improved": "Led development of 3 key features serving 50K+ users, improving performance by 40%",
  "suggestions": [
    "Added quantifiable metrics",
    "Stronger action verb (Led vs Worked)",
    "Shows business impact"
  ]
}
```

#### POST `/api/ai/add-metrics`
**Description:** Suggest metrics for bullet point
**Request:**
```json
{
  "bullet": "Implemented new payment system",
  "role": "Backend Engineer"
}
```
**Response:**
```json
{
  "original": "Implemented new payment system",
  "enhanced": "Implemented payment system, reducing checkout time by 50% and increasing conversion by 12%",
  "metrics_added": ["50%", "12%"]
}
```

#### POST `/api/ai/ats-optimize`
**Description:** Get ATS-friendly rewrite
**Request:**
```json
{
  "resume_section": "experience",
  "full_resume": { ... }
}
```
**Response:**
```json
{
  "optimizations": [
    {
      "issue": "Unclear formatting",
      "suggestion": "Use standard bullet format (•)"
    },
    {
      "issue": "Missing keywords from job description",
      "suggestion": "Add: Python, FastAPI, AWS"
    }
  ]
}
```

#### POST `/api/ai/extract-jd-keywords`
**Description:** Extract and categorize JD keywords
**Request:**
```json
{
  "job_description": "Full JD text..."
}
```
**Response:**
```json
{
  "technical_skills": ["Python", "FastAPI", "PostgreSQL"],
  "soft_skills": ["Leadership", "Communication"],
  "experience": ["2+ years API development"],
  "tools": ["Git", "Docker"]
}
```

#### POST `/api/ai/skill-gap`
**Description:** Analyze skill gaps
**Request:**
```json
{
  "resume_skills": ["Python", "React"],
  "job_description": "..."
}
```
**Response:**
```json
{
  "matched_skills": ["Python"],
  "missing_skills": ["FastAPI", "Docker"],
  "recommendations": [
    "Consider learning FastAPI (appears in 60% of similar roles)",
    "Docker is in-demand (add to resume if you know it)"
  ]
}
```

---

### 4. Export Endpoints

#### GET `/api/export/{resume_id}/pdf`
**Description:** Download resume as PDF
**Query Parameters:** `?template=modern&tone=formal`
**Response:** Binary PDF file

#### GET `/api/export/{resume_id}/json`
**Description:** Export as JSON (for backup)
**Response:** Complete resume JSON

---

### 5. Optional: Dashboard Endpoints

#### GET `/api/dashboard/resumes`
**Description:** List all user's resumes
**Response:**
```json
{
  "resumes": [
    {
      "id": "uuid-1",
      "title": "My Resume v2",
      "updated_at": "2026-01-21",
      "is_draft": false,
      "last_score": 78.3
    }
  ]
}
```

#### DELETE `/api/dashboard/resume/{resume_id}`
**Description:** Delete a resume

---

## 9. PYDANTIC SCHEMAS

### Schema Examples

```python
# schemas/resume.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional

class ContactInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    location: str
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

class Experience(BaseModel):
    company: str
    position: str
    start_date: str  # YYYY-MM
    end_date: Optional[str] = None
    is_current: bool = False
    description: List[str]  # Bullet points

class Education(BaseModel):
    school: str
    degree: str
    field: str
    graduation_date: str  # YYYY-MM
    gpa: Optional[float] = None

class ResumeCreate(BaseModel):
    title: str
    template_style: str = "modern"
    tone: str = "formal"

class ResumeUpdate(BaseModel):
    section: str  # "experience", "education", etc.
    data: dict

class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: str
    quick_check: bool = False

class FeedbackResponse(BaseModel):
    ats_score: float
    clarity_score: float
    impact_score: float
    overall_score: float
    feedback: dict
    keyword_matches: dict
```

---

## 10. ERROR HANDLING & VALIDATION

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Auth required
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": "Invalid email format",
  "detail": "email must be a valid email address",
  "status_code": 400
}
```

---

## 11. DEPLOYMENT & HOSTING

### Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Production
- **Backend:** Heroku / Railway / Render
- **Frontend:** Vercel / Netlify
- **Database:** PostgreSQL (Heroku add-on)
- **Storage:** AWS S3 (optional, for file uploads)
- **Environment:** .env with Gemini API key

---

## 12. SECURITY CONSIDERATIONS

### API Security
- ✅ CORS configured (frontend domain only)
- ✅ Environment variables for secrets
- ✅ Input validation (Pydantic)
- ✅ Rate limiting on AI endpoints
- ✅ No API keys exposed to frontend
- ✅ HTTPS only in production

### Data Privacy
- ✅ No resume data logged to Gemini
- ✅ User consent for AI analysis
- ✅ Optional deletion of resumes
- ✅ GDPR-compliant data handling

---

## 13. PERFORMANCE TARGETS

- Page load: < 2 seconds
- PDF generation: < 5 seconds
- AI suggestion: < 10 seconds (with retry)
- Mobile responsive: All screens
- Lighthouse score: > 90

---

## 14. TESTING STRATEGY

### Unit Tests
- Pydantic schema validation
- ATS scoring algorithm
- Input validators

### Integration Tests
- API endpoint responses
- Database operations
- Gemini API fallback

### E2E Tests (Playwright/Cypress)
- Complete resume builder flow
- Checker workflow
- PDF export

---

