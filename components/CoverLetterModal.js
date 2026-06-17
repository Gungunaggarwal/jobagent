'use client';

import { useState } from 'react';

export default function CoverLetterModal({ job, resume, onClose, onSave }) {
  const [tab, setTab] = useState('cover');
  const [content, setContent] = useState('');
  const [bulletContent, setBulletContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate(type) {
    setLoading(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, resume, type }),
      });
      const data = await res.json();
      if (type === 'cover_letter') setContent(data.content || '');
      if (type === 'resume_bullets') setBulletContent(data.content || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function copy(text) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentContent = tab === 'cover' ? content : bulletContent;
  const currentType    = tab === 'cover' ? 'cover_letter' : 'resume_bullets';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">📨 Apply Agent</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {job.title} at <span style={{ color: 'var(--text-accent)' }}>{job.company}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="tab-group">
          <button className={`tab-btn ${tab === 'cover' ? 'active' : ''}`} onClick={() => setTab('cover')}>
            Cover Letter
          </button>
          <button className={`tab-btn ${tab === 'bullets' ? 'active' : ''}`} onClick={() => setTab('bullets')}>
            Resume Bullets
          </button>
        </div>

        {/* Content area */}
        {currentContent ? (
          <div>
            <textarea
              className="textarea"
              style={{ minHeight: 260, fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
              value={currentContent}
              onChange={(e) => tab === 'cover' ? setContent(e.target.value) : setBulletContent(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => copy(currentContent)} disabled={loading}>
                {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
              </button>
              <button className="btn btn-secondary" onClick={() => generate(currentType)} disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Generating...</> : '↺ Regenerate'}
              </button>
              {onSave && tab === 'cover' && (
                <button className="btn btn-success" onClick={() => { onSave(content); onClose(); }}>
                  💾 Save & Mark Applied
                </button>
              )}
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ marginLeft: 'auto' }}
              >
                🔗 Open Job ↗
              </a>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {tab === 'cover' ? '✉️' : '📝'}
            </div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>
              {tab === 'cover' ? 'Generate a tailored cover letter' : 'Generate tailored resume bullets'}
            </h3>
            <p style={{ marginBottom: 20 }}>
              {tab === 'cover'
                ? 'AI will craft a personalized cover letter matching this specific role and your background.'
                : 'AI will write 3–4 achievement-oriented bullet points tailored to this job description.'}
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => generate(currentType)}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" /> Generating with AI...</>
                : `✨ Generate ${tab === 'cover' ? 'Cover Letter' : 'Resume Bullets'}`}
            </button>
          </div>
        )}

        {!resume?.trim() && (
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            color: '#f59e0b',
          }}>
            ⚠️ No resume found — go to <strong>Settings</strong> to add your resume for personalized output.
          </div>
        )}
      </div>
    </div>
  );
}
