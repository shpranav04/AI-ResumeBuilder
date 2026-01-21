import os
from io import BytesIO
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from PyPDF2 import PdfReader
from docx import Document
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class ResumePayload(BaseModel):
    name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    summary: str = ""
    skills: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)


class ScoreResponse(BaseModel):
    score: int
    feedback: List[str]


app = FastAPI(title="AI Resume Builder API", version="0.1.0")

allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Resume Builder API is running."}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/score", response_model=ScoreResponse)
def score_resume(payload: ResumePayload):
    feedback = []
    score = 50

    missing_contact = [
        label
        for label, value in [
            ("email", payload.email),
            ("phone", payload.phone),
            ("location", payload.location),
        ]
        if not value.strip()
    ]
    if missing_contact:
        feedback.append(f"Add missing contact details: {', '.join(missing_contact)}.")
    else:
        score += 5

    if len(payload.summary.strip()) >= 80:
        score += 10
    else:
        feedback.append("Expand your summary to 2-3 concise sentences.")

    if len(payload.skills) >= 6:
        score += 10
    else:
        feedback.append("Add at least 6 relevant skills.")

    if len(payload.experience) >= 4:
        score += 15
    else:
        feedback.append("Add more experience bullet points with impact metrics.")

    impact_keywords = ("increased", "reduced", "improved", "delivered", "launched", "owned")
    if any(keyword in " ".join(payload.experience).lower() for keyword in impact_keywords):
        score += 5
    else:
        feedback.append("Add impact verbs (e.g., increased, improved, delivered) in experience.")

    if payload.education:
        score += 5
    else:
        feedback.append("Include education details.")

    if payload.projects:
        score += 5
    else:
        feedback.append("List 1-2 projects to showcase applied skills.")

    score = min(score, 100)
    if not feedback:
        feedback.append("Strong resume. Consider tailoring keywords to each job description.")
    return ScoreResponse(score=score, feedback=feedback)


def score_from_text(text: str) -> ScoreResponse:
    feedback = []
    score = 50
    normalized = text.lower()

    if len(text) >= 800:
        score += 10
    else:
        feedback.append("Add more detail (aim for 350-500 words).")

    if "skills" in normalized:
        score += 8
    else:
        feedback.append("Include a dedicated skills section.")

    if any(keyword in normalized for keyword in ["experience", "work history", "employment"]):
        score += 12
    else:
        feedback.append("Add an experience section with impact-focused bullets.")

    if any(keyword in normalized for keyword in ["education", "degree", "university", "college"]):
        score += 6
    else:
        feedback.append("Add education details.")

    bullet_lines = [line for line in text.splitlines() if line.strip().startswith(("-", "•"))]
    if len(bullet_lines) >= 5:
        score += 10
    else:
        feedback.append("Use more bullet points to highlight achievements.")

    if "@" in normalized:
        score += 5
    else:
        feedback.append("Add an email address for contact info.")

    score = min(score, 100)
    if not feedback:
        feedback.append("Resume looks solid. Customize it for the target role and keywords.")
    return ScoreResponse(score=score, feedback=feedback)


def extract_text_from_upload(filename: str, content: bytes) -> str:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension in {"txt", "md"}:
        return content.decode("utf-8", errors="ignore")

    if extension == "pdf":
        reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if extension == "docx":
        doc = Document(BytesIO(content))
        return "\n".join(paragraph.text for paragraph in doc.paragraphs)

    raise HTTPException(status_code=400, detail="Unsupported file type.")


@app.post("/api/score-file", response_model=ScoreResponse)
async def score_resume_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        text = extract_text_from_upload(file.filename, content)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to read file.") from exc

    return score_from_text(text)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
