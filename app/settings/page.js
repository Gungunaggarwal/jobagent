'use client';

import { useState, useEffect } from 'react';
import ResumeUploader from '@/components/ResumeUploader';
import { getResume } from '@/lib/storage';

export default function SettingsPage() {
  const [resume, setResume] = useState('');
  const [resumeOk, setResumeOk] = useState(false);

  useEffect(() => {
    const r = getResume();
    setResume(r);
    setResumeOk(!!r);
  }, []);

  function handleResumeComplete(text) {
    setResume(text);
    setResumeOk(true);
  }

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your resume used by all four agents</p>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'RapidAPI Key',  ok: true,      icon: '🔑', note: 'Configured' },
          { label: 'Gemini Key',    ok: true,       icon: '🤖', note: 'Configured' },
          { label: 'Resume',        ok: resumeOk,   icon: '📄', note: resumeOk ? `${resume.split(' ').length} words loaded` : 'Not added yet' },
        ].map((item) => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-surface)', border: `1px solid ${item.ok ? '#a7f3d0' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', padding: '10px 16px',
            flex: '1 1 180px', boxShadow: 'var(--shadow-xs)',
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: item.ok ? 'var(--accent-green)' : 'var(--text-muted)', marginTop: 1, fontWeight: 500 }}>
                {item.ok ? '✓ ' : ''}{item.note}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resume section */}
      <div className="card" style={{ maxWidth: 660 }}>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            📄 Your Resume
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Used by all agents — Filter scores jobs against it, Apply personalises cover letters, Prep tailors interview answers. Stored locally in your browser only.
          </p>
        </div>

        <hr className="divider" />

        <ResumeUploader onComplete={handleResumeComplete} existingResume={resume} />

        {resumeOk && (
          <div className="info-banner success" style={{ marginTop: 14 }}>
            ✓ Resume saved — {resume.split(' ').length} words · stored in your browser
          </div>
        )}
      </div>
    </div>
  );
}
