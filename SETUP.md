# SETUP INSTRUCTIONS - Run These Commands Now

Follow this guide to set up your project structure and initialize everything.

---

## STEP 1: CREATE FOLDER STRUCTURE

```bash
cd /Users/pranavsharma/Desktop/Python/Ai\ Resume\ Builder

# Create backend folders
mkdir -p backend/database
mkdir -p backend/schemas
mkdir -p backend/routes
mkdir -p backend/services
mkdir -p backend/utils
mkdir -p backend/logs

# Create frontend folders (will be done by create-react-app)
# Will create later

echo "✅ Backend folder structure created"
```

---

## STEP 2: CREATE BACKEND FILES

### Create `backend/requirements.txt`

```bash
cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
sqlalchemy==2.0.23
python-dotenv==1.0.0
google-generativeai==0.3.0
python-multipart==0.0.6
aiofiles==23.2.1
EOF

echo "✅ requirements.txt created"
```

### Create `backend/.env.example`

```bash
cat > backend/.env.example << 'EOF'
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
EOF

echo "✅ .env.example created"
```

### Create `backend/.env` (with placeholder)

```bash
cat > backend/.env << 'EOF'
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
DATABASE_URL=sqlite:///./resume_builder.db
GEMINI_API_KEY=your-actual-key-here
GEMINI_MODEL=gemini-pro
CORS_ORIGINS=["http://localhost:3000"]
LOG_LEVEL=INFO
EOF

echo "✅ .env created (REMEMBER: Add your Gemini API key!)"
```

### Create `backend/__init__.py`

```bash
touch backend/__init__.py
echo "✅ __init__.py created"
```

### Create `backend/main.py`

```bash
cat > backend/main.py << 'EOF'
"""
FastAPI Application Entry Point
AI Resume Builder + Checker
"""

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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
from database.db import engine, Base
Base.metadata.create_all(bind=engine)

# Health check
@app.get("/")
async def root():
    return {
        "message": "AI Resume Builder API",
        "version": "1.0.0",
        "docs": "/docs"
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
EOF

echo "✅ main.py created"
```

### Create `backend/config.py`

```bash
cat > backend/config.py << 'EOF'
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    database_url: str = "sqlite:///./resume_builder.db"
    gemini_api_key: str
    gemini_model: str = "gemini-pro"
    cors_origins: List[str] = ["http://localhost:3000"]
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
EOF

echo "✅ config.py created"
```

### Create database module

```bash
# Create __init__.py files
touch backend/database/__init__.py
touch backend/schemas/__init__.py
touch backend/routes/__init__.py
touch backend/services/__init__.py
touch backend/utils/__init__.py

cat > backend/database/db.py << 'EOF'
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resume_builder.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
EOF

echo "✅ Database module created"
```

### Create models

```bash
cat > backend/database/models.py << 'EOF'
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
    
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, default="Untitled Resume")
    
    contact_info = Column(JSON, default={})
    professional_summary = Column(Text, default="")
    experience = Column(JSON, default=[])
    education = Column(JSON, default=[])
    skills = Column(JSON, default=[])
    certifications = Column(JSON, default=[])
    projects = Column(JSON, default=[])
    
    template_style = Column(String, default="modern")
    tone = Column(String, default="formal")
    
    version = Column(Integer, default=1)
    is_draft = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="resumes")
    feedback = relationship("ResumeFeedback", back_populates="resume", cascade="all, delete-orphan")

class ResumeFeedback(Base):
    __tablename__ = "resume_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(String, ForeignKey("resumes.id"), index=True)
    
    ats_score = Column(Integer, default=0)
    clarity_score = Column(Integer, default=0)
    impact_score = Column(Integer, default=0)
    overall_score = Column(Integer, default=0)
    
    feedback_data = Column(JSON, default={})
    keyword_matches = Column(JSON, default={})
    job_description = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    resume = relationship("Resume", back_populates="feedback")
EOF

echo "✅ Models created"
```

### Create schemas

```bash
cat > backend/schemas/resume.py << 'EOF'
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class ResumeCreateSchema(BaseModel):
    title: str = "My Resume"
    template_style: str = "modern"
    tone: str = "formal"

class ResumeUpdateSchema(BaseModel):
    section: str
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
EOF

echo "✅ Schemas created"
```

### Create minimal routes

```bash
cat > backend/routes/builder.py << 'EOF'
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import uuid4
import logging

from database.db import get_db
from database.models import Resume
from schemas.resume import ResumeCreateSchema, ResumeUpdateSchema, ResumeResponseSchema

router = APIRouter(prefix="/api/builder", tags=["Builder"])
logger = logging.getLogger(__name__)

@router.post("/create", response_model=ResumeResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_resume(request: ResumeCreateSchema, db: Session = Depends(get_db)):
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
async def get_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.put("/{resume_id}/update", response_model=ResumeResponseSchema)
async def update_resume(resume_id: str, request: ResumeUpdateSchema, db: Session = Depends(get_db)):
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        setattr(resume, request.section, request.data)
        resume.version += 1
        
        db.commit()
        db.refresh(resume)
        return resume
    except Exception as e:
        logger.error(f"Error updating resume: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update resume")
EOF

echo "✅ Builder routes created"
```

### Create placeholder checker routes

```bash
cat > backend/routes/checker.py << 'EOF'
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/checker", tags=["Checker"])

class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None

@router.post("/analyze")
async def analyze_resume(request: AnalysisRequest):
    if len(request.resume_text) < 100:
        raise HTTPException(status_code=400, detail="Resume text too short")
    
    return {
        "status": "success",
        "message": "Checker endpoint ready - implement ATS scorer"
    }
EOF

echo "✅ Checker routes created"
```

### Create placeholder AI routes

```bash
cat > backend/routes/ai.py << 'EOF'
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/ai", tags=["AI"])

class BulletPointRequest(BaseModel):
    bullet: str
    context: Optional[str] = ""
    tone: str = "formal"

@router.post("/improve-bullet")
async def improve_bullet(request: BulletPointRequest):
    if len(request.bullet) < 5:
        raise HTTPException(status_code=400, detail="Bullet too short")
    
    return {
        "status": "success",
        "message": "AI endpoint ready - implement Gemini"
    }

@router.get("/health")
async def health_check():
    return {"status": "healthy", "api_connected": False, "message": "Gemini not configured yet"}
EOF

echo "✅ AI routes created"
```

### Create export routes

```bash
cat > backend/routes/export.py << 'EOF'
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json

from database.db import get_db
from database.models import Resume

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.get("/{resume_id}/json")
async def export_json(resume_id: str, db: Session = Depends(get_db)):
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
    }
    
    return JSONResponse(
        content=resume_data,
        headers={"Content-Disposition": f"attachment; filename={resume.title}.json"}
    )
EOF

echo "✅ Export routes created"
```

### Update main.py to include routers

```bash
cat > backend/main.py << 'EOF'
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Resume Builder",
    description="Build, optimize, and export resumes with AI assistance",
    version="1.0.0"
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database.db import engine, Base
Base.metadata.create_all(bind=engine)

from routes import builder, checker, ai, export
app.include_router(builder.router)
app.include_router(checker.router)
app.include_router(ai.router)
app.include_router(export.router)

@app.get("/")
async def root():
    return {
        "message": "AI Resume Builder API",
        "version": "1.0.0",
        "docs": "/docs"
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
        reload=True
    )
EOF

echo "✅ Backend fully initialized"
```

---

## STEP 3: SETUP FRONTEND

```bash
cd /Users/pranavsharma/Desktop/Python/Ai\ Resume\ Builder

npx create-react-app frontend

cd frontend

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

npm install axios lucide-react framer-motion html2pdf.js

echo "✅ Frontend initialized"
```

### Setup Tailwind

```bash
cat > frontend/tailwind.config.js << 'EOF'
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
EOF

echo "✅ Tailwind configured"
```

---

## STEP 4: TEST BACKEND

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Test in another terminal:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

curl -X POST http://localhost:8000/api/builder/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Resume"}'
# Should return resume with ID
```

---

## STEP 5: TEST FRONTEND

```bash
cd frontend
npm start
```

Should open `http://localhost:3000`

---

## STEP 6: NEXT STEPS

1. ✅ Backend running on port 8000
2. ✅ Frontend running on port 3000
3. ⏭️ Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. ⏭️ Add key to `backend/.env`
5. ⏭️ Implement ATS scorer (see `ATS_SCORING_LOGIC.md`)
6. ⏭️ Implement Gemini service (see `GEMINI_INTEGRATION.md`)
7. ⏭️ Build React components (see `WOW_FEATURES.md`)

---

## TROUBLESHOOTING

### Port 8000 already in use
```bash
lsof -i :8000
kill -9 <PID>
```

### Port 3000 already in use
```bash
PORT=3001 npm start
```

### Module not found errors
```bash
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

### Database locked
```bash
rm backend/resume_builder.db
# Restart backend
```

---

## YOUR CURRENT STATUS

✅ Backend structure complete
✅ Database models created
✅ API routes initialized
✅ Frontend setup complete
✅ Tailwind configured

**You're ready to start coding the core features!**

Next: Follow `DEVELOPMENT_ROADMAP.md` Week 1 to add:
- Resume builder form
- Live preview
- ATS scoring
- PDF export

---

