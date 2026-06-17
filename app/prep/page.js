'use client';

import { useState, useEffect } from 'react';
import AgentStatus from '@/components/AgentStatus';
import { getApplications, getResume } from '@/lib/storage';

export default function PrepPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resume, setResume] = useState('');
  const [status, setStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('Select a saved job to start preparing');
  const [activeTab, setActiveTab] = useState('questions');

  // Prep data
  const [questions, setQuestions] = useState([]);
  const [cheatsheet, setCheatsheet] = useState(null);
  const [plan, setPlan] = useState(null);
  const [openQ, setOpenQ] = useState(null);
  const [usingTemplate, setUsingTemplate] = useState(false);

  useEffect(() => {
    setSavedJobs(getApplications());
    setResume(getResume());
  }, []);

  async function selectJob(job) {
    setSelectedJob(job);
    setQuestions([]); setCheatsheet(null); setPlan(null);
    setActiveTab('questions');
    await generateAll(job);
  }

  async function generateAll(job) {
    setStatus('thinking');
    setStatusMsg('Generating interview questions & answers...');

    try {
      const [qRes, csRes, planRes] = await Promise.all([
        fetch('/api/prep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job, resume, type: 'questions' }) }),
        fetch('/api/prep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job, resume, type: 'cheatsheet' }) }),
        fetch('/api/prep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job, resume, type: 'plan' }) }),
      ]);

      const [qData, csData, planData] = await Promise.all([qRes.json(), csRes.json(), planRes.json()]);

      setQuestions(qData.content || []);
      setCheatsheet(csData.content || null);
      setPlan(planData.content || null);
      setUsingTemplate(qData.usingTemplate || false);
      setStatus('done');
      setStatusMsg(`Ready — ${qData.content?.length || 0} interview questions + company cheat sheet + 30-60-90 plan`);
    } catch {
      setStatus('error');
      setStatusMsg('Failed to generate prep materials');
    }
  }

  const typeColors = { behavioral: '#6c63ff', technical: '#3b82f6', situational: '#00d4aa' };

  return (
    <div>
      <div className="page-header">
        <h1>🧠 Prep Agent</h1>
        <p>Interview questions, company cheat sheets, and 30-60-90 day plans for every job</p>
      </div>

      <AgentStatus agent="prep" status={status} message={statusMsg} />

      {usingTemplate && status === 'done' && (
        <div style={{
          marginBottom: 16, padding: '10px 16px',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#f59e0b',
        }}>
          🟡 Showing template prep — add Gemini API key in Settings for fully personalized AI content
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start', gap: 24 }}>
        {/* Job picker */}
        <div>
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              📋 Select a Job to Prep For
            </div>

            {savedJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                No saved jobs yet. Save jobs from Search or Filter pages first.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {savedJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => selectJob(job)}
                    style={{
                      background: selectedJob?.id === job.id ? 'rgba(108,99,255,0.12)' : 'var(--bg-glass)',
                      border: `1px solid ${selectedJob?.id === job.id ? 'var(--border-accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-accent)' }}>{job.company}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Status: {job.status} {job.score ? `· Score: ${job.score}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom job input */}
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
              ✏️ Or prep for any job
            </div>
            <CustomJobForm onSubmit={selectJob} />
          </div>
        </div>

        {/* Prep content */}
        <div>
          {selectedJob && (questions.length > 0 || cheatsheet || plan) ? (
            <div>
              {/* Job header */}
              <div className="card card-sm" style={{ marginBottom: 16, borderColor: 'rgba(108,99,255,0.25)' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{selectedJob.title}</div>
                <div style={{ color: 'var(--text-accent)', fontSize: 13, marginTop: 2 }}>{selectedJob.company} · {selectedJob.location}</div>
              </div>

              {/* Tabs */}
              <div className="tab-group" style={{ marginBottom: 20 }}>
                {[
                  { id: 'questions', label: `❓ Questions (${questions.length})` },
                  { id: 'cheatsheet', label: '📋 Cheat Sheet' },
                  { id: 'plan', label: '📅 30-60-90 Plan' },
                ].map((t) => (
                  <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Questions */}
              {activeTab === 'questions' && (
                <div>
                  {questions.map((q, i) => (
                    <div key={i} className="prep-question">
                      <div className="prep-q-header" onClick={() => setOpenQ(openQ === i ? null : i)}>
                        <div className="prep-q-num">{i + 1}</div>
                        <div className="prep-q-text">{q.question}</div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: `${typeColors[q.type] || '#6c63ff'}20`,
                          color: typeColors[q.type] || '#6c63ff',
                          textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                        }}>
                          {q.type}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 16, marginLeft: 4 }}>
                          {openQ === i ? '▲' : '▼'}
                        </span>
                      </div>
                      {openQ === i && (
                        <div>
                          <div className="prep-answer" style={{ marginBottom: 8 }}>
                            <strong style={{ color: 'var(--text-accent)', display: 'block', marginBottom: 4 }}>💡 Model Answer</strong>
                            {q.answer}
                          </div>
                          {q.tip && (
                            <div className="prep-answer" style={{ background: 'rgba(0,212,170,0.05)', borderColor: 'rgba(0,212,170,0.2)' }}>
                              <strong style={{ color: 'var(--accent-secondary)', display: 'block', marginBottom: 4 }}>🎯 Pro Tip</strong>
                              {q.tip}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cheat Sheet */}
              {activeTab === 'cheatsheet' && cheatsheet && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <CheatSection title="🏢 Company Overview" content={cheatsheet.overview} />
                  <CheatSection title="⚙️ Tech Stack" items={cheatsheet.techStack} />
                  <CheatSection title="🎯 Culture & Values" items={cheatsheet.culture} />
                  <CheatSection title="📰 Recent News / Research" items={cheatsheet.recentNews} />
                  <CheatSection title="❓ Questions to Ask Them" items={cheatsheet.questionsToAsk} highlight />
                </div>
              )}

              {/* 30-60-90 Plan */}
              {activeTab === 'plan' && plan && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { key: '30', color: '#3b82f6', icon: '🌱', label: 'First 30 Days' },
                    { key: '60', color: '#f59e0b', icon: '🌿', label: 'Days 31–60' },
                    { key: '90', color: '#00d4aa', icon: '🌳', label: 'Days 61–90' },
                  ].map((phase) => plan[phase.key] && (
                    <div key={phase.key} className="card card-flat" style={{ borderColor: `${phase.color}33` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 24 }}>{phase.icon}</span>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: phase.color }}>{phase.label}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{plan[phase.key].focus}</div>
                        </div>
                      </div>
                      <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(plan[phase.key].goals || []).map((g, i) => (
                          <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🧠</div>
              <h3>{selectedJob && status === 'thinking' ? 'Generating prep materials...' : 'Pick a job to start'}</h3>
              <p>Select a saved job on the left, or enter a custom job title and company to get interview questions, a company cheat sheet, and your 30-60-90 day plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheatSection({ title, content, items, highlight }) {
  return (
    <div className="card card-flat" style={highlight ? { borderColor: 'rgba(108,99,255,0.25)', background: 'rgba(108,99,255,0.04)' } : {}}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
        {title}
      </div>
      {content && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{content}</p>}
      {items && (
        <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', gap: 8 }}>
              <span style={{ color: highlight ? 'var(--accent-primary)' : 'var(--accent-secondary)', fontWeight: 700 }}>→</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CustomJobForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input className="input" placeholder="Job Title (e.g. Senior Engineer)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="input" placeholder="Company (e.g. Google)" value={company} onChange={(e) => setCompany(e.target.value)} />
      <textarea className="textarea" style={{ minHeight: 60 }} placeholder="Paste job description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <button
        className="btn btn-primary"
        disabled={!title || !company}
        onClick={() => onSubmit({ id: `custom-${Date.now()}`, title, company, description: desc, location: 'Custom', source: 'Manual' })}
      >
        🧠 Prep for This Job
      </button>
    </div>
  );
}
