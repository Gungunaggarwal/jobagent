'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getResume, saveApplication, updateApplicationStatus, getApplications, saveLastSearch, getLastSearch } from '@/lib/storage';

export default function SearchAgentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [profile, setProfile] = useState(null);
  
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  
  const [tweets, setTweets] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'tweets'
  
  // Search inputs state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('India');
  const [searchExp, setSearchExp] = useState('Any');
  const [searchSalary, setSearchSalary] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Tracked Jobs State
  const [trackedJobs, setTrackedJobs] = useState({});
  
  useEffect(() => {
    const apps = getApplications();
    const map = {};
    apps.forEach(a => { map[a.id] = a.status; });
    setTrackedJobs(map);
  }, []);
  
  const pastelColors = ['var(--lj-card-peach)', 'var(--lj-card-mint)', 'var(--lj-card-lavender)', 'var(--lj-card-blue)', 'var(--lj-card-pink)'];

  // Redirect if not onboarded
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.onboardingComplete === false) {
      router.push('/onboarding');
    }
  }, [status, session, router]);

  // Initial fetch
  useEffect(() => {
    async function fetchProfileAndJobs() {
      try {
        const lastSearch = getLastSearch();
        if (lastSearch) {
          setSearchTitle(lastSearch.title || '');
          setSearchLocation(lastSearch.location || 'India');
          setSearchExp(lastSearch.exp || 'Any');
          setSearchSalary(lastSearch.salary || '');
          fetchJobs(lastSearch.title || '', lastSearch.location || 'India', 1, false);
          return;
        }

        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          const { title, location_pref, experience } = data.profile || {};
          let loc = location_pref || 'India';
          let exp = 'Any';
          if (experience) {
            if (experience < 2) exp = '0-1 year (Fresh / Intern)';
            else if (experience <= 4) exp = '2-4 years (Junior)';
            else if (experience <= 8) exp = '5-8 years (Mid-level)';
            else exp = '9+ years (Senior)';
          }
          
          setSearchTitle(title || '');
          setSearchLocation(loc);
          setSearchExp(exp);
          
          fetchJobs(title || '', loc, 1, false);
        } else {
          fetchJobs('', 'India', 1, false);
        }
      } catch (err) {
        console.error("Could not load profile", err);
        fetchJobs('', 'India', 1, false);
      }
    }
    
    if (status === 'authenticated' && session?.user?.onboardingComplete) {
      fetchProfileAndJobs();
    }
  }, [status, session]);

  async function fetchJobs(query, loc, pageNum, append = false) {
    if (!append) setLoadingJobs(true);
    else setLoadingMore(true);
    
    try {
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          location: loc === 'Remote' || loc === 'Anywhere' ? '' : loc,
          remote: loc === 'Remote',
          sources: ['jobs'],
          page: pageNum,
          perPage: 6
        })
      });
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (append) {
          setJobs(prev => [...prev, ...searchData.jobs]);
          setTweets(prev => [...prev, ...(searchData.tweets || [])]);
        } else {
          setJobs(searchData.jobs || []);
          setTweets(searchData.tweets || []);
        }
        setHasMore(searchData.hasMore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
      setLoadingMore(false);
    }
  }

  const handleSearch = () => {
    setPage(1);
    saveLastSearch({ title: searchTitle, location: searchLocation, exp: searchExp, salary: searchSalary });
    fetchJobs(searchTitle, searchLocation, 1, false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobs(searchTitle, searchLocation, nextPage, true);
  };

  const handleSaveJob = (job) => {
    saveApplication(job);
    setTrackedJobs(prev => ({ ...prev, [job.id]: 'Saved' }));
  };

  const handleApplyJob = (job) => {
    const savedApp = saveApplication(job);
    updateApplicationStatus(savedApp.id, 'Applied');
    setTrackedJobs(prev => ({ ...prev, [job.id]: 'Applied' }));
    window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
  };

  if (status === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner"></div></div>;
  }

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* Animated Background */}
      <div className="aurora-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <header style={{ 
        background: 'rgba(255, 255, 255, 0.7)', 
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '24px', 
        padding: '24px', 
        marginBottom: '32px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#1e293b' }}>Search Agent</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }}></span>
              Flexible / No preference
            </span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
        
        {/* Top Filters */}
        <div className="lj-filters-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.8)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="lj-filter-item">
            <span style={{ opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              className="lj-filter-input" 
              value={searchTitle} 
              onChange={e => setSearchTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Job Title"
            />
          </div>
          <div className="lj-filter-item">
            <span style={{ opacity: 0.5 }}>📍</span>
            <input 
              type="text" 
              className="lj-filter-input" 
              value={searchLocation} 
              onChange={e => setSearchLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Location"
            />
          </div>
          <div className="lj-filter-item">
            <span style={{ opacity: 0.5 }}>💼</span>
            <input 
              type="text" 
              className="lj-filter-input" 
              value={searchExp} 
              onChange={e => setSearchExp(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Experience"
            />
          </div>
          <div className="lj-filter-item" style={{ borderRight: 'none' }}>
            <span style={{ opacity: 0.5 }}>💰</span>
            <input 
              type="text" 
              className="lj-filter-input" 
              value={searchSalary} 
              onChange={e => setSearchSalary(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Salary range"
              style={{ fontWeight: 600, color: '#38bdf8' }}
            />
          </div>
          <button 
            onClick={handleSearch} 
            className="lj-btn-blue" 
            style={{ padding: '8px 24px', fontSize: 14, marginLeft: 'auto', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)' }}
          >
            Search
          </button>
        </div>
      </header>

      <div className="lj-dashboard-body">
        {/* ── Main Content ── */}
        <main className="lj-main" style={{ padding: '32px 48px' }}>
          <div className="lj-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <h2 
                className="lj-section-title" 
                style={{ cursor: 'pointer', opacity: activeTab === 'jobs' ? 1 : 0.5, transition: '0.2s' }}
                onClick={() => setActiveTab('jobs')}
              >
                Recommended jobs <span className="lj-count-badge">{jobs.length > 0 ? jobs.length : '...'}</span>
              </h2>
              <h2 
                className="lj-section-title" 
                style={{ cursor: 'pointer', opacity: activeTab === 'tweets' ? 1 : 0.5, transition: '0.2s' }}
                onClick={() => setActiveTab('tweets')}
              >
                Twitter / X <span className="lj-count-badge">{tweets.length > 0 ? tweets.length : '...'}</span>
              </h2>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              Sort by: <strong>Last updated</strong>
              <span style={{ fontSize: 16 }}>↕</span>
            </div>
          </div>

          {loadingJobs ? (
            <div className="lj-jobs-grid">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="lj-job-card skeleton" style={{ minHeight: 200 }}></div>
               ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search criteria and pressing Enter.</p>
            </div>
          ) : activeTab === 'tweets' ? (
            <div className="lj-jobs-grid">
              {tweets.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-state-icon">🐦</div>
                  <h3>No tweets found</h3>
                  <p>Try broadening your search.</p>
                </div>
              )}
              {tweets.map((tweet, idx) => (
                <div key={tweet.id || idx} className="lj-job-card" style={{ background: '#f0f9ff', animation: `slideUp 0.4s ease ${idx * 0.05}s backwards` }}>
                  <div className="lj-card-header">
                    <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>@ {tweet.author}</span>
                    <button style={{ background: '#e0f2fe', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>🐦</button>
                  </div>
                  <div className="lj-card-company">{new Date(tweet.postedAt).toLocaleDateString()}</div>
                  <h3 className="lj-card-title" style={{ fontSize: 14, fontWeight: 500, marginTop: 12, lineHeight: 1.5, color: '#334155' }}>
                    {tweet.text}
                  </h3>
                  <div className="lj-card-footer" style={{ marginTop: 24 }}>
                    <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="lj-btn-dark" style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', border: 'none' }}>
                      View Tweet
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="lj-jobs-grid">
                {jobs.map((job, idx) => {
                  const bgColor = pastelColors[idx % pastelColors.length];
                  const d = new Date(job.postedAt);
                  const dateStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
                  
                  return (
                    <div key={job.id} className="lj-job-card" style={{ background: bgColor, animation: `slideUp 0.4s ease ${idx * 0.05}s backwards` }}>
                      <div className="lj-card-header">
                        <span>{dateStr}</span>
                        <button 
                          onClick={() => handleSaveJob(job)}
                          style={{ 
                            background: trackedJobs[job.id] ? '#e0f2fe' : 'white', 
                            color: trackedJobs[job.id] ? '#0ea5e9' : 'black',
                            border: 'none', 
                            borderRadius: '50%', 
                            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' 
                          }}
                          title={trackedJobs[job.id] ? "Saved" : "Save Job"}
                        >
                          {trackedJobs[job.id] ? '📑' : '🔖'}
                        </button>
                      </div>
                      
                      <div className="lj-card-company">{job.company}</div>
                      <h3 className="lj-card-title">{job.title}</h3>
                      
                      <div className="lj-card-tags">
                        <span className="lj-card-tag">{job.type === 'FULLTIME' ? 'Full time' : job.type}</span>
                        {job.remote && <span className="lj-card-tag">Remote</span>}
                        {job.highlights?.Qualifications?.[0] && <span className="lj-card-tag" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{job.highlights.Qualifications[0]}</span>}
                      </div>
                      
                      <div className="lj-card-footer">
                        <div>
                          <div className="lj-card-salary">{job.salary || 'Competitive'}</div>
                          <div className="lj-card-location" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{job.location}</div>
                        </div>
                        <button 
                          onClick={() => handleApplyJob(job)}
                          className="lj-btn-dark"
                          style={{ 
                            background: trackedJobs[job.id] === 'Applied' ? '#10b981' : undefined,
                            borderColor: trackedJobs[job.id] === 'Applied' ? '#10b981' : undefined
                          }}
                        >
                          {trackedJobs[job.id] === 'Applied' ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <button 
                    onClick={handleLoadMore} 
                    className="btn btn-secondary"
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Jobs'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
