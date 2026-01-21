import { useMemo, useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'
import './App.css'

function App() {
  const [view, setView] = useState('home')
  const [form, setForm] = useState({
    name: 'Alex Rivera',
    title: 'Frontend Engineer',
    email: 'alex.rivera@email.com',
    phone: '+1 (555) 123-4567',
    location: 'Austin, TX',
    summary:
      'Product-focused engineer with 4+ years building accessible, fast UIs for SaaS teams. I turn fuzzy ideas into shipped features with measurable impact.',
    skills: 'React, TypeScript, Vite, CSS, Accessibility, Testing',
    experience:
      'Frontend Engineer | Orbit Labs | 2022-Present\n- Led a design system rebuild that reduced UI defects by 35%.\n- Shipped an analytics dashboard used by 12k customers.\n\nFrontend Developer | Nova Studio | 2020-2022\n- Improved Lighthouse scores from 62 to 94 across core pages.\n- Built reusable chart components for product insights.',
    education:
      'B.S. Computer Science | University of Texas | 2020\n- Graduated with honors. Coursework: HCI, Algorithms.',
    projects:
      'Resume Builder AI\n- Built a resume builder with ATS scoring and PDF export.\n- Integrated AI suggestions with rate limiting and retries.',
  })
  const [atsScore, setAtsScore] = useState(null)
  const [atsFeedback, setAtsFeedback] = useState([])
  const [atsLoading, setAtsLoading] = useState(false)
  const [atsError, setAtsError] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const previewRef = useRef(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const parseLines = (value) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  const skillsList = useMemo(
    () =>
      form.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    [form.skills]
  )

  const experienceList = useMemo(() => parseLines(form.experience), [form.experience])
  const educationList = useMemo(() => parseLines(form.education), [form.education])
  const projectsList = useMemo(() => parseLines(form.projects), [form.projects])

  const handleCheckAts = async () => {
    setAtsLoading(true)
    setAtsError('')
    try {
      const response = await fetch('http://localhost:8000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skills: skillsList,
          experience: experienceList,
          education: educationList,
          projects: projectsList,
        }),
      })
      if (!response.ok) {
        throw new Error('Unable to reach the scoring service.')
      }
      const data = await response.json()
      setAtsScore(data.score)
      setAtsFeedback(data.feedback || [])
    } catch (error) {
      setAtsError(error.message || 'Something went wrong.')
    } finally {
      setAtsLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError('Choose a resume file first.')
      return
    }

    setUploadLoading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      const response = await fetch('http://localhost:8000/api/score-file', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Unable to score the uploaded resume.')
      }
      const data = await response.json()
      setAtsScore(data.score)
      setAtsFeedback(data.feedback || [])
    } catch (error) {
      setUploadError(error.message || 'Something went wrong.')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDownload = () => {
    const element = previewRef.current
    if (!element) {
      setDownloadError('Preview not ready yet.')
      return
    }
    setDownloadError('')
    const payload = {
      ...form,
      skills: skillsList,
      experience: experienceList,
      education: educationList,
      projects: projectsList,
    }
    const filename = `${payload.name || 'resume'}.pdf`
    html2pdf()
      .set({
        margin: 0.4,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .from(element)
      .save()
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">AI Resume Builder</p>
          <h1>Build a standout resume in minutes.</h1>
          <p className="subtitle">
            Craft, score, and refine your resume with a modern builder UI. Your data stays
            local until you decide to export or score it.
          </p>
        </div>
        {view === 'home' ? (
          <div className="hero-card">
            <div className="hero-stat">
              <p className="stat-label">ATS Score</p>
              <p className="stat-value">Live</p>
            </div>
            <div className="hero-stat">
              <p className="stat-label">Formats</p>
              <p className="stat-value">PDF</p>
            </div>
            <div className="hero-stat">
              <p className="stat-label">Speed</p>
              <p className="stat-value">Fast</p>
            </div>
          </div>
        ) : (
          <div className="hero-card">
            <div className="hero-stat">
              <p className="stat-label">ATS Score</p>
              <p className="stat-value">{atsScore ?? '--'}</p>
            </div>
            <div className="hero-stat">
              <p className="stat-label">Sections</p>
              <p className="stat-value">6</p>
            </div>
            <div className="hero-stat">
              <p className="stat-label">Export</p>
              <p className="stat-value">PDF</p>
            </div>
          </div>
        )}
      </header>

      {view === 'home' ? (
        <main className="home">
          <div className="home-card">
            <h2>Build from scratch</h2>
            <p>
              Follow a guided, multi-step builder with a live preview and instant ATS
              feedback.
            </p>
            <button className="primary" type="button" onClick={() => setView('builder')}>
              Start building
            </button>
          </div>
          <div className="home-card">
            <h2>Upload a resume</h2>
            <p>
              Upload your existing PDF or DOCX and receive an ATS score with improvement
              tips.
            </p>
            <button className="ghost" type="button" onClick={() => setView('upload')}>
              Upload resume
            </button>
          </div>
        </main>
      ) : (
        <div className="nav">
          <button className="ghost" type="button" onClick={() => setView('home')}>
            Back to Home
          </button>
        </div>
      )}

      {view === 'builder' ? (
        <main className="grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Resume Builder</h2>
              <p>Fill in the fields and see a live preview on the right.</p>
            </div>
            <form className="form">
              <div className="field-row">
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input id="name" name="name" value={form.name} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="title">Role title</label>
                  <input id="title" name="title" value={form.title} onChange={handleChange} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="summary">Professional summary</label>
                <textarea
                  id="summary"
                  name="summary"
                  rows="4"
                  value={form.summary}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="skills">Skills (comma separated)</label>
                <input
                  id="skills"
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="experience">Experience</label>
                <textarea
                  id="experience"
                  name="experience"
                  rows="6"
                  value={form.experience}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="education">Education</label>
                <textarea
                  id="education"
                  name="education"
                  rows="4"
                  value={form.education}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="projects">Projects</label>
                <textarea
                  id="projects"
                  name="projects"
                  rows="4"
                  value={form.projects}
                  onChange={handleChange}
                />
              </div>
            </form>
            <div className="actions">
              <button className="primary" type="button" onClick={handleCheckAts}>
                {atsLoading ? 'Scoring...' : 'Check ATS Score'}
              </button>
              <button className="ghost" type="button" onClick={handleDownload}>
                Download PDF
              </button>
            </div>
            {atsError ? <p className="error">{atsError}</p> : null}
            {downloadError ? <p className="error">{downloadError}</p> : null}
          </section>

          <section className="panel preview" ref={previewRef}>
            <div className="panel-header">
              <h2>Live Preview</h2>
              <p>Copy ready content with clean formatting for ATS systems.</p>
            </div>
            <div className="resume">
              <div className="resume-header">
                <div>
                  <h3>{form.name}</h3>
                  <p className="role">{form.title}</p>
                </div>
                <div className="contact">
                  <p>{form.email}</p>
                  <p>{form.phone}</p>
                  <p>{form.location}</p>
                </div>
              </div>
              <section className="resume-section">
                <h4>Summary</h4>
                <p>{form.summary}</p>
              </section>
              <section className="resume-section">
                <h4>Skills</h4>
                <div className="chips">
                  {skillsList.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </section>
              <section className="resume-section">
                <h4>Experience</h4>
                <ul>
                  {experienceList.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="resume-section">
                <h4>Education</h4>
                <ul>
                  {educationList.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="resume-section">
                <h4>Projects</h4>
                <ul>
                  {projectsList.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </section>
              {atsScore !== null ? (
                <section className="resume-section score">
                  <h4>ATS Feedback</h4>
                  <p className="score-value">Score: {atsScore}</p>
                  <ul>
                    {atsFeedback.length ? (
                      atsFeedback.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
                    ) : (
                      <li>No feedback yet.</li>
                    )}
                  </ul>
                </section>
              ) : null}
            </div>
          </section>
        </main>
      ) : null}

      {view === 'upload' ? (
        <main className="grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Upload & Analyze</h2>
              <p>Upload a resume and get ATS feedback with improvement tips.</p>
            </div>
            <div className="upload-card">
              <div>
                <label className="upload-label" htmlFor="resumeUpload">
                  Upload a resume (.txt, .pdf, .docx)
                </label>
                <input
                  id="resumeUpload"
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                />
              </div>
              <button className="primary" type="button" onClick={handleUpload}>
                {uploadLoading ? 'Uploading...' : 'Analyze Resume'}
              </button>
            </div>
            {uploadError ? <p className="error">{uploadError}</p> : null}
          </section>

          <section className="panel preview">
            <div className="panel-header">
              <h2>Analysis Results</h2>
              <p>Review your score and the most impactful improvements.</p>
            </div>
            <div className="resume">
              <section className="resume-section score">
                <h4>ATS Feedback</h4>
                <p className="score-value">Score: {atsScore ?? '--'}</p>
                <ul>
                  {atsFeedback.length ? (
                    atsFeedback.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
                  ) : (
                    <li>Upload a resume to see feedback.</li>
                  )}
                </ul>
              </section>
            </div>
          </section>
        </main>
      ) : null}
    </div>
  )
}

export default App
