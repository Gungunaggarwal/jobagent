'use client';

import { useState } from 'react';

export default function JobCard({ job, onSave, onApply, onPrep, showScore = false, saved = false }) {
  const [expanded, setExpanded] = useState(false);

  const scoreClass =
    !job.score ? '' :
    job.score >= 75 ? 'score-high' :
    job.score >= 50 ? 'score-medium' : 'score-low';

  const matchBadge =
    !job.score ? null :
    job.score >= 75 ? { cls: 'badge-great', label: '✅ Great Match' } :
    job.score >= 50 ? { cls: 'badge-ok',    label: '🟡 Partial Match' } :
                     { cls: 'badge-skip',   label: '❌ Low Match' };

  const logo = job.company?.[0]?.toUpperCase() || '?';
  const postedAgo = formatDate(job.postedAt);

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div
          className="job-card-logo"
          style={{ background: stringToGradient(job.company || '') }}
        >
          {logo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="job-card-title">{job.title}</div>
          <div className="job-card-company">{job.company}</div>
        </div>
        {showScore && job.score !== undefined && (
          <div className={`score-ring ${scoreClass}`} title={`Match score: ${job.score}/100`}>
            {job.score}
          </div>
        )}
      </div>

      <div className="job-card-meta">
        {job.location && (
          <span className="job-card-meta-item">📍 {job.location}</span>
        )}
        {job.remote && (
          <span className="badge badge-new" style={{ fontSize: '10px', padding: '2px 8px' }}>Remote</span>
        )}
        {job.type && (
          <span className="job-card-meta-item">⏱ {formatType(job.type)}</span>
        )}
        {job.salary && (
          <span className="job-card-meta-item" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
            💰 {job.salary}
          </span>
        )}
        <span className="job-card-meta-item" style={{ marginLeft: 'auto' }}>
          🕐 {postedAgo}
        </span>
      </div>

      {job.description && (
        <div
          className="job-card-description"
          style={{ WebkitLineClamp: expanded ? 'unset' : 3 }}
        >
          {job.description}
        </div>
      )}

      {job.description?.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none', border: 'none', color: 'var(--accent-primary)',
            fontSize: '12px', cursor: 'pointer', padding: '0 0 10px 0', fontWeight: 600,
          }}
        >
          {expanded ? 'Show less ↑' : 'Show more ↓'}
        </button>
      )}

      {showScore && job.matchReason && (
        <div style={{
          background: 'rgba(108,99,255,0.07)',
          border: '1px solid rgba(108,99,255,0.18)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          marginBottom: 12,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>🎯 AI Match: </span>
          {job.matchReason}
          {job.matchedSkills?.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {job.matchedSkills.slice(0, 5).map((s) => (
                <span key={s} className="badge badge-new" style={{ fontSize: '10px' }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="job-card-footer">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge badge-source">{job.source}</span>
          {matchBadge && <span className={`badge ${matchBadge.cls}`}>{matchBadge.label}</span>}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {onPrep && (
            <button className="btn btn-secondary btn-sm" onClick={() => onPrep(job)} title="Interview prep">
              🧠 Prep
            </button>
          )}
          {onApply && (
            <button className="btn btn-secondary btn-sm" onClick={() => onApply(job)} title="Generate cover letter">
              📨 Apply
            </button>
          )}
          {onSave && (
            <button
              className={`btn btn-sm ${saved ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => onSave(job)}
            >
              {saved ? '✓ Saved' : '＋ Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return 'Recently';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatType(type) {
  return type === 'FULLTIME' ? 'Full-time'
    : type === 'PARTTIME' ? 'Part-time'
    : type === 'CONTRACT' ? 'Contract'
    : type === 'INTERN' ? 'Internship'
    : type;
}

function stringToGradient(str) {
  const colors = [
    ['#6c63ff','#a855f7'],['#00d4aa','#3b82f6'],['#f59e0b','#ef4444'],
    ['#ec4899','#8b5cf6'],['#06b6d4','#3b82f6'],['#10b981','#059669'],
    ['#f97316','#ef4444'],['#8b5cf6','#6c63ff'],
  ];
  let hash = 0;
  for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  const [a, b] = colors[hash];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
