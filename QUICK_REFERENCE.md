# 📌 QUICK REFERENCE CARD

Print this or keep it handy while building.

---

## 🎯 CORE TECHNOLOGY STACK

```
BACKEND              FRONTEND             DATABASE
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  FastAPI     │ ←→ │  React 18    │ ←→ │  SQLite/     │
│  Python 3.9+ │    │  Tailwind    │    │  PostgreSQL  │
│  SQLAlchemy  │    │  Framer      │    │              │
│  Pydantic    │    │  Motion      │    │ Models:      │
│              │    │  Lucide      │    │ • User       │
│ Port: 8000   │    │  Axios       │    │ • Resume     │
└──────────────┘    └──────────────┘    │ • Feedback   │
                                        └──────────────┘

EXTERNAL API
┌──────────────────┐
│ Google Gemini    │
│ (AI Suggestions) │
└──────────────────┘
```

---

## 🚀 PROJECT TIMELINE

```
WEEK 1 (MVP)           WEEK 2 (AI)             WEEK 3 (POLISH)
├─ Setup               ├─ Gemini API          ├─ Heatmap
├─ Builder Form        ├─ 4 AI Endpoints      ├─ Recruiter Mode
├─ Live Preview        ├─ Smart Buttons       ├─ Animations
├─ ATS Scoring         ├─ Tone Selector       ├─ Mobile Polish
├─ PDF Export          ├─ Before/After        ├─ Performance
└─ Dark Theme          └─ Error Handling      └─ Deploy
```

---

## 📚 DOCUMENT GUIDE

| Document | Length | Read Time | Purpose |
|----------|--------|-----------|---------|
| **00_START_HERE.md** | Brief | 5 min | Entry point |
| **INDEX.md** | Guide | 10 min | Navigation |
| **README.md** | Overview | 15 min | Project summary |
| **SETUP.md** | Commands | 20 min | Setup instructions |
| **QUICK_START.md** | Code | 30 min | Copy-paste snippets |
| **PROJECT_SPECIFICATION.md** | Full | 60 min | Complete spec |
| **GEMINI_INTEGRATION.md** | Detailed | 45 min | AI integration |
| **ATS_SCORING_LOGIC.md** | Technical | 40 min | Scoring algorithm |
| **DEVELOPMENT_ROADMAP.md** | Plan | 45 min | Weekly plan |
| **WOW_FEATURES.md** | Advanced | 50 min | Impressive features |

---

## 🔑 ESSENTIAL COMMANDS

```bash
# Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python main.py            # Runs on localhost:8000

# Frontend Setup
cd frontend
npm install
npm start                 # Runs on localhost:3000

# Test Backend
curl http://localhost:8000/health

# Test API
curl -X POST http://localhost:8000/api/builder/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```

---

## 🎨 DESIGN TOKENS

### Colors
```
Primary:      #00D9FF (Cyan)
Secondary:    #7C3AED (Purple)
Background:   #0F172A (Dark Navy)
Surface:      #1E293B (Cards)
Success:      #10B981 (Green)
Error:        #EF4444 (Red)
Warning:      #F59E0B (Amber)
Text Primary: #F1F5F9
Text Secondary: #94A3B8
```

### Typography
```
Headings: Inter Bold (24-48px)
Body:     Inter Regular (14-16px)
Code:     Monospace (12-14px)
```

---

## 📊 API ENDPOINTS AT A GLANCE

```
BUILDER
POST   /api/builder/create
GET    /api/builder/{id}
PUT    /api/builder/{id}/update
POST   /api/builder/{id}/save-draft
GET    /api/builder/{id}/versions
DELETE /api/builder/{id}

CHECKER
POST   /api/checker/analyze
POST   /api/checker/upload

AI SUGGESTIONS
POST   /api/ai/improve-bullet
POST   /api/ai/add-metrics
POST   /api/ai/ats-optimize
POST   /api/ai/extract-keywords
POST   /api/ai/skill-gap
POST   /api/ai/grammar-check
GET    /api/ai/health

EXPORT
GET    /api/export/{id}/json
GET    /api/export/{id}/pdf
```

---

## 🤖 AI FUNCTIONS

```
improve_bullet_point()
  Input: bullet, context, tone
  Output: original, improved, suggestions

add_metrics_to_bullet()
  Input: bullet, role
  Output: original, enhanced, metrics_added

optimize_for_ats()
  Input: resume_text, job_description
  Output: issues, keywords, score

extract_job_keywords()
  Input: job_description
  Output: technical, soft_skills, tools

analyze_skill_gap()
  Input: resume_text, job_description
  Output: matched, missing, recommendations

improve_grammar_clarity()
  Input: text
  Output: original, improved, fixes
```

---

## 🧮 ATS SCORING FORMULA

```
Overall Score = (
  Formatting Score    × 0.20 +
  Keywords Score      × 0.30 +
  Impact Score        × 0.20 +
  Content Score       × 0.20 +
  Structure Score     × 0.10
)

Ranges:
90-100: Excellent
75-89:  Good
60-74:  Fair
40-59:  Poor
0-39:   Very Poor
```

---

## 🏗️ FILE STRUCTURE

```
Ai Resume Builder/
├── 00_START_HERE.md              ← Start here!
├── INDEX.md                      ← Navigation
├── README.md                     ← Overview
├── SETUP.md                      ← Setup commands
├── QUICK_START.md                ← Code snippets
├── PROJECT_SPECIFICATION.md      ← Full spec
├── GEMINI_INTEGRATION.md         ← AI setup
├── ATS_SCORING_LOGIC.md          ← Scoring
├── DEVELOPMENT_ROADMAP.md        ← Timeline
├── WOW_FEATURES.md               ← Advanced
│
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env
│   ├── database/
│   ├── schemas/
│   ├── routes/
│   ├── services/
│   └── utils/
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   └── styles/
    ├── package.json
    └── tailwind.config.js
```

---

## ✅ DEVELOPMENT CHECKLIST

### Week 1: MVP
- [ ] Backend API setup
- [ ] Database models
- [ ] 6-step form component
- [ ] Live preview
- [ ] Save/load drafts
- [ ] PDF export
- [ ] Basic ATS scoring
- [ ] Dark theme UI

### Week 2: AI
- [ ] Gemini service wrapper
- [ ] Rate limiting
- [ ] AI endpoints (4)
- [ ] Smart action buttons (3)
- [ ] Tone selector
- [ ] Keyword extraction
- [ ] Before/after view
- [ ] Error handling

### Week 3: Polish
- [ ] Heatmap visualization
- [ ] Recruiter mode
- [ ] Animations
- [ ] Mobile responsive
- [ ] Performance tune
- [ ] Documentation
- [ ] Bug fixes
- [ ] Deploy

---

## 🎯 KEY METRICS

```
Backend:
  - 20+ API endpoints
  - 3 database models
  - 5 AI functions
  - Rate limiting (10 req/min)
  - Error handling with retries

Frontend:
  - 15+ components
  - Dark theme (9 colors)
  - Responsive design
  - Framer Motion animations
  - 50+ styled elements

Features:
  - 6-step builder
  - ATS scoring (5 dimensions)
  - 4 AI suggestions
  - 4 tone styles
  - 3 templates
  - 8 WOW features
```

---

## 🚨 COMMON ISSUES & FIXES

```
Backend won't start:
→ Check .env exists
→ Run: pip install -r requirements.txt
→ Check port 8000 not in use

Frontend won't start:
→ Run: npm install
→ Check port 3000 not in use
→ Clear cache: npm start -- --reset-cache

API not responding:
→ Check backend running (http://localhost:8000)
→ Check CORS_ORIGINS in .env
→ Check API endpoint URL in frontend

Gemini errors:
→ Verify API key in .env
→ Check rate limit (10 req/min)
→ Check internet connection
→ Check API key is active

Database locked:
→ Delete .db file
→ Restart backend
```

---

## 📞 QUICK HELP

**Stuck on what to do?**
→ Read `DEVELOPMENT_ROADMAP.md` for week-by-week plan

**Stuck on how to code?**
→ See `QUICK_START.md` for code templates

**Stuck on architecture?**
→ Read `PROJECT_SPECIFICATION.md`

**Stuck on Gemini?**
→ Read `GEMINI_INTEGRATION.md`

**Stuck on ATS scoring?**
→ Read `ATS_SCORING_LOGIC.md`

**Stuck on WOW features?**
→ Read `WOW_FEATURES.md`

---

## 🎓 LEARNING RESOURCES

### Frameworks
- FastAPI docs: https://fastapi.tiangolo.com
- React docs: https://react.dev
- SQLAlchemy docs: https://docs.sqlalchemy.org
- Tailwind docs: https://tailwindcss.com

### AI
- Google Gemini API: https://makersuite.google.com
- Prompt engineering guide: Search "prompt engineering best practices"

### Deployment
- Render: https://render.com
- Vercel: https://vercel.com
- Railway: https://railway.app

---

## 💡 PRO TIPS

1. **Start small:** Build MVP first, add features later
2. **Test often:** Use `curl` or Postman to test API
3. **Use git:** Version control your work
4. **Read errors:** Error messages are helpful
5. **Ask questions:** Check documentation first
6. **Take breaks:** Don't code for >2 hours straight
7. **Deploy early:** Try deploying MVP first
8. **Get feedback:** Show friends/mentors early versions

---

## 🎉 YOU HAVE EVERYTHING

- ✅ 10 comprehensive documents
- ✅ 50+ code examples
- ✅ Complete architecture
- ✅ Design system
- ✅ 3-week roadmap
- ✅ AI integration guide
- ✅ Deployment guide
- ✅ Branding guide
- ✅ This quick reference

**Time to build! 🚀**

---

## 🏁 FINAL WORDS

> "You don't have to see the whole staircase, just take the first step."
> — Martin Luther King Jr.

**Your first step:** Open `00_START_HERE.md` and follow along.

**You've got this! 💪**

---

Last Updated: January 21, 2026
Version: 1.0 (Complete)
Status: Ready to Code ✅

