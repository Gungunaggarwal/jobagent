'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/search',    icon: '🔍', label: 'Search Agent' },
  { href: '/filter',    icon: '🎯', label: 'Filter Agent' },
  { href: '/apply',     icon: '📨', label: 'Apply Agent' },
  { href: '/prep',      icon: '🧠', label: 'Prep Agent' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: 22 }}>🤖</span>
        Talento
      </div>

      <div style={{ padding: '0 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        Agents
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        <hr className="divider" style={{ margin: '12px 0' }} />
        
        <Link href="/settings" className={`sidebar-link ${pathname === '/settings' ? 'active' : ''}`}>
          <span className="sidebar-icon">⚙️</span>
          Settings
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: '/' })} 
          className="sidebar-link" 
          style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 8 }}
        >
          <span className="sidebar-icon">🚪</span>
          Log out
        </button>
      </nav>

      {/* Footer info */}
      <div style={{ marginTop: 'auto', padding: '24px 12px 12px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
        Powered by Gemini AI<br/>
        & RapidAPI
      </div>
    </aside>
  );
}
