'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTrackerStats, getResume } from '@/lib/storage';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, saved: 0, applied: 0, interview: 0, offer: 0 });
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    setStats(getTrackerStats());
    setHasResume(!!getResume());
  }, []);

  const agents = [
    {
      href: '/search',
      icon: '🔍',
      name: 'Search Agent',
      desc: 'Find jobs from LinkedIn, Indeed, Glassdoor & Twitter/X',
      accent: '#4f46e5',
    },
    {
      href: '/filter',
      icon: '🎯',
      name: 'Filter Agent',
      desc: 'AI scores every job against your resume (0–100)',
      accent: '#0891b2',
    },
    {
      href: '/apply',
      icon: '📨',
      name: 'Apply Agent',
      desc: 'Tailored cover letters + application pipeline tracker',
      accent: '#d97706',
    },
    {
      href: '/prep',
      icon: '🧠',
      name: 'Prep Agent',
      desc: 'Interview Q&As, company cheat sheets, 30-60-90 plans',
      accent: '#059669',
    },
  ];

  const pipeline = [
    { label: 'Saved',     count: stats.saved,     icon: '🔖', color: 'var(--text-secondary)' },
    { label: 'Applied',   count: stats.applied,   icon: '📨', color: 'var(--accent-primary)' },
    { label: 'Interview', count: stats.interview, icon: '🗓️', color: 'var(--accent-amber)' },
    { label: 'Offer',     count: stats.offer,     icon: '🎉', color: 'var(--accent-green)' },
  ];

  const steps = [
    { n: '1', text: 'Add your resume in Settings', href: '/settings', done: hasResume },
    { n: '2', text: 'Search for jobs by title, location, or keywords', href: '/search', done: false },
    { n: '3', text: 'Run Filter Agent — AI ranks jobs by resume match', href: '/filter', done: false },
    { n: '4', text: 'Generate cover letters and track your applications', href: '/apply', done: stats.total > 0 },
    { n: '5', text: 'Prep Agent — get interview questions for any saved job', href: '/prep', done: false },
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800,
          color: 'var(--text-primary)', letterSpacing: '-0.03em',
          lineHeight: 1.2, marginBottom: 8,
        }}>
          Your AI Job Search<br />Command Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 480, lineHeight: 1.6 }}>
          Four specialised agents that search, filter, apply, and prepare you for your next role — all in one place.
        </p>

        {!hasResume && (
          <div className="info-banner warning" style={{ marginTop: 16, maxWidth: 440 }}>
            ⚠️ No resume yet —&nbsp;
            <Link href="/settings" style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
              add it in Settings
            </Link>
            &nbsp;to unlock AI matching
          </div>
        )}
      </div>

      {/* Agent cards */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Your Agents</h2>
        </div>
        <div className="agents-row">
          {agents.map((a) => (
            <Link key={a.href} href={a.href} className="agent-widget">
              <span className="agent-widget-icon">{a.icon}</span>
              <div className="agent-widget-name" style={{ color: a.accent }}>{a.name}</div>
              <div className="agent-widget-desc">{a.desc}</div>
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: a.accent }}>
                Open →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pipeline stats — only shown when there's data */}
      {stats.total > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Application Pipeline</h2>
            <Link href="/apply" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Tracked</div>
            </div>
            {pipeline.map((p) => (
              <div key={p.label} className="stat-card">
                <div style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</div>
                <div className="stat-value" style={{ color: p.color }}>{p.count}</div>
                <div className="stat-label">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick start checklist */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Quick Start</h2>
        </div>
        <div className="card card-flat">
          {steps.map((s, i) => (
            <Link key={s.n} href={s.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 0',
                borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background var(--transition)',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.done ? 'var(--accent-green-bg)' : 'var(--accent-light)',
                  border: `2px solid ${s.done ? '#a7f3d0' : 'var(--border-accent)'}`,
                  fontSize: 11, fontWeight: 700,
                  color: s.done ? 'var(--accent-green)' : 'var(--accent-primary)',
                }}>
                  {s.done ? '✓' : s.n}
                </div>
                <span style={{
                  fontSize: 14, color: s.done ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: s.done ? 'line-through' : 'none', flex: 1,
                }}>
                  {s.text}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
