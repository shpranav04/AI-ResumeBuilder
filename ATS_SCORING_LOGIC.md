# ATS Scoring Logic & Resume Checker Implementation

## 1. ATS SCORING ALGORITHM

### Overview
The ATS score is calculated from multiple dimensions:
- **Formatting (20%):** Readability, structure, special characters
- **Keywords (30%):** Density, relevance, JD matching
- **Impact (20%):** Action verbs, metrics, clarity
- **Content (20%):** Completeness, relevance
- **Structure (10%):** Organization, sections, length

### File: `backend/services/ats_scorer.py`

```python
import re
from typing import Dict, List, Tuple
from collections import Counter
import json

class ATSScorer:
    """
    Calculate ATS compatibility score and provide detailed feedback
    """
    
    # Action verbs database (strong vs weak)
    STRONG_VERBS = {
        'led', 'designed', 'developed', 'implemented', 'created', 'built',
        'engineered', 'architected', 'achieved', 'delivered', 'launched',
        'spearheaded', 'transformed', 'pioneered', 'revolutionized',
        'optimized', 'accelerated', 'improved', 'enhanced', 'maximized',
        'initiated', 'established', 'founded', 'generated', 'increased',
        'reduced', 'decreased', 'managed', 'directed', 'oversaw'
    }
    
    WEAK_VERBS = {
        'worked', 'helped', 'did', 'made', 'responsible', 'involved',
        'participated', 'assisted', 'contributed', 'collaborated'
    }
    
    # Common ATS-breaking special characters
    ATS_BREAKING_CHARS = ['→', '•', '◆', '★', '✓', '©', '™', '®']
    
    # Keyword categories
    TECHNICAL_KEYWORDS = [
        'python', 'java', 'javascript', 'c++', 'sql', 'html', 'css',
        'react', 'angular', 'vue', 'fastapi', 'django', 'flask',
        'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'jenkins',
        'git', 'github', 'gitlab', 'rest', 'api', 'microservices',
        'agile', 'scrum', 'jira', 'linux', 'windows', 'mac'
    ]
    
    def __init__(self):
        self.total_weight = 100.0
        self.scores = {}
    
    def score_resume(self, resume_text: str, job_description: str = "") -> Dict:
        """
        Calculate comprehensive ATS score
        
        Args:
            resume_text: Full resume text
            job_description: Job description for keyword matching
        
        Returns:
            {
                "overall_score": 0-100,
                "breakdown": {
                    "formatting": { "score": 0-100, "feedback": [] },
                    "keywords": { "score": 0-100, "matched": [], "missing": [] },
                    "impact": { "score": 0-100, "feedback": [] },
                    "content": { "score": 0-100, "feedback": [] },
                    "structure": { "score": 0-100, "feedback": [] }
                },
                "critical_issues": [],
                "warnings": [],
                "improvements": []
            }
        """
        
        # Score each dimension
        formatting_score, formatting_feedback = self._score_formatting(resume_text)
        keywords_score, keywords_data = self._score_keywords(resume_text, job_description)
        impact_score, impact_feedback = self._score_impact(resume_text)
        content_score, content_feedback = self._score_content(resume_text)
        structure_score, structure_feedback = self._score_structure(resume_text)
        
        # Calculate weighted overall score
        overall_score = (
            formatting_score * 0.20 +
            keywords_score * 0.30 +
            impact_score * 0.20 +
            content_score * 0.20 +
            structure_score * 0.10
        )
        
        # Identify issues by severity
        critical_issues, warnings, improvements = self._categorize_issues(
            formatting_feedback, keywords_data, impact_feedback, 
            content_feedback, structure_feedback
        )
        
        return {
            "overall_score": round(overall_score, 1),
            "breakdown": {
                "formatting": {
                    "score": formatting_score,
                    "feedback": formatting_feedback
                },
                "keywords": {
                    "score": keywords_score,
                    "matched": keywords_data.get("matched", []),
                    "missing": keywords_data.get("missing", [])
                },
                "impact": {
                    "score": impact_score,
                    "feedback": impact_feedback
                },
                "content": {
                    "score": content_score,
                    "feedback": content_feedback
                },
                "structure": {
                    "score": structure_score,
                    "feedback": structure_feedback
                }
            },
            "critical_issues": critical_issues,
            "warnings": warnings,
            "improvements": improvements
        }
    
    def _score_formatting(self, text: str) -> Tuple[float, List[str]]:
        """Score formatting and ATS compatibility"""
        score = 100.0
        feedback = []
        
        # Check for ATS-breaking characters
        breaking_chars_found = [char for char in self.ATS_BREAKING_CHARS if char in text]
        if breaking_chars_found:
            score -= 10
            feedback.append(f"Remove special characters: {', '.join(breaking_chars_found)}")
        
        # Check for tables (ATS breaking)
        if '|' in text or '─' in text:
            score -= 15
            feedback.append("Tables detected - ATS may not parse correctly. Use text format instead.")
        
        # Check for unusual fonts/encoding issues
        if '\u200b' in text or '\ufeff' in text:
            score -= 10
            feedback.append("Hidden characters detected. Clean up encoding.")
        
        # Check line breaks structure
        lines = text.split('\n')
        if len(lines) < 10:
            score -= 5
            feedback.append("Resume seems too short. Add more content.")
        if len(lines) > 100:
            score -= 5
            feedback.append("Resume seems too long. Consider condensing to 1-2 pages.")
        
        # Check for proper spacing
        if '  ' in text:  # Double spaces
            score -= 3
            feedback.append("Remove extra spaces between words.")
        
        return max(0, score), feedback
    
    def _score_keywords(self, resume_text: str, job_description: str = "") -> Tuple[float, Dict]:
        """Score keyword density and JD matching"""
        score = 100.0
        matched_keywords = []
        missing_keywords = []
        
        resume_lower = resume_text.lower()
        
        # If JD provided, extract keywords from it
        if job_description:
            jd_lower = job_description.lower()
            
            # Extract important phrases from JD (2-3 word combinations)
            jd_keywords = self._extract_keywords(jd_lower)
            resume_keywords = self._extract_keywords(resume_lower)
            
            # Find matches
            for keyword in jd_keywords:
                if keyword in resume_keywords:
                    matched_keywords.append(keyword)
                else:
                    missing_keywords.append(keyword)
            
            # Score based on matches
            match_rate = len(matched_keywords) / max(len(jd_keywords), 1)
            score = match_rate * 100
            
            # Penalize missing keywords
            if match_rate < 0.3:
                score -= 30
            elif match_rate < 0.5:
                score -= 15
            elif match_rate < 0.7:
                score -= 5
        
        else:
            # No JD provided, just check for technical keywords
            found_keywords = []
            for keyword in self.TECHNICAL_KEYWORDS:
                if keyword in resume_lower:
                    found_keywords.append(keyword)
            
            if len(found_keywords) == 0:
                score -= 30
            elif len(found_keywords) < 3:
                score -= 15
            
            matched_keywords = found_keywords
        
        return max(0, score), {
            "matched": list(set(matched_keywords)),
            "missing": list(set(missing_keywords))
        }
    
    def _score_impact(self, text: str) -> Tuple[float, List[str]]:
        """Score impact - action verbs, metrics, clarity"""
        score = 100.0
        feedback = []
        
        text_lower = text.lower()
        lines = text.split('\n')
        
        # Count strong vs weak verbs
        strong_verb_count = 0
        weak_verb_count = 0
        no_verb_count = 0
        
        for line in lines:
            line_lower = line.lower()
            # Skip if line is empty or a heading
            if len(line) < 5 or line.isupper():
                continue
            
            has_strong = any(verb in line_lower for verb in self.STRONG_VERBS)
            has_weak = any(verb in line_lower for verb in self.WEAK_VERBS)
            
            if has_strong:
                strong_verb_count += 1
            elif has_weak:
                weak_verb_count += 1
            else:
                no_verb_count += 1
        
        # Calculate verb score
        total_bullets = strong_verb_count + weak_verb_count + no_verb_count
        if total_bullets > 0:
            strong_percent = (strong_verb_count / total_bullets) * 100
            weak_percent = (weak_verb_count / total_bullets) * 100
            
            score = (strong_percent * 0.5) + ((100 - weak_percent) * 0.5)
            
            if weak_percent > 50:
                feedback.append(f"Weak verbs detected ({weak_verb_count} instances). Replace 'worked', 'helped', 'involved' with stronger verbs like 'led', 'designed', 'achieved'.")
        
        # Check for metrics/numbers
        metrics = re.findall(r'\d+[\%\+\-]?|\$[\d\.,]+|[\d\.]+ [A-Za-z]+', text)
        if len(metrics) < 3:
            score -= 20
            feedback.append("Add quantifiable metrics. Include numbers: percentages, dollars, scale, timeline.")
        
        # Check for passive voice
        passive_indicators = ['was ', 'were ', 'been ', 'is ', 'are ']
        passive_count = sum(text.count(indicator) for indicator in passive_indicators)
        if passive_count > 5:
            score -= 10
            feedback.append("Reduce passive voice. Prefer active voice (e.g., 'Led' vs 'Was responsible for').")
        
        return max(0, score), feedback
    
    def _score_content(self, text: str) -> Tuple[float, List[str]]:
        """Score content completeness and organization"""
        score = 100.0
        feedback = []
        
        sections_required = ['experience', 'education', 'skills']
        sections_found = []
        
        text_lower = text.lower()
        
        if 'experience' in text_lower or 'employment' in text_lower:
            sections_found.append('experience')
        if 'education' in text_lower or 'degree' in text_lower:
            sections_found.append('education')
        if 'skills' in text_lower or 'technical' in text_lower:
            sections_found.append('skills')
        
        # Check completeness
        for section in sections_required:
            if section not in sections_found:
                score -= 20
                feedback.append(f"Missing '{section}' section. Add it to improve completeness.")
        
        # Check for professional summary or objective
        if 'summary' in text_lower or 'objective' in text_lower or 'profile' in text_lower:
            score += 5
        else:
            feedback.append("Consider adding a professional summary (2-3 sentences).")
        
        # Check contact info
        if '@' not in text:  # Email
            score -= 10
            feedback.append("Missing email address. Add your contact information.")
        
        if re.search(r'\d{3}[-\.]?\d{3}[-\.]?\d{4}', text) is None:  # Phone
            feedback.append("Consider adding phone number for completeness.")
        
        return max(0, score), feedback
    
    def _score_structure(self, text: str) -> Tuple[float, List[str]]:
        """Score organization and readability"""
        score = 100.0
        feedback = []
        
        lines = text.split('\n')
        
        # Check for clear headings
        headings = [line for line in lines if line.isupper() and len(line) < 30]
        if len(headings) < 3:
            score -= 15
            feedback.append("Use clear section headings in CAPS (e.g., EXPERIENCE, EDUCATION, SKILLS).")
        
        # Check line length (80 chars is optimal)
        long_lines = [line for line in lines if len(line) > 100]
        if len(long_lines) > len(lines) * 0.3:
            score -= 10
            feedback.append("Some lines are very long. Break them into smaller chunks for readability.")
        
        # Check for bullets/proper formatting
        bullet_count = text.count('•') + text.count('-') + text.count('*')
        if bullet_count == 0:
            score -= 20
            feedback.append("Use bullet points (•) to structure information. Improves readability and ATS parsing.")
        
        # Check page length
        word_count = len(text.split())
        if word_count < 200:
            score -= 10
            feedback.append("Resume seems short. Add more relevant content.")
        elif word_count > 1500:
            score -= 10
            feedback.append("Resume seems long. Aim for 1-2 pages (200-1000 words).")
        
        return max(0, score), feedback
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text"""
        # Simple keyword extraction (can be enhanced with NLP)
        words = text.split()
        # Filter short words and common words
        stopwords = {'the', 'a', 'an', 'and', 'or', 'in', 'at', 'to', 'for', 'of', 'is', 'was', 'are'}
        keywords = [w for w in words if len(w) > 3 and w not in stopwords]
        return keywords
    
    def _categorize_issues(self, *feedback_lists) -> Tuple[List, List, List]:
        """Categorize issues by severity"""
        critical_issues = []
        warnings = []
        improvements = []
        
        for feedback_list in feedback_lists:
            if not feedback_list:
                continue
            
            for item in feedback_list:
                if any(x in item.lower() for x in ['missing', 'remove', 'avoid', 'breaks']):
                    critical_issues.append(item)
                elif any(x in item.lower() for x in ['consider', 'try', 'reduce']):
                    improvements.append(item)
                else:
                    warnings.append(item)
        
        return critical_issues, warnings, improvements


# ========== USAGE EXAMPLE ==========

def example_usage():
    scorer = ATSScorer()
    
    sample_resume = """
JOHN DOE
john@example.com | (555) 123-4567 | LinkedIn.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced Software Engineer with 5+ years building scalable web applications.
Expert in Python, FastAPI, and cloud technologies.

EXPERIENCE

Senior Software Engineer | TechCorp | 2022-Present
• Led development of REST API serving 50K+ daily users
• Improved system performance by 40% through optimization
• Designed microservices architecture reducing latency by 30%
• Mentored team of 3 junior developers

Software Engineer | StartupXYZ | 2020-2022
• Built payment processing system handling $5M+ annually
• Implemented CI/CD pipeline reducing deployment time by 60%
• Developed React frontend with 95%+ unit test coverage

EDUCATION
Bachelor of Science in Computer Science | State University | 2020

SKILLS
Languages: Python, JavaScript, Java
Frameworks: FastAPI, Django, React, Vue.js
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS (EC2, S3, Lambda), Google Cloud Platform
Tools: Docker, Kubernetes, Git, Jenkins
"""
    
    sample_jd = """
We are seeking a Senior Python Developer with experience in FastAPI and AWS.
Requirements:
- 5+ years backend development
- Proficiency in Python and FastAPI
- AWS certification preferred
- Experience with Docker and Kubernetes
- Strong communication skills
- Agile/Scrum experience
"""
    
    result = scorer.score_resume(sample_resume, sample_jd)
    
    print(f"\n=== ATS SCORE REPORT ===")
    print(f"Overall Score: {result['overall_score']}/100")
    print(f"\nBreakdown:")
    for category, data in result['breakdown'].items():
        print(f"  {category.upper()}: {data['score']}/100")
    
    print(f"\nCritical Issues: {len(result['critical_issues'])}")
    for issue in result['critical_issues']:
        print(f"  ❌ {issue}")
    
    print(f"\nWarnings: {len(result['warnings'])}")
    for warning in result['warnings']:
        print(f"  ⚠️  {warning}")
    
    print(f"\nImprovements: {len(result['improvements'])}")
    for improvement in result['improvements']:
        print(f"  ✨ {improvement}")
    
    return result


if __name__ == "__main__":
    example_usage()
```

---

## 2. FASTAPI ENDPOINT FOR ATS SCORING

### File: `backend/routes/checker.py`

```python
from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional
import logging
from services.ats_scorer import ATSScorer
from services.resume_parser import ResumeParser

router = APIRouter(prefix="/api/checker", tags=["Checker"])
logger = logging.getLogger(__name__)

scorer = ATSScorer()
parser = ResumeParser()

class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None

@router.post("/analyze")
async def analyze_resume(request: AnalysisRequest):
    """
    Analyze resume and calculate ATS score
    
    Example:
    {
      "resume_text": "JOHN DOE\njohn@example.com...",
      "job_description": "We are seeking..."
    }
    """
    try:
        if len(request.resume_text) < 100:
            raise HTTPException(status_code=400, detail="Resume text too short")
        
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
    """
    Upload resume file (PDF, DOCX, TXT) and extract text
    """
    try:
        # Read file
        content = await file.read()
        
        # Parse based on file type
        if file.filename.endswith('.pdf'):
            text = parser.parse_pdf(content)
        elif file.filename.endswith('.docx'):
            text = parser.parse_docx(content)
        elif file.filename.endswith('.txt'):
            text = content.decode('utf-8')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        return {
            "status": "success",
            "extracted_text": text
        }
    
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse resume")
```

---

## 3. SCORING DASHBOARD RESPONSE

The frontend will receive this structure and visualize it:

```json
{
  "overall_score": 78.3,
  "breakdown": {
    "formatting": {
      "score": 85,
      "feedback": ["Remove special characters: →, ◆"]
    },
    "keywords": {
      "score": 72,
      "matched": ["Python", "FastAPI", "AWS", "Docker"],
      "missing": ["Kubernetes", "Microservices"]
    },
    "impact": {
      "score": 80,
      "feedback": ["Add quantifiable metrics", "Reduce passive voice"]
    },
    "content": {
      "score": 75,
      "feedback": ["Missing LinkedIn URL"]
    },
    "structure": {
      "score": 80,
      "feedback": []
    }
  },
  "critical_issues": [
    "Remove special characters",
    "Add more action verbs"
  ],
  "warnings": [
    "Resume seems long",
    "Add professional summary"
  ],
  "improvements": [
    "Quantify metrics further",
    "Emphasize business impact"
  ]
}
```

---

## 4. SCORING FORMULA BREAKDOWN

### Overall Score Calculation
```
Overall Score = (
  Formatting Score    × 0.20 +
  Keywords Score      × 0.30 +
  Impact Score        × 0.20 +
  Content Score       × 0.20 +
  Structure Score     × 0.10
)
```

### Scoring Ranges
- **90-100:** Excellent - ATS-optimized, highly competitive
- **75-89:** Good - Minor improvements needed
- **60-74:** Fair - Several issues should be addressed
- **40-59:** Poor - Major revisions recommended
- **0-39:** Very Poor - Significant restructuring needed

---

## 5. VISUAL DASHBOARD COMPONENTS (React)

### `components/ScoringDashboard.jsx`

```jsx
import React from 'react';
import { PieChart, BarChart, AlertCircle } from 'lucide-react';

export const ScoringDashboard = ({ analysis }) => {
  const { overall_score, breakdown, critical_issues } = analysis;
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-cyan-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500/50';
    if (score >= 75) return 'bg-cyan-500/20 border-cyan-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };
  
  return (
    <div className="space-y-6">
      {/* Main Score */}
      <div className={`border rounded-lg p-8 text-center ${getScoreBg(overall_score)}`}>
        <div className={`text-6xl font-bold ${getScoreColor(overall_score)}`}>
          {overall_score}
        </div>
        <div className="text-gray-400 mt-2">ATS Compatibility Score</div>
      </div>
      
      {/* Critical Issues */}
      {critical_issues.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-red-400" />
            <span className="font-bold text-red-400">Critical Issues ({critical_issues.length})</span>
          </div>
          <ul className="space-y-2">
            {critical_issues.map((issue, idx) => (
              <li key={idx} className="text-gray-300 text-sm">❌ {issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(breakdown).map(([category, data]) => (
          <div key={category} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="text-sm text-gray-400 capitalize">{category}</div>
            <div className={`text-3xl font-bold mt-2 ${getScoreColor(data.score)}`}>
              {data.score}
            </div>
            <div className="w-full bg-slate-600 h-2 rounded mt-2">
              <div
                className={`bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded`}
                style={{ width: `${data.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Keyword Matches */}
      {breakdown.keywords.matched.length > 0 && (
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <h3 className="font-bold text-cyan-400 mb-3">Keywords Matched</h3>
          <div className="flex flex-wrap gap-2">
            {breakdown.keywords.matched.map((keyword, idx) => (
              <span key={idx} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                ✓ {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Missing Keywords */}
      {breakdown.keywords.missing.length > 0 && (
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
          <h3 className="font-bold text-amber-400 mb-3">Missing Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {breakdown.keywords.missing.map((keyword, idx) => (
              <span key={idx} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                + {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoringDashboard;
```

---

## 6. TESTING ATS SCORER

```python
# test_ats_scorer.py

from services.ats_scorer import ATSScorer

def test_scorer():
    scorer = ATSScorer()
    
    # Test with weak resume
    weak_resume = "Worked on various projects and helped team."
    result = scorer.score_resume(weak_resume)
    assert result['overall_score'] < 50
    assert len(result['critical_issues']) > 0
    print("✓ Weak resume correctly scored low")
    
    # Test with strong resume
    strong_resume = """
    JOHN DOE | john@example.com | (555) 123-4567
    
    PROFESSIONAL SUMMARY
    Senior Engineer with 5+ years of experience building scalable applications.
    
    EXPERIENCE
    Senior Engineer | TechCorp | 2022-Present
    • Led development of API serving 100K+ users, increasing performance by 45%
    • Designed microservices architecture reducing latency by 60%
    • Implemented CI/CD pipeline reducing deployment time by 80%
    
    EDUCATION
    BS Computer Science | University | 2018
    
    SKILLS
    Python, FastAPI, AWS, Docker, Kubernetes
    """
    
    jd = "Seeking Senior Python developer with FastAPI and AWS experience."
    result = scorer.score_resume(strong_resume, jd)
    assert result['overall_score'] > 70
    print("✓ Strong resume correctly scored high")
    
    print(f"\nTest passed! Overall score: {result['overall_score']}")

if __name__ == "__main__":
    test_scorer()
```

---

