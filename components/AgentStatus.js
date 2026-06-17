'use client';

export default function AgentStatus({ agent, status, message, children }) {
  const agents = {
    search: { icon: '🔍', name: 'Search Agent',  color: '#6c63ff' },
    filter: { icon: '🎯', name: 'Filter Agent',  color: '#00d4aa' },
    apply:  { icon: '📨', name: 'Apply Agent',   color: '#f59e0b' },
    prep:   { icon: '🧠', name: 'Prep Agent',    color: '#3b82f6' },
  };

  const info = agents[agent] || { icon: '🤖', name: 'Agent', color: '#6c63ff' };

  const isThinking = status === 'thinking';
  const isDone     = status === 'done';
  const isError    = status === 'error';
  const isIdle     = status === 'idle' || !status;

  return (
    <div
      className="agent-panel"
      style={{
        borderColor: isThinking
          ? 'var(--border-accent)'
          : isDone
          ? '#a7f3d0'
          : isError
          ? '#fecaca'
          : 'var(--border)',
        background: isThinking ? 'var(--accent-light)' : isDone ? 'var(--accent-green-bg)' : 'var(--bg-surface)',
      }}
    >
      <div
        className="agent-avatar"
        style={{
          background: isThinking ? 'var(--accent-light)' : isDone ? 'var(--accent-green-bg)' : 'var(--bg-subtle)',
          border: `1px solid ${isThinking ? 'var(--border-accent)' : isDone ? '#a7f3d0' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {info.icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, fontFamily: 'var(--font-display)' }}>
          {info.name}
        </div>

        {isThinking && (
          <div className="agent-thinking">
            <div className="pulse-dots">
              <div className="pulse-dot" />
              <div className="pulse-dot" />
              <div className="pulse-dot" />
            </div>
            <span>{message || 'Working on it...'}</span>
          </div>
        )}

        {isDone && (
          <div style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 500 }}>
            ✓ {message || 'Done'}
          </div>
        )}

        {isError && (
          <div style={{ fontSize: 13, color: 'var(--accent-red)', fontWeight: 500 }}>
            ✗ {message || 'Something went wrong'}
          </div>
        )}

        {isIdle && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {message || 'Ready'}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
