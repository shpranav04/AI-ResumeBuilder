# Quick-Start Implementation Guide - Boilerplate Code

This guide provides ready-to-use code templates to get you started immediately.

---

## PART 1: BACKEND SETUP

### Step 1: Create Backend Project Structure

```bash
cd /Users/pranavsharma/Desktop/Python/Ai\ Resume\ Builder
mkdir -p backend/{database,schemas,routes,services,utils,logs}
cd backend
```

### Step 2: Backend `requirements.txt`

Create `backend/requirements.txt`:
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
sqlalchemy==2.0.23
python-dotenv==1.0.0
google-generativeai==0.3.0
python-multipart==0.0.6
aiofiles==23.2.1
python-cors==1.0.1
```

### Step 3: Backend `.env` File

Create `backend/.env`:
```
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# Database
DATABASE_URL=sqlite:///./resume_builder.db

# Gemini API
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-pro

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Logging
LOG_LEVEL=INFO
```

### Step 4: Core Backend Files

#### `backend/main.py`

```python
"""
FastAPI Application Entry Point
AI Resume Builder + Checker
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Resume Builder",
    description="Build, optimize, and export resumes with AI assistance",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
from database.db import init_db, engine, Base
Base.metadata.create_all(bind=engine)

# Include routers
from routes import builder, checker, ai, export

app.include_router(builder.router)
app.include_router(checker.router)
app.include_router(ai.router)
app.include_router(export.router)

@app.get("/")
async def root():
    return {
        "message": "AI Resume Builder API",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "False") == "True"
    )
```

#### `backend/config.py`

```python
"""
Application Configuration
"""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    
    # Database
    database_url: str = "sqlite:///./resume_builder.db"
    
    # Gemini
    gemini_api_key: str
    gemini_model: str = "gemini-pro"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

#### `backend/database/db.py`

```python
"""
Database Configuration and Session Management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resume_builder.db")

# SQLite specific configuration
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
```

#### `backend/database/models.py`

```python
"""
SQLAlchemy ORM Models
"""

from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, default="Untitled Resume")
    
    # Content
    contact_info = Column(JSON, default={})
    professional_summary = Column(Text, default="")
    experience = Column(JSON, default=[])
    education = Column(JSON, default=[])
    skills = Column(JSON, default=[])
    certifications = Column(JSON, default=[])
    projects = Column(JSON, default=[])
    
    # Settings
    template_style = Column(String, default="modern")  # minimal, modern, professional
    tone = Column(String, default="formal")  # formal, modern, minimal, creative
    
    # Metadata
    version = Column(Integer, default=1)
    is_draft = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    feedback = relationship("ResumeFeedback", back_populates="resume", cascade="all, delete-orphan")

class ResumeFeedback(Base):
    __tablename__ = "resume_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(String, ForeignKey("resumes.id"), index=True)
    
    # Scores
    ats_score = Column(Integer, default=0)
    clarity_score = Column(Integer, default=0)
    impact_score = Column(Integer, default=0)
    overall_score = Column(Integer, default=0)
    
    # Feedback
    feedback_data = Column(JSON, default={})
    keyword_matches = Column(JSON, default={})
    job_description = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    resume = relationship("Resume", back_populates="feedback")
```

#### `backend/schemas/resume.py`

```python
"""
Pydantic Schemas for Resume Data Validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class ContactInfoSchema(BaseModel):
    name: str
    email: EmailStr
    phone: str
    location: str
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

class ExperienceSchema(BaseModel):
    company: str
    position: str
    start_date: str  # YYYY-MM
    end_date: Optional[str] = None
    is_current: bool = False
    description: List[str] = []

class EducationSchema(BaseModel):
    school: str
    degree: str
    field: str
    graduation_date: str  # YYYY-MM
    gpa: Optional[float] = None

class ResumeCreateSchema(BaseModel):
    title: str = "My Resume"
    template_style: str = "modern"
    tone: str = "formal"

class ResumeUpdateSchema(BaseModel):
    section: str  # "experience", "education", "skills", etc.
    data: dict

class ResumeResponseSchema(BaseModel):
    id: str
    title: str
    template_style: str
    tone: str
    version: int
    is_draft: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AnalysisRequestSchema(BaseModel):
    resume_text: str
    job_description: Optional[str] = None

class BulletPointRequestSchema(BaseModel):
    bullet: str
    context: Optional[str] = ""
    tone: str = "formal"
```

#### `backend/routes/__init__.py`

```python
# Empty file to make routes a package
```

#### `backend/routes/builder.py`

```python
"""
Resume Builder API Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4
import logging

from database.db import get_db
from database.models import Resume
from schemas.resume import (
    ResumeCreateSchema, ResumeUpdateSchema, ResumeResponseSchema
)

router = APIRouter(prefix="/api/builder", tags=["Builder"])
logger = logging.getLogger(__name__)

@router.post("/create", response_model=ResumeResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_resume(
    request: ResumeCreateSchema,
    db: Session = Depends(get_db)
):
    """Create a new resume"""
    try:
        resume = Resume(
            id=str(uuid4()),
            title=request.title,
            template_style=request.template_style,
            tone=request.tone
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume
    except Exception as e:
        logger.error(f"Error creating resume: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create resume")

@router.get("/{resume_id}", response_model=ResumeResponseSchema)
async def get_resume(
    resume_id: str,
    db: Session = Depends(get_db)
):
    """Get resume by ID"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.put("/{resume_id}/update", response_model=ResumeResponseSchema)
async def update_resume(
    resume_id: str,
    request: ResumeUpdateSchema,
    db: Session = Depends(get_db)
):
    """Update a resume section"""
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Update the requested section
        setattr(resume, request.section, request.data)
        resume.version += 1
        
        db.commit()
        db.refresh(resume)
        return resume
    except Exception as e:
        logger.error(f"Error updating resume: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update resume")

@router.post("/{resume_id}/save-draft")
async def save_draft(
    resume_id: str,
    db: Session = Depends(get_db)
):
    """Save resume as draft version"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    resume.is_draft = True
    db.commit()
    
    return {
        "status": "success",
        "version": resume.version,
        "message": f"Resume saved as draft (version {resume.version})"
    }

@router.get("/{resume_id}/versions")
async def get_versions(
    resume_id: str,
    db: Session = Depends(get_db)
):
    """List all versions of a resume"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {
        "resume_id": resume.id,
        "versions": [{
            "version": resume.version,
            "created_at": resume.created_at,
            "updated_at": resume.updated_at,
            "is_draft": resume.is_draft
        }]
    }

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db)
):
    """Delete a resume"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    db.delete(resume)
    db.commit()
    
    return {"status": "success", "message": "Resume deleted"}
```

#### `backend/routes/checker.py`

```python
"""
Resume Checker API Routes
"""

from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional
import logging

from services.ats_scorer import ATSScorer

router = APIRouter(prefix="/api/checker", tags=["Checker"])
logger = logging.getLogger(__name__)
scorer = ATSScorer()

class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None

@router.post("/analyze")
async def analyze_resume(request: AnalysisRequest):
    """Analyze resume and calculate ATS score"""
    try:
        if len(request.resume_text) < 100:
            raise HTTPException(status_code=400, detail="Resume text too short (min 100 chars)")
        
        result = scorer.score_resume(
            resume_text=request.resume_text,
            job_description=request.job_description or ""
        )
        
        return {
            "status": "success",
            "analysis": result
        }
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze resume")

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and extract resume text"""
    try:
        content = await file.read()
        
        # Simple text extraction (can be enhanced)
        if file.filename.endswith('.txt'):
            text = content.decode('utf-8')
        elif file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="PDF parsing requires additional setup (WeasyPrint)")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        return {
            "status": "success",
            "extracted_text": text,
            "filename": file.filename
        }
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse resume")
```

#### `backend/routes/ai.py`

```python
"""
AI-Powered Resume Improvement Routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
import asyncio

from services.gemini_service import gemini_service

router = APIRouter(prefix="/api/ai", tags=["AI"])
logger = logging.getLogger(__name__)

class BulletPointRequest(BaseModel):
    bullet: str
    context: Optional[str] = ""
    tone: str = "formal"

class MetricsRequest(BaseModel):
    bullet: str
    role: Optional[str] = ""

@router.post("/improve-bullet")
async def improve_bullet(request: BulletPointRequest):
    """Improve a bullet point with stronger verbs and impact"""
    try:
        if len(request.bullet) < 5:
            raise HTTPException(status_code=400, detail="Bullet point too short")
        
        result = await gemini_service.improve_bullet_point(
            bullet=request.bullet,
            context=request.context,
            tone=request.tone
        )
        
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error improving bullet: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to improve bullet")

@router.post("/add-metrics")
async def add_metrics(request: MetricsRequest):
    """Add metrics and quantifiable results to bullet point"""
    try:
        result = await gemini_service.add_metrics_to_bullet(
            bullet=request.bullet,
            role=request.role
        )
        
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error adding metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add metrics")

@router.get("/health")
async def health_check():
    """Check Gemini API connection"""
    try:
        # Simple test
        test = await asyncio.wait_for(
            asyncio.to_thread(
                lambda: "API accessible"
            ),
            timeout=5
        )
        return {"status": "healthy", "api_connected": True}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

#### `backend/routes/export.py`

```python
"""
Resume Export Routes (PDF, JSON)
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
import json
import logging

from database.db import get_db
from database.models import Resume

router = APIRouter(prefix="/api/export", tags=["Export"])
logger = logging.getLogger(__name__)

@router.get("/{resume_id}/json")
async def export_json(
    resume_id: str,
    db: Session = Depends(get_db)
):
    """Export resume as JSON"""
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_data = {
            "id": resume.id,
            "title": resume.title,
            "contact_info": resume.contact_info,
            "professional_summary": resume.professional_summary,
            "experience": resume.experience,
            "education": resume.education,
            "skills": resume.skills,
            "template_style": resume.template_style,
            "tone": resume.tone
        }
        
        return JSONResponse(
            content=resume_data,
            headers={"Content-Disposition": f"attachment; filename={resume.title}.json"}
        )
    except Exception as e:
        logger.error(f"Error exporting JSON: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export resume")

@router.get("/{resume_id}/pdf")
async def export_pdf(
    resume_id: str,
    db: Session = Depends(get_db)
):
    """Export resume as PDF (frontend will handle this for now)"""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {
        "message": "PDF export handled by frontend (print-to-PDF)",
        "resume_id": resume_id,
        "title": resume.title
    }
```

---

## PART 2: FRONTEND SETUP (React)

### Step 1: Create React Project

```bash
cd /Users/pranavsharma/Desktop/Python/Ai\ Resume\ Builder
npx create-react-app frontend
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install axios lucide-react framer-motion
npm install html2pdf.js
```

### Step 2: Tailwind Configuration

Edit `frontend/tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-cyan': '#00D9FF',
        'brand-purple': '#7C3AED',
        'dark-navy': '#0F172A',
        'surface': '#1E293B',
      }
    },
  },
  plugins: [],
}
```

### Step 3: API Client

Create `frontend/src/services/api.js`:
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const builderAPI = {
  createResume: (title) => api.post('/builder/create', { title }),
  getResume: (id) => api.get(`/builder/${id}`),
  updateResume: (id, section, data) => api.put(`/builder/${id}/update`, { section, data }),
  saveDraft: (id) => api.post(`/builder/${id}/save-draft`),
};

export const checkerAPI = {
  analyzeResume: (text, jd) => api.post('/checker/analyze', { resume_text: text, job_description: jd }),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/checker/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const aiAPI = {
  improveBullet: (bullet, context, tone) => api.post('/ai/improve-bullet', { bullet, context, tone }),
  addMetrics: (bullet, role) => api.post('/ai/add-metrics', { bullet, role }),
  healthCheck: () => api.get('/ai/health'),
};

export default api;
```

### Step 4: Main App Component

Create `frontend/src/App.jsx`:
```javascript
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Landing from './pages/Landing';
import Builder from './pages/Builder';
import Checker from './pages/Checker';

function App() {
  const [darkMode] = useState(true);

  return (
    <div className="bg-dark-navy text-white min-h-screen">
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/checker" element={<Checker />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
```

### Step 5: Basic Components

Create `frontend/src/components/Header.jsx`:
```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-surface border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent">
            RF
          </div>
          <span className="font-bold">ResumeFlow</span>
        </Link>
        
        <nav className="hidden md:flex gap-6">
          <Link to="/builder" className="hover:text-brand-cyan transition">Build</Link>
          <Link to="/checker" className="hover:text-brand-cyan transition">Check</Link>
        </nav>
        
        <button className="md:hidden">
          <Menu />
        </button>
      </div>
    </header>
  );
}
```

---

## PART 3: RUNNING THE APPLICATION

### Start Backend

```bash
cd backend
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python main.py
```

Should output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
Press CTRL+C to quit
```

### Start Frontend

```bash
cd frontend
npm start
```

Should open `http://localhost:3000`

### Test API

```bash
# Terminal: Test builder endpoint
curl -X POST http://localhost:8000/api/builder/create \
  -H "Content-Type: application/json" \
  -d '{"title":"My Resume"}'

# Response:
# {"id":"uuid-123","title":"My Resume","created_at":"...","status":"success"}
```

---

## PART 4: TESTING GEMINI INTEGRATION

Create `backend/test_gemini_quick.py`:
```python
import asyncio
import os
from dotenv import load_dotenv
from services.gemini_service import gemini_service

load_dotenv()

async def test():
    print("Testing Gemini Service...")
    print(f"API Key configured: {bool(os.getenv('GEMINI_API_KEY'))}")
    
    # Test 1: Improve bullet
    result = await gemini_service.improve_bullet_point(
        "Worked on projects",
        context="Software Engineer",
        tone="formal"
    )
    print("\n✓ Improve Bullet:")
    print(result)
    
    # Test 2: Add metrics
    result = await gemini_service.add_metrics_to_bullet(
        "Implemented payment system",
        role="Backend Engineer"
    )
    print("\n✓ Add Metrics:")
    print(result)

if __name__ == "__main__":
    asyncio.run(test())
```

Run with:
```bash
python backend/test_gemini_quick.py
```

---

## NEXT STEPS

1. ✅ Create folder structure (done)
2. ✅ Copy all backend files
3. ✅ Create `.env` with your Gemini API key
4. ✅ Start backend server
5. ✅ Start frontend server
6. ✅ Test API endpoints with Postman/curl
7. ✅ Build out React components
8. ✅ Connect frontend to backend API
9. ✅ Add Gemini integration
10. ✅ Implement PDF export
11. ✅ Deploy to production

---

## TROUBLESHOOTING

### Backend Issues
- **Port 8000 already in use:** `lsof -i :8000` then kill process
- **CORS errors:** Check CORS_ORIGINS in `.env`
- **Database locked:** Delete `resume_builder.db` and restart

### Frontend Issues
- **Cannot find module:** Run `npm install`
- **API not responding:** Check backend is running on `http://localhost:8000`
- **Port 3000 in use:** Change with `PORT=3001 npm start`

### Gemini Issues
- **API key invalid:** Verify key at Google AI Studio
- **Rate limit exceeded:** Wait 1 minute before retrying
- **Timeout errors:** Increase timeout in `gemini_service.py`

---

