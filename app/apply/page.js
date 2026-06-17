'use client';

import { useState, useEffect } from 'react';
import AgentStatus from '@/components/AgentStatus';
import CoverLetterModal from '@/components/CoverLetterModal';
import {
  getApplications, updateApplicationStatus, removeApplication,
  getResume, APPLICATION_STATUSES, getTrackerStats,
} from '@/lib/storage';

const STATUS_ICONS = {
  Saved: '🔖', Applied: '📨', Interview: '🗓️', Offer: '🎉', Rejected: '✗',
};

export default function ApplyPage() {
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState({});
  const [applyJob, setApplyJob] = useState(null);
  const [filter, setFilter] = useState('All');
  const [resume, setResume] = useState('');
  const [agentStatus, setAgentStatus] = useState('idle');
  const [agentMsg, setAgentMsg] = useState('Click a job to generate a cover letter');

  useEffect(() => {
    refresh();
    setResume(getResume());
  }, []);

  function refresh() {
    setApps(getApplications());
    setStats(getTrackerStats());
  }

  function changeStatus(id, status) {
    updateApplicationStatus(id, status);
    refresh();
  }

  function remove(id) {
    if (!confirm('Remove this application?')) return;
    removeApplication(id);
    refresh();
  }

  function openApply(job) {
    setApplyJob(job);
    setAgentStatus('thinking');
    setAgentMsg(`Preparing application for ${job.title} at ${job.company}...`);
    setTimeout(() => {
      setAgentStatus('idle');
      setAgentMsg('Cover letter modal opened');
    }, 800);
  }

  const filtered = filter === 'All' ? apps : apps.filter((a) => a.status === filter);

  const pipeline = APPLICATION_STATUSES.map((s) => ({
    label: s, icon: STATUS_ICONS[s],
    count: apps.filter((a) => a.status === s).length,
  }));

  return (
    <div>
      <div className="page-header">
        <h1>📨 Apply Agent</h1>
        <p>Generate tailored cover letters and track your entire application pipeline</p>
      </div>

      <AgentStatus agent="apply" status={agentStatus} message={agentMsg} />

      {/* Pipeline stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[{ label: 'All', icon: '📊', count: apps.length }, ...pipeline].map((p) => (
          <button
            key={p.label}
            onClick={() => setFilter(p.label)}
            style={{
              background: filter === p.label ? 'rgba(108,99,255,0.15)' : 'var(--bg-card)',
              border: `1px solid ${filter === p.label ? 'var(--border-accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minWidth: 80, transition: 'all 0.2s',
              color: filter === p.label ? 'var(--text-accent)' : 'var(--text-secondary)',
            }}
          >
            <span style={{ fontSize: 20 }}>{p.icon}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: filter === p.label ? 'var(--text-primary)' : 'inherit' }}>{p.count}</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="card card-flat" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="tracker-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Saved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{app.title}</div>
                      {app.location && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>📍 {app.location}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-accent)' }}>{app.company}</div>
                      {app.source && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{app.source}</div>}
                    </td>
                    <td>
                      {app.score != null ? (
                        <span className={`score-ring ${app.score >= 75 ? 'score-high' : app.score >= 50 ? 'score-medium' : 'score-low'}`}
                          style={{ width: 36, height: 36, fontSize: 11 }}>
                          {app.score}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <select
                        value={app.status}
                        onChange={(e) => changeStatus(app.id, e.target.value)}
                        className={`status-pill status-${app.status.toLowerCase()}`}
                        style={{ border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11 }}
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s} value={s} style={{ background: 'var(--bg-surface)' }}>{STATUS_ICONS[s]} {s}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(app.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openApply(app)}
                          title="Generate cover letter"
                        >
                          ✉️ Cover Letter
                        </button>
                        {app.applyUrl && app.applyUrl !== '#' && (
                          <a
                            href={app.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            onClick={() => changeStatus(app.id, 'Applied')}
                          >
                            Apply ↗
                          </a>
                        )}
                        <button
                          className="btn btn-sm"
                          style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                          onClick={() => remove(app.id)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📨</div>
          <h3>{filter === 'All' ? 'No applications yet' : `No ${filter} applications`}</h3>
          <p>
            {filter === 'All'
              ? 'Save jobs from the Search or Filter pages to start tracking your applications.'
              : `Change status of applications in the table to "${filter}" to see them here.`}
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ marginTop: 28, borderColor: 'rgba(0,212,170,0.2)', background: 'rgba(0,212,170,0.04)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--accent-secondary)' }}>
          💡 Apply Agent Tips
        </div>
        <div className="grid-3" style={{ gap: 16 }}>
          {[
            { icon: '✉️', title: 'Cover Letter', text: 'Click "Cover Letter" next to any job. AI tailors it to the specific role and your resume.' },
            { icon: '📋', title: 'Copy & Paste', text: 'Copy the generated letter and paste it into the job application form. One click to open the job URL.' },
            { icon: '📊', title: 'Track Pipeline', text: 'Update status to Applied → Interview → Offer as you progress. Filter by stage to focus.' },
          ].map((t) => (
            <div key={t.title} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>{t.title}</strong>
              {t.text}
            </div>
          ))}
        </div>
      </div>

      {applyJob && (
        <CoverLetterModal
          job={applyJob}
          resume={resume}
          onClose={() => { setApplyJob(null); refresh(); }}
          onSave={() => { updateApplicationStatus(applyJob.id, 'Applied'); refresh(); }}
        />
      )}
    </div>
  );
}
