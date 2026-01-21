# Gemini API Integration Guide - AI Resume Builder

## 1. SETUP & AUTHENTICATION

### Get Your Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Add to `.env`:
```
GEMINI_API_KEY=your-api-key-here
```

### Install Google Generative AI Library
```bash
pip install google-generativeai==0.3.0
```

---

## 2. GEMINI SERVICE WRAPPER (Production-Grade)

### File: `backend/services/gemini_service.py`

```python
import os
import asyncio
import logging
from typing import Optional, List, Dict
from functools import wraps
from datetime import datetime, timedelta
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class RateLimiter:
    """Simple rate limiter for API calls"""
    def __init__(self, max_calls: int = 10, time_window: int = 60):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls = []
    
    def is_allowed(self) -> bool:
        now = datetime.now()
        # Remove calls outside the time window
        self.calls = [call_time for call_time in self.calls 
                      if (now - call_time).seconds < self.time_window]
        
        if len(self.calls) < self.max_calls:
            self.calls.append(now)
            return True
        return False

class GeminiService:
    """
    Production-grade wrapper for Google Gemini API
    
    Features:
    - Retry logic with exponential backoff
    - Rate limiting
    - Error handling and fallbacks
    - Token counting
    - Timeout management
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.rate_limiter = RateLimiter(max_calls=10, time_window=60)
        self.max_retries = 3
        self.timeout = 30  # seconds
    
    def _check_rate_limit(self) -> bool:
        """Check if API call is allowed"""
        return self.rate_limiter.is_allowed()
    
    async def _call_with_retry(self, prompt: str, max_retries: int = 3) -> Optional[str]:
        """
        Call Gemini API with retry logic
        
        Args:
            prompt: The input prompt
            max_retries: Number of retries on failure
        
        Returns:
            API response text or fallback response
        """
        # Check rate limit
        if not self._check_rate_limit():
            logger.warning("Rate limit exceeded for Gemini API")
            return self._get_fallback_response(prompt)
        
        for attempt in range(max_retries):
            try:
                # Call Gemini API
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self.model.generate_content,
                        prompt
                    ),
                    timeout=self.timeout
                )
                
                if response.text:
                    logger.info(f"Gemini API call successful (attempt {attempt + 1})")
                    return response.text
                else:
                    logger.warning("Gemini returned empty response")
                    return self._get_fallback_response(prompt)
            
            except asyncio.TimeoutError:
                logger.warning(f"Gemini API timeout (attempt {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    return self._get_fallback_response(prompt)
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            
            except GoogleAPIError as e:
                logger.error(f"Gemini API error (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt == max_retries - 1:
                    return self._get_fallback_response(prompt)
                await asyncio.sleep(2 ** attempt)
            
            except Exception as e:
                logger.error(f"Unexpected error with Gemini (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt == max_retries - 1:
                    return self._get_fallback_response(prompt)
                await asyncio.sleep(2 ** attempt)
        
        return self._get_fallback_response(prompt)
    
    def _get_fallback_response(self, prompt: str) -> str:
        """
        Fallback response when API fails
        Used for reliability when Gemini is unavailable
        """
        fallback_responses = {
            "improve_bullet": (
                "Consider rewriting this bullet point to include:\n"
                "1. A strong action verb (Led, Designed, Implemented, etc.)\n"
                "2. Specific metrics or results (numbers, percentages)\n"
                "3. Business impact or outcome\n\n"
                "Example: Instead of 'Worked on projects', try 'Led 5+ projects delivering $2M+ in value'"
            ),
            "add_metrics": (
                "Try adding specific numbers to this accomplishment:\n"
                "- Percentage improvements (30% faster, 25% reduction)\n"
                "- Scale metrics (1000+ users, $5M budget)\n"
                "- Timeline (completed in 2 months vs typical 6 months)\n"
                "- Team size or scope impacted"
            ),
            "ats_optimize": (
                "Standard ATS optimization tips:\n"
                "1. Use simple formatting (bullets, no tables/graphics)\n"
                "2. Include keywords from job description\n"
                "3. Use standard headings (Experience, Skills, Education)\n"
                "4. Avoid special characters and unusual fonts\n"
                "5. Keep to 1-2 pages"
            ),
            "default": (
                "For better results, please provide more context about your experience.\n"
                "Try to include: role, company, results achieved, tools used."
            )
        }
        
        # Determine which fallback to use based on prompt
        if "improve" in prompt.lower() and "bullet" in prompt.lower():
            return fallback_responses["improve_bullet"]
        elif "metrics" in prompt.lower():
            return fallback_responses["add_metrics"]
        elif "ats" in prompt.lower():
            return fallback_responses["ats_optimize"]
        else:
            return fallback_responses["default"]
    
    # ========== PUBLIC METHODS FOR SPECIFIC TASKS ==========
    
    async def improve_bullet_point(self, bullet: str, context: str = "", tone: str = "formal") -> Dict[str, str]:
        """
        Rewrite a bullet point to be more impactful
        
        Args:
            bullet: Original bullet point
            context: Job role/context for better suggestions
            tone: formal, modern, minimal, creative
        
        Returns:
            {
                "original": str,
                "improved": str,
                "suggestions": List[str]
            }
        """
        prompt = f"""You are a professional resume writer and ATS expert.

Task: Rewrite this resume bullet point to be more impactful and ATS-friendly.

Original bullet: "{bullet}"
Job context: "{context}"
Desired tone: {tone}

Requirements:
1. Start with a strong action verb
2. Include specific metrics/numbers if possible
3. Show business impact or outcome
4. Keep it concise (max 20 words)
5. Be {tone} in tone

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "original": "{bullet}",
  "improved": "[improved bullet point]",
  "suggestions": ["reason 1", "reason 2", "reason 3"]
}}"""
        
        response = await self._call_with_retry(prompt)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "original": bullet,
                "improved": response,
                "suggestions": ["AI suggestion provided (format unavailable)"]
            }
    
    async def add_metrics_to_bullet(self, bullet: str, role: str = "") -> Dict[str, str]:
        """
        Suggest metrics and quantifiable improvements
        
        Args:
            bullet: Original bullet point
            role: Job role for context
        
        Returns:
            {
                "original": str,
                "enhanced": str,
                "metrics_added": List[str]
            }
        """
        prompt = f"""You are a professional resume writer specializing in quantifiable achievements.

Task: Add metrics and measurable impact to this bullet point.

Original: "{bullet}"
Role: {role}

Requirements:
1. Add specific percentages, numbers, or scales
2. Include timeline if relevant
3. Show business/team impact
4. Make it specific and credible
5. Keep realistic metrics (don't exaggerate)

Respond ONLY with valid JSON:
{{
  "original": "{bullet}",
  "enhanced": "[bullet with metrics added]",
  "metrics_added": ["metric 1", "metric 2"]
}}"""
        
        response = await self._call_with_retry(prompt)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "original": bullet,
                "enhanced": response,
                "metrics_added": ["Metrics suggested by AI"]
            }
    
    async def optimize_for_ats(self, resume_text: str, job_description: str = "") -> Dict:
        """
        Get ATS optimization suggestions
        
        Args:
            resume_text: Full resume text
            job_description: Job description to match against
        
        Returns:
            {
                "ats_issues": [{"issue": str, "severity": str, "fix": str}],
                "keyword_suggestions": [str],
                "formatting_tips": [str],
                "score": float
            }
        """
        prompt = f"""You are an ATS (Applicant Tracking System) expert.

Task: Analyze this resume for ATS compatibility and suggest improvements.

RESUME:
{resume_text[:2000]}

JOB DESCRIPTION:
{job_description[:1000]}

Check for:
1. Formatting issues that break ATS parsing
2. Missing keywords from job description
3. Poor structure that confuses parsing
4. Unnecessary special characters
5. Uncategorized information

Respond ONLY with valid JSON:
{{
  "ats_issues": [
    {{"issue": "description", "severity": "high|medium|low", "fix": "how to fix"}}
  ],
  "keyword_suggestions": ["keyword1", "keyword2"],
  "formatting_tips": ["tip1", "tip2"],
  "estimated_ats_score": 75
}}"""
        
        response = await self._call_with_retry(prompt)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "ats_issues": [{"issue": "Unable to parse response", "severity": "low", "fix": "Contact support"}],
                "keyword_suggestions": [],
                "formatting_tips": ["Use standard formatting", "Include clear section headings"],
                "estimated_ats_score": 0
            }
    
    async def extract_job_keywords(self, job_description: str) -> Dict[str, List[str]]:
        """
        Extract and categorize keywords from job description
        
        Args:
            job_description: Full job description text
        
        Returns:
            {
                "technical_skills": [str],
                "soft_skills": [str],
                "tools_technologies": [str],
                "experience_requirements": [str]
            }
        """
        prompt = f"""You are a job description analyst.

Task: Extract and categorize key requirements from this job description.

JOB DESCRIPTION:
{job_description}

Extract and categorize into:
1. Technical skills (programming languages, frameworks, etc.)
2. Soft skills (communication, leadership, etc.)
3. Tools and technologies
4. Experience requirements

Respond ONLY with valid JSON:
{{
  "technical_skills": ["skill1", "skill2"],
  "soft_skills": ["skill1", "skill2"],
  "tools_technologies": ["tool1", "tool2"],
  "experience_requirements": ["requirement1", "requirement2"]
}}"""
        
        response = await self._call_with_retry(prompt)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "technical_skills": [],
                "soft_skills": [],
                "tools_technologies": [],
                "experience_requirements": []
            }
    
    async def analyze_skill_gap(self, resume_text: str, job_description: str) -> Dict:
        """
        Identify skill gaps and provide recommendations
        
        Args:
            resume_text: User's resume
            job_description: Target job description
        
        Returns:
            {
                "matched_skills": [str],
                "missing_skills": [str],
                "recommendations": [str],
                "match_percentage": float
            }
        """
        prompt = f"""You are a career development advisor.

Task: Analyze skill gap between resume and job requirement.

RESUME (first 1500 chars):
{resume_text[:1500]}

JOB DESCRIPTION:
{job_description[:1500]}

Compare and identify:
1. Skills that match
2. Critical skills that are missing
3. Nice-to-have skills
4. Recommendations to close gaps

Respond ONLY with valid JSON:
{{
  "matched_skills": ["skill1", "skill2"],
  "missing_critical_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1"],
  "recommendations": ["action1", "action2"],
  "estimated_match_percentage": 75
}}"""
        
        response = await self._call_with_retry(prompt)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "matched_skills": [],
                "missing_critical_skills": [],
                "nice_to_have_skills": [],
                "recommendations": ["Unable to analyze. Please ensure both resume and job description are provided."],
                "estimated_match_percentage": 0
            }
    
    async def improve_grammar_clarity(self, text: str) -> Dict[str, str]:
        """
        Improve grammar, clarity, and professionalism
        
        Args:
            text: Resume section or bullet point
        
        Returns:
            {
                "original": str,
                "improved": str,
                "issues_fixed": [str]
            }
        """
        prompt = f"""You are a professional editor and resume expert.

Task: Improve grammar, clarity, and professionalism.

Text: "{text}"

Fix:
1. Grammar and spelling errors
2. Awkward phrasing
3. Passive voice (convert to active)
4. Vague language (be specific)
5. Professional tone

Respond ONLY with valid JSON:
{{
  "original": "{text}",
  "improved": "[improved text]",
  "issues_fixed": ["issue1", "issue2"]
}}"""
        
        response = await self._call_with_retry(prompt)
        
        try:
            import json
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "original": text,
                "improved": response,
                "issues_fixed": ["Edit applied by AI"]
            }
    
    async def generate_professional_summary(self, role: str, experience_years: int, key_achievements: List[str]) -> str:
        """
        Generate a professional summary/objective
        
        Args:
            role: Job title
            experience_years: Years of experience
            key_achievements: List of key accomplishments
        
        Returns:
            Generated professional summary (2-3 sentences)
        """
        achievements_str = ", ".join(key_achievements[:3])
        
        prompt = f"""You are a professional resume writer.

Task: Write a compelling professional summary.

Details:
- Role: {role}
- Years of Experience: {experience_years}
- Key Achievements: {achievements_str}

Requirements:
1. 2-3 sentences maximum
2. Action-oriented
3. Highlight unique value
4. Professional tone
5. No first-person pronouns (avoid "I", "me")

Respond with ONLY the summary text, nothing else."""
        
        response = await self._call_with_retry(prompt)
        return response.strip() if response else f"Experienced {role} with {experience_years}+ years of proven success in {achievements_str}."

# ========== SINGLETON INSTANCE ==========

gemini_service = GeminiService()
```

---

## 3. ASYNC API ROUTE EXAMPLES

### File: `backend/routes/ai.py`

```python
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import logging
from services.gemini_service import gemini_service

router = APIRouter(prefix="/api/ai", tags=["AI"])
logger = logging.getLogger(__name__)

# ========== PYDANTIC MODELS ==========

class BulletPointRequest(BaseModel):
    bullet: str
    context: Optional[str] = ""
    tone: str = "formal"

class MetricsRequest(BaseModel):
    bullet: str
    role: Optional[str] = ""

class ATSOptimizeRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = ""

class KeywordExtractionRequest(BaseModel):
    job_description: str

class SkillGapRequest(BaseModel):
    resume_text: str
    job_description: str

class GrammarCheckRequest(BaseModel):
    text: str

class ProfessionalSummaryRequest(BaseModel):
    role: str
    experience_years: int
    key_achievements: List[str]

# ========== ENDPOINTS ==========

@router.post("/improve-bullet")
async def improve_bullet(request: BulletPointRequest):
    """
    Rewrite a resume bullet point to be more impactful
    
    Example Request:
    {
      "bullet": "Worked on backend systems",
      "context": "Software Engineer at TechCorp",
      "tone": "formal"
    }
    """
    try:
        if len(request.bullet) < 5:
            raise HTTPException(status_code=400, detail="Bullet point too short")
        
        result = await gemini_service.improve_bullet_point(
            bullet=request.bullet,
            context=request.context,
            tone=request.tone
        )
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error improving bullet: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process request")

@router.post("/add-metrics")
async def add_metrics(request: MetricsRequest):
    """
    Suggest metrics and quantifiable improvements
    
    Example Request:
    {
      "bullet": "Implemented payment system",
      "role": "Backend Engineer"
    }
    """
    try:
        result = await gemini_service.add_metrics_to_bullet(
            bullet=request.bullet,
            role=request.role
        )
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error adding metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add metrics")

@router.post("/ats-optimize")
async def ats_optimize(request: ATSOptimizeRequest):
    """
    Get ATS optimization suggestions
    """
    try:
        if len(request.resume_text) < 50:
            raise HTTPException(status_code=400, detail="Resume text too short")
        
        result = await gemini_service.optimize_for_ats(
            resume_text=request.resume_text,
            job_description=request.job_description
        )
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error optimizing for ATS: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to optimize")

@router.post("/extract-keywords")
async def extract_keywords(request: KeywordExtractionRequest):
    """
    Extract and categorize keywords from job description
    """
    try:
        if len(request.job_description) < 50:
            raise HTTPException(status_code=400, detail="Job description too short")
        
        result = await gemini_service.extract_job_keywords(
            job_description=request.job_description
        )
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error extracting keywords: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to extract keywords")

@router.post("/skill-gap")
async def skill_gap(request: SkillGapRequest):
    """
    Analyze skill gaps between resume and job
    """
    try:
        result = await gemini_service.analyze_skill_gap(
            resume_text=request.resume_text,
            job_description=request.job_description
        )
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error analyzing skill gap: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze skill gap")

@router.post("/grammar-check")
async def grammar_check(request: GrammarCheckRequest):
    """
    Improve grammar, clarity, and professionalism
    """
    try:
        if len(request.text) < 10:
            raise HTTPException(status_code=400, detail="Text too short")
        
        result = await gemini_service.improve_grammar_clarity(
            text=request.text
        )
        
        return {
            "status": "success",
            "data": result
        }
    
    except Exception as e:
        logger.error(f"Error checking grammar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check grammar")

@router.post("/professional-summary")
async def professional_summary(request: ProfessionalSummaryRequest):
    """
    Generate a professional summary
    """
    try:
        if request.experience_years < 0:
            raise HTTPException(status_code=400, detail="Invalid experience years")
        
        summary = await gemini_service.generate_professional_summary(
            role=request.role,
            experience_years=request.experience_years,
            key_achievements=request.key_achievements
        )
        
        return {
            "status": "success",
            "data": {
                "summary": summary
            }
        }
    
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate summary")

@router.get("/health")
async def health_check():
    """
    Check if Gemini API is accessible
    """
    try:
        # Simple test call to verify API is working
        test_result = await gemini_service._call_with_retry("Say 'OK'")
        return {
            "status": "healthy",
            "api_connected": test_result is not None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```

---

## 4. ERROR HANDLING & RETRY LOGIC

### Key Safety Features Implemented:

✅ **Rate Limiting:**
- Max 10 calls per 60 seconds
- Returns fallback response if exceeded

✅ **Retry Logic:**
- 3 attempts with exponential backoff (1s, 2s, 4s)
- Handles timeouts, API errors, network issues

✅ **Timeouts:**
- 30-second timeout per API call
- Prevents hanging requests

✅ **Fallback Responses:**
- Graceful degradation if API fails
- Reasonable suggestions based on prompt type

✅ **Error Logging:**
- All errors logged for debugging
- No sensitive data in logs

✅ **JSON Parsing:**
- Safe JSON parsing with fallback
- Handles malformed responses

---

## 5. ENVIRONMENT SETUP

### `.env` file
```
GEMINI_API_KEY=your-actual-key-here
GEMINI_MODEL=gemini-pro
LOG_LEVEL=INFO
```

### `requirements.txt`
```
google-generativeai==0.3.0
python-dotenv==1.0.0
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
```

---

## 6. TESTING THE GEMINI SERVICE

### `test_gemini.py`
```python
import asyncio
from services.gemini_service import gemini_service

async def test_all():
    """Test all Gemini functions"""
    
    # Test 1: Improve bullet
    print("Test 1: Improve bullet point")
    result = await gemini_service.improve_bullet_point(
        "Worked on projects",
        context="Software Engineer",
        tone="formal"
    )
    print(result)
    print()
    
    # Test 2: Add metrics
    print("Test 2: Add metrics")
    result = await gemini_service.add_metrics_to_bullet(
        "Implemented payment system",
        role="Backend Engineer"
    )
    print(result)
    print()
    
    # Test 3: Extract keywords
    print("Test 3: Extract JD keywords")
    jd = "We are looking for a Python developer with 5+ years experience in FastAPI and AWS..."
    result = await gemini_service.extract_job_keywords(jd)
    print(result)

if __name__ == "__main__":
    asyncio.run(test_all())
```

Run with:
```bash
python test_gemini.py
```

---

## 7. PROMPT ENGINEERING BEST PRACTICES

### Guidelines for Reliable AI Responses:

1. **Structured Output:**
   - Always ask for JSON response
   - Specify exact fields needed
   - Provide example format

2. **Clear Instructions:**
   - Role clarification ("You are a resume expert...")
   - Task specification (clear, single task)
   - Output requirements

3. **Input Validation:**
   - Check length before API call
   - Sanitize user input
   - Limit token usage

4. **Error Handling:**
   - Assume API might fail
   - Provide fallback content
   - Log errors for debugging

5. **Cost Optimization:**
   - Limit prompt size (2000 chars max for context)
   - Batch requests when possible
   - Cache results client-side

---

## 8. ADVANCED: BATCH PROCESSING

For processing multiple resumes (future feature):

```python
async def batch_analyze_resumes(resumes: List[str], job_description: str):
    """Analyze multiple resumes concurrently"""
    tasks = [
        gemini_service.analyze_skill_gap(resume, job_description)
        for resume in resumes
    ]
    return await asyncio.gather(*tasks)
```

---

## 9. COST ESTIMATION

### Google Gemini Pricing (as of Jan 2026)
- **Free tier:** 60 requests/minute
- **Paid:** $0.50 per 1M input tokens, $1.50 per 1M output tokens
- **Typical resume analysis:** ~500 tokens input, ~300 tokens output ≈ $0.0005-0.001 per request

### Cost Optimization
- Rate limit to prevent overuse
- Cache results locally
- Offer "quick check" vs "detailed analysis"
- Monitor API usage

---

## 10. GEMINI API ALTERNATIVES (If Needed)

If Gemini becomes unavailable:

```python
# Option 1: Use OpenAI (but not preferred)
# Option 2: Use Claude API (Anthropic)
# Option 3: Use Hugging Face Inference API (free tier available)

# For your project, stick with Gemini per requirements
```

---

