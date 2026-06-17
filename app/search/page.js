'use client';

import { useState, useEffect } from 'react';
import AgentStatus from '@/components/AgentStatus';
import JobCard from '@/components/JobCard';
import CoverLetterModal from '@/components/CoverLetterModal';
import { saveApplication, getApplications, getResume, saveLastSearch } from '@/lib/storage';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(false);
  const [sources, setSources] = useState(['jobs', 'twitter']);
  const [status, setStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [jobs, setJobs] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [usingMock, setUsingMock] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [applyJob, setApplyJob] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const resume = typeof window !== 'undefined' ? getResume() : '';

  useEffect(() => {
    setSavedIds(getApplications().map((a) => a.id));
  }, []);

  async function search(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setStatus('thinking');
    setStatusMsg('Searching jobs across LinkedIn, Indeed, Glassdoor...');
    setJobs([]); setTweets([]);

    saveLastSearch({ query, location, remote, sources });

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, remote, sources }),
      });
      const data = await res.json();
      setJobs(data.jobs || []);
      setTweets(data.tweets || []);
      setUsingMock(data.usingMock || false);
      setStatus('done');
      setStatusMsg(`Found ${data.jobs?.length || 0} jobs + ${data.tweets?.length || 0} Twitter posts`);
    } catch (err) {
      setStatus('error');
      setStatusMsg('Search failed — check your RapidAPI key in Settings');
    }
  }

  function handleSave(job) {
    saveApplication(job);
    setSavedIds((prev) => [...prev, job.id]);
  }

  const total = jobs.length + tweets.length;

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Search Agent</h1>
        <p>Find jobs from LinkedIn, Indeed, Glassdoor, ZipRecruiter + Twitter/X hiring posts</p>
      </div>

      <AgentStatus agent="search" status={status} message={statusMsg} />

      {usingMock && (
        <div className="info-banner warning" style={{ marginBottom: 20 }}>
          🟡 <strong>Demo mode</strong> — Showing mock data. Add your RapidAPI key to <code>.env.local</code> to search real jobs.
        </div>
      )}

      {/* Search Form */}
      <form className="search-form" onSubmit={search}>
        <div className="search-fields">
          <div className="form-group">
            <label className="form-label">Job Title / Keywords *</label>
            <input
              className="input"
              placeholder="e.g. Frontend Engineer, Data Scientist, Product Manager"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              className="input"
              placeholder="e.g. New York, London, Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Job Type</label>
            <select className="select" value={remote ? 'remote' : 'any'} onChange={(e) => setRemote(e.target.value === 'remote')}>
              <option value="any">Any</option>
              <option value="remote">Remote Only</option>
            </select>
          </div>
        </div>

        <div className="search-row">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Sources:</span>
            {['jobs', 'twitter'].map((s) => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={sources.includes(s)}
                  onChange={(e) => setSources(e.target.checked ? [...sources, s] : sources.filter((x) => x !== s))}
                  style={{ accentColor: 'var(--accent-primary)', width: 14, height: 14 }}
                />
                {s === 'jobs' ? '💼 Job Boards' : '🐦 Twitter/X'}
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={status === 'thinking' || !query.trim()}
          >
            {status === 'thinking'
              ? <><span className="spinner" /> Searching...</>
              : '🔍 Search Jobs'}
          </button>
        </div>
      </form>

      {/* Results */}
      {total > 0 && (
        <div>
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div className="tab-group" style={{ marginBottom: 0 }}>
              <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
                💼 Job Boards ({jobs.length})
              </button>
              <button className={`tab-btn ${activeTab === 'twitter' ? 'active' : ''}`} onClick={() => setActiveTab('twitter')}>
                🐦 Twitter/X ({tweets.length})
              </button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {savedIds.length > 0 && <span>{savedIds.length} saved</span>}
            </div>
          </div>

          {activeTab === 'jobs' && (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={savedIds.includes(job.id)}
                  onSave={handleSave}
                  onApply={() => setApplyJob(job)}
                />
              ))}
            </div>
          )}

          {activeTab === 'twitter' && (
            <div className="jobs-grid">
              {tweets.map((tweet) => (
                <div key={tweet.id} className="job-card">
                  <div className="job-card-header">
                    <div className="job-card-logo" style={{ background: 'linear-gradient(135deg,#1d9bf0,#0284c7)', fontSize: 20 }}>𝕏</div>
                    <div style={{ flex: 1 }}>
                      <div className="job-card-title">{tweet.title || 'Job Opportunity'}</div>
                      <div className="job-card-company">@{tweet.handle} · {tweet.author}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
                    {tweet.text}
                  </p>
                  <div className="job-card-footer">
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>❤️ {tweet.likes}</span>
                      <span>🔁 {tweet.retweets}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleSave({ ...tweet, description: tweet.text, type: 'TWITTER', source: 'Twitter/X' })}>
                        {savedIds.includes(tweet.id) ? '✓ Saved' : '+ Save'}
                      </button>
                      <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                        View Post ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'idle' && total === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Search for your next opportunity</h3>
          <p>Enter a job title or keywords above to search across multiple job boards and Twitter/X simultaneously.</p>
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
