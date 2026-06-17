'use client';

import { useRef, useState } from 'react';
import { saveResume } from '@/lib/storage';

export default function ResumeUploader({ onComplete, existingResume = '' }) {
  const [tab, setTab] = useState(existingResume ? 'text' : 'upload');
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState(existingResume);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  async function processFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    setFilename(file.name);
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setText(data.resumeText || '');
      saveResume(data.resumeText || '');
      onComplete?.(data.resumeText, data.structured);
    } catch (e) {
      setError('Upload failed. Try pasting your resume text instead.');
    } finally {
      setLoading(false);
    }
  }

  async function saveText() {
    if (!text.trim()) { setError('Please enter your resume text.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        body: (() => { const f = new FormData(); f.append('text', text); return f; })(),
      });
      const data = await res.json();
      saveResume(text);
      onComplete?.(text, data.structured);
    } catch {
      saveResume(text);
      onComplete?.(text, null);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <div className="tab-group" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>
          📄 Upload PDF
        </button>
        <button className={`tab-btn ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>
          ✏️ Paste Text
        </button>
      </div>

      {tab === 'upload' && (
        <div>
          <div
            className={`upload-zone ${dragging ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {loading ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
                <div className="upload-label">Parsing your resume...</div>
              </>
            ) : filename ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div className="upload-label">{filename}</div>
                <div className="upload-hint">Click to replace</div>
              </>
            ) : (
              <>
                <div className="upload-icon">📄</div>
                <div className="upload-label">Drop your PDF here or click to browse</div>
                <div className="upload-hint">PDF format · Max 10MB</div>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => processFile(e.target.files[0])}
          />
          {text && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'rgba(0,212,170,0.08)',
              border: '1px solid rgba(0,212,170,0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12, color: 'var(--accent-secondary)',
            }}>
              ✓ Resume parsed — {text.split(' ').length} words extracted
            </div>
          )}
        </div>
      )}

      {tab === 'text' && (
        <div>
          <textarea
            className="textarea"
            style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 12 }}
            placeholder="Paste your full resume here — name, experience, skills, education..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              className="btn btn-primary"
              onClick={saveText}
              disabled={loading || !text.trim()}
            >
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save Resume'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 10, padding: '10px 14px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: 'var(--accent-danger)',
        }}>
          ✗ {error}
        </div>
      )}
    </div>
  );
}
