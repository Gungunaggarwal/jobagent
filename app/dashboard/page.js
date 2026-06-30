'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getTrackerStats, getApplications } from '@/lib/storage';
import { motion } from 'framer-motion';
import { Search, Filter, Send, BrainCircuit, Briefcase, TrendingUp, ChevronRight, Target } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({ total: 0, saved: 0, applied: 0, interview: 0, offer: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);



  useEffect(() => {
    setStats(getTrackerStats());
    setRecentJobs(getApplications().slice(0, 4));

    async function fetchProfile() {
      try {
        await fetch('/api/user/profile');
      } catch (err) {
        console.error("Could not load profile", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    
    if (status === 'authenticated') {
      fetchProfile();
    } else {
      setLoadingProfile(false);
    }
  }, [status, session]);

  if (status === 'loading' || loadingProfile) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner"></div></div>;
  }

  // Calculate percentages for the donut chart
  const total = stats.total || 1; 
  const pctSaved = (stats.saved / total) * 100;
  const pctApplied = (stats.applied / total) * 100;
  const pctInterview = (stats.interview / total) * 100;
  const pctOffer = (stats.offer / total) * 100;

  // Donut Segments
  let offset = 0;
  const donutSegments = [
    { color: '#38bdf8', pct: pctSaved, label: 'Saved' },
    { color: '#818cf8', pct: pctApplied, label: 'Applied' },
    { color: '#34d399', pct: pctInterview, label: 'Interviewing' },
    { color: '#fbbf24', pct: pctOffer, label: 'Offers' },
  ].filter(s => s.pct > 0);

  // Calculate Activity Over Last 5 Days
  const apps = typeof window !== 'undefined' ? getApplications() : [];
  const last5Days = [...Array(5)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    return d.toISOString().split('T')[0];
  });
  
  const barData = last5Days.map(dateStr => {
    return apps.filter(a => a.savedAt?.startsWith(dateStr) || a.appliedAt?.startsWith(dateStr)).length;
  });
  const maxBar = Math.max(...barData, 5);

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="glass-container">
      {/* Dynamic Aurora Background */}
      <div className="aurora-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        style={{ padding: '40px', position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto' }}
      >
        
        {/* Header Section */}
        <motion.div variants={itemVars} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Hello {session?.user?.name?.split(' ')[0] || 'User'} <span style={{display:'inline-block', animation:'wave 2s infinite', transformOrigin: '70% 70%'}}>👋</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: 16 }}>Here is your application overview today.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderRadius: 20, padding: '10px 20px', display: 'flex', gap: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.6)' }}>
               <Briefcase size={18} color="#38bdf8" />
               <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{stats.total} Active Jobs</span>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, boxShadow: '0 8px 16px rgba(56,189,248,0.2)' }}>
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          
          {/* Main Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Wallet Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
              
              {/* Primary Card */}
              <motion.div variants={itemVars} className="wallet-card">
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9, marginBottom: 12, fontWeight: 600 }}>Tracked Pipeline</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, marginBottom: 28, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  {stats.total} <span style={{ fontSize: 20, opacity: 0.8, fontWeight: 500 }}>Jobs</span>
                </div>
                
                <div style={{ display: 'flex', gap: 32 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.applied}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interviewing</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.interview}</div>
                  </div>
                </div>
              </motion.div>

              {/* Secondary Card */}
              <motion.div variants={itemVars} className="wallet-card-secondary">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                  <div style={{ width: 44, height: 28, background: 'rgba(255,255,255,0.25)', borderRadius: 6, backdropFilter: 'blur(5px)' }}></div>
                  <Target size={24} opacity={0.9} />
                </div>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offers Received</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800 }}>{stats.offer}</div>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              
              {/* Donut Chart */}
              <motion.div variants={itemVars} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>Pipeline Breakdown</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
                  <div style={{ width: 140, height: 140, position: 'relative' }}>
                    <svg viewBox="0 0 32 32" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                      <circle r="15.9155" cx="16" cy="16" fill="transparent" stroke="rgba(56,189,248,0.1)" strokeWidth="5" />
                      
                      {donutSegments.length > 0 ? donutSegments.map((seg, i) => {
                        const strokeDasharray = `${seg.pct} ${100 - seg.pct}`;
                        const strokeDashoffset = -offset;
                        offset += seg.pct;
                        return (
                          <motion.circle 
                            key={seg.label}
                            r="15.9155" cx="16" cy="16" 
                            fill="transparent" 
                            stroke={seg.color} 
                            strokeWidth="5" 
                            strokeDasharray={strokeDasharray}
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                            strokeLinecap="round"
                          />
                        );
                      }) : (
                        <circle r="15.9155" cx="16" cy="16" fill="transparent" stroke="#e0f2fe" strokeWidth="5" />
                      )}
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                       <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total</span>
                       <span style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>{stats.total}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {donutSegments.length > 0 ? donutSegments.map(seg => (
                      <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '4px', background: seg.color }}></div>
                        <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{seg.label}</span>
                      </div>
                    )) : (
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>No data yet</div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Bar Chart */}
              <motion.div variants={itemVars} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                   <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Activity Overview</h3>
                   <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, background: '#f0f9ff', padding: '6px 12px', borderRadius: 12, border: '1px solid #e0f2fe' }}>This Week</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, padding: '0 10px' }}>
                  {barData.map((val, i) => {
                    const heightPct = (val / maxBar) * 100;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 14, height: 100, background: 'rgba(56,189,248,0.1)', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 1, delay: i * 0.1, type: 'spring', damping: 15 }}
                            style={{ position: 'absolute', bottom: 0, width: '100%', background: 'linear-gradient(to top, #38bdf8, #818cf8)', borderRadius: 8 }}
                          ></motion.div>
                        </div>
                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{i === 4 ? 'Today' : last5Days[i].split('-').slice(1).join('/')}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Quick Menu */}
            <motion.div variants={itemVars}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 20, paddingLeft: 8 }}>Quick Services</h3>
              <div className="quick-menu-grid">
                <Link href="/search" className="quick-menu-item">
                  <div className="quick-menu-icon"><Search size={22} /></div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Search</span>
                </Link>
                <Link href="/filter" className="quick-menu-item">
                  <div className="quick-menu-icon"><Filter size={22} /></div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Filter</span>
                </Link>
                <Link href="/apply" className="quick-menu-item">
                  <div className="quick-menu-icon"><Send size={22} /></div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Apply</span>
                </Link>
                <Link href="/prep" className="quick-menu-item">
                  <div className="quick-menu-icon"><BrainCircuit size={22} /></div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Prep</span>
                </Link>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVars} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Recent Activity</h3>
                <TrendingUp size={16} color="#94a3b8" />
              </div>
              
              {recentJobs.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>
                  No recent activity found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentJobs.map((job, idx) => (
                    <motion.div 
                      key={job.id} 
                      className="recent-txn-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (idx * 0.1) }}
                    >
                      <div className="txn-icon" style={{ 
                        background: job.status === 'Applied' ? '#f0f9ff' : '#f8fafc', 
                        color: job.status === 'Applied' ? '#38bdf8' : '#64748b',
                        boxShadow: 'none'
                      }}>
                        {job.company.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{job.company}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: job.status === 'Applied' ? '#38bdf8' : '#818cf8' }}>
                        {job.status === 'Applied' ? '→ Applied' : '+ Saved'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {recentJobs.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Link href="/apply" style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    View all <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </motion.div>

          </div>

        </div>
      </motion.div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
      `}} />
    </div>
  );
}
