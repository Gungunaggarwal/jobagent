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
  const [loadMoreStatus, setLoadMoreStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [jobs, setJobs] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [usingMock, setUsingMock] = useState(false);
  const [twitterError, setTwitterError] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [applyJob, setApplyJob] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const resume = typeof window !== 'undefined' ? getResume() : '';

  useEffect(() => {
    setSavedIds(getApplications().map((a) => a.id));
  }, []);

  async function search(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setStatus('thinking');
    setStatusMsg('Searching jobs across LinkedIn, Indeed, Glassdoor...');
    setJobs([]);
    setTweets([]);
    setPage(1);
    setHasMore(false);

    saveLastSearch({ query, location, remote, sources });

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, remote, sources, page: 1, perPage: 10 }),
      });
      const data = await res.json();
      setJobs(data.jobs || []);
      setTweets(data.tweets || []);
      setUsingMock(data.usingMock || false);
      setTwitterError(data.twitterError || null);
      setHasMore(data.hasMore || false);
      setStatus('done');
      setStatusMsg(`Found ${data.jobs?.length || 0} jobs + ${data.tweets?.length || 0} Twitter posts`);
    } catch (err) {
      setStatus('error');
      setStatusMsg('Search failed — check your RapidAPI key in .env.local');
    }
  }

  async function loadMore() {
    const nextPage = page + 1;
    setLoadMoreStatus('loading');
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, remote, sources: ['jobs'], page: nextPage, perPage: 10, append: true }),
      });
      const data = await res.json();
      setJobs((prev) => [...prev, ...(data.jobs || [])]);
      setHasMore(data.hasMore || false);
      setPage(nextPage);
    } catch {
      // silently fail — user can retry
    } finally {
      setLoadMoreStatus('idle');
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
        <div className="info-banner warning" style={{ marginBottom: 16 }}>
          🟡 <strong>Demo mode</strong> — No RapidAPI key detected. Showing sample data.
        </div>
      )}

      {twitterError && !usingMock && (
        <div className="info-banner warning" style={{ marginBottom: 16 }}>
          🐦 <strong>Twitter API not connected:</strong> {twitterError.includes('401') || twitterError.includes('403')
            ? <>You need to <a href="https://rapidapi.com/alexandervikhorev/api/twitter-api45" target="_blank" rel="noopener" style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>subscribe to the Twitter API</a> on RapidAPI (free tier available). The job boards tab still shows real results.
              </>  
            : `Error: ${twitterError} — showing sample tweets instead`}
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
            <label className="form-label">City / Country</label>
            <input
              className="input"
              placeholder="e.g. Bangalore, London, New York"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Job Type</label>
            <select className="select" value={remote ? 'remote' : 'any'} onChange={(e) => setRemote(e.target.value === 'remote')}>
              <option value="any">On-site / Any</option>
              <option value="remote">Remote Only</option>
            </select>
          </div>
        </div>

        {/* Sources row + submit button — stacks on mobile */}
        <div className="search-bottom-row">
          <div className="source-checkboxes">
            <span className="source-label">Sources:</span>
            {[
              { val: 'jobs', icon: '💼', label: 'Job Boards' },
              { val: 'twitter', icon: '🐦', label: 'Twitter/X' },
            ].map((s) => (
              <label key={s.val} className="source-check-label">
                <input
                  type="checkbox"
                  checked={sources.includes(s.val)}
                  onChange={(e) =>
                    setSources(e.target.checked ? [...sources, s.val] : sources.filter((x) => x !== s.val))
                  }
                  style={{ accentColor: 'var(--accent-primary)', width: 14, height: 14 }}
                />
                {s.icon} {s.label}
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="btn btn-primary search-submit-btn"
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
          <div className="results-header">
            <div className="tab-group" style={{ marginBottom: 0 }}>
              <button
                className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                onClick={() => setActiveTab('jobs')}
              >
                💼 Job Boards ({jobs.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'twitter' ? 'active' : ''}`}
                onClick={() => setActiveTab('twitter')}
              >
                🐦 Twitter/X ({tweets.length}){twitterError && !usingMock ? ' — Sample' : ''}
              </button>
            </div>
            {savedIds.length > 0 && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {savedIds.length} saved
              </span>
            )}
          </div>

          {/* Job Board Results */}
          {activeTab === 'jobs' && (
            <>
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

              {/* Load More / Next 10 */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={loadMore}
                    disabled={loadMoreStatus === 'loading'}
                    style={{ minWidth: 180 }}
                  >
                    {loadMoreStatus === 'loading'
                      ? <><span className="spinner" /> Loading...</>
                      : '⬇ Load 10 More Jobs'}
                  </button>
                </div>
              )}

              {!hasMore && jobs.length > 0 && status === 'done' && (
                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                  All {jobs.length} jobs shown — try a different search for more results
                </p>
              )}
            </>
          )}

          {/* Twitter Results */}
          {activeTab === 'twitter' && (
            <div className="jobs-grid">
              {tweets.map((tweet) => (
                <div key={tweet.id} className="job-card">
                  <div className="job-card-header">
                    <div
                      className="job-card-logo"
                      style={{ background: 'linear-gradient(135deg,#1d9bf0,#0284c7)', fontSize: 20 }}
                    >
                      𝕏
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          handleSave({ ...tweet, description: tweet.text, type: 'TWITTER', source: 'Twitter/X' })
                        }
                      >
                        {savedIds.includes(tweet.id) ? '✓ Saved' : '+ Save'}
                      </button>
                      {/* Only show "View Post" if the URL is a real URL, not '#' */}
                      {tweet.url && tweet.url !== '#' && (
                        <a
                          href={tweet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          {tweet.isMockUrl ? 'Search Twitter ↗' : 'View Post ↗'}
                        </a>
                      )}
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
          <p>
            Enter a job title and optionally a city or country above. Results come from LinkedIn,
            Indeed, Glassdoor, ZipRecruiter, and Twitter/X hiring posts.
          </p>
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
