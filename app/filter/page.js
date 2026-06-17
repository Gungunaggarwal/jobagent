'use client';

import { useState, useEffect } from 'react';
import AgentStatus from '@/components/AgentStatus';
import JobCard from '@/components/JobCard';
import ResumeUploader from '@/components/ResumeUploader';
import CoverLetterModal from '@/components/CoverLetterModal';
import { getResume, saveApplication, getApplications } from '@/lib/storage';

// We need getMockJobs on client — import from rapidapi won't work server-side here,
// so we duplicate the mock inline via the search API with empty query.

export default function FilterPage() {
  const [resume, setResume] = useState('');
  const [jobs, setJobs] = useState([]);
  const [scored, setScored] = useState([]);
  const [status, setStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [applyJob, setApplyJob] = useState(null);
  const [minScore, setMinScore] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const r = getResume();
    setResume(r);
    setShowUploader(!r);
    setSavedIds(getApplications().map((a) => a.id));
  }, []);

  async function loadAndFilter() {
    if (!resume.trim()) { setShowUploader(true); return; }
    setStatus('thinking');
    setStatusMsg('Fetching jobs to analyse...');
    setScored([]);

    // Fetch jobs first via search API
    let fetchedJobs = [];
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'software engineer developer designer', sources: ['jobs'] }),
      });
      const data = await res.json();
      fetchedJobs = data.jobs || [];
      setJobs(fetchedJobs);
    } catch {
      setStatus('error'); setStatusMsg('Could not load jobs'); return;
    }

    if (!fetchedJobs.length) { setStatus('error'); setStatusMsg('No jobs to filter'); return; }

    setStatusMsg(`Scoring ${fetchedJobs.length} jobs against your resume with AI...`);

    try {
      const res = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: fetchedJobs, resume }),
      });
      const data = await res.json();
      setScored(data.scored || []);
      setUsingFallback(data.usingFallback || false);
      setStatus('done');
      const great = (data.scored || []).filter((j) => j.score >= 75).length;
      setStatusMsg(`Scored ${data.scored?.length || 0} jobs · ${great} great matches found`);
    } catch {
      setStatus('error'); setStatusMsg('Scoring failed');
    }
  }

  async function filterJobsFromSearch(inputJobs) {
    if (!resume.trim()) { setShowUploader(true); return; }
    setJobs(inputJobs);
    setStatus('thinking');
    setStatusMsg(`Scoring ${inputJobs.length} jobs with AI...`);

    try {
      const res = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: inputJobs, resume }),
      });
      const data = await res.json();
      setScored(data.scored || []);
      setUsingFallback(data.usingFallback || false);
      setStatus('done');
      setStatusMsg(`Scored ${data.scored?.length || 0} jobs`);
    } catch {
      setStatus('error'); setStatusMsg('Scoring failed');
    }
  }

  function handleSave(job) {
    saveApplication({ ...job, score: job.score });
    setSavedIds((prev) => [...prev, job.id]);
  }

  function handleResumeComplete(text) {
    setResume(text);
    setShowUploader(false);
  }

  const filtered = scored.filter((j) => j.score >= minScore);

  return (
    <div>
      <div className="page-header">
        <h1>🎯 Filter Agent</h1>
        <p>AI scores every job 0–100 against your resume to surface the best matches</p>
      </div>

      <AgentStatus agent="filter" status={status} message={statusMsg} />

      {usingFallback && status === 'done' && (
        <div className="info-banner warning" style={{ marginBottom: 16 }}>
          🟡 Using keyword matching — add Gemini API key to <code>.env.local</code> for AI-powered scoring
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 28, alignItems: 'start' }}>
        {/* Resume section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>📄 Your Resume</div>
            {resume && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowUploader(!showUploader)}>
                {showUploader ? 'Cancel' : '✏️ Update'}
              </button>
            )}
          </div>

          {showUploader || !resume ? (
            <ResumeUploader onComplete={handleResumeComplete} existingResume={resume} />
          ) : (
            <div>
              <div style={{
                background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7,
                maxHeight: 140, overflow: 'hidden', position: 'relative',
              }}>
                {resume.slice(0, 400)}...
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, rgba(13,17,23,0.9))' }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--accent-secondary)' }}>
                ✓ {resume.split(' ').length} words · Resume loaded
              </div>
            </div>
          )}
        </div>

        {/* Run Agent */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            ⚡ Run Filter Agent
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
            The Filter Agent will fetch the latest jobs and use Gemini AI to score each one against your resume, identifying skill matches, gaps, and ranking them by fit.
          </p>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={loadAndFilter}
            disabled={status === 'thinking'}
          >
            {status === 'thinking'
              ? <><span className="spinner" /> Analysing...</>
              : '🎯 Score Jobs Against My Resume'}
          </button>
          {scored.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>
                Min score filter: <strong style={{ color: 'var(--text-accent)' }}>{minScore}+</strong>
              </div>
              <input
                type="range" min={0} max={90} step={5} value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>All</span><span>Good (50+)</span><span>Great (75+)</span><span>Top (90+)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {scored.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">
              📊 Results
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                {filtered.length} of {scored.length} jobs
              </span>
            </h2>
            <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
              <span className="badge badge-great">75+ Great</span>
              <span className="badge badge-ok">50+ Partial</span>
              <span className="badge badge-skip">&lt;50 Low</span>
            </div>
          </div>
          <div className="jobs-grid">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showScore
                saved={savedIds.includes(job.id)}
                onSave={handleSave}
                onApply={() => setApplyJob(job)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No jobs match score {minScore}+</h3>
              <p>Lower the score filter to see more results</p>
            </div>
          )}
        </div>
      )}

      {status === 'idle' && scored.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>Ready to find your best matches</h3>
          <p>{resume ? 'Click "Score Jobs" to let AI rank jobs by how well they match your background.' : 'Add your resume first, then run the filter agent.'}</p>
        </div>
      )}

      {applyJob && (
        <CoverLetterModal
          job={applyJob}
          resume={resume}
          onClose={() => setApplyJob(null)}
          onSave={() => handleSave(applyJob)}
        />
      )}
    </div>
  );
}
