'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',        icon: '🏠', label: 'Dashboard',    desc: 'Overview' },
  { href: '/search',  icon: '🔍', label: 'Search Agent', desc: 'Find jobs' },
  { href: '/filter',  icon: '🎯', label: 'Filter Agent', desc: 'Match resume' },
  { href: '/apply',   icon: '📨', label: 'Apply Agent',  desc: 'Track & apply' },
  { href: '/prep',    icon: '🧠', label: 'Prep Agent',   desc: 'Interview prep' },
  { href: '/settings',icon: '⚙️', label: 'Settings',     desc: 'API keys' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🤖</div>
        <span className="sidebar-logo-text">JobAgent</span>
      </div>

      <p className="sidebar-section-label">Agents</p>

      <nav className="sidebar-nav">
        {NAV_ITEMS.slice(0, 5).map((item) => (
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
        <p className="sidebar-section-label">Config</p>

        {NAV_ITEMS.slice(5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '0 12px', lineHeight: 1.5 }}>
          Powered by Gemini AI<br />+ RapidAPI
        </div>
      </div>
    </aside>
  );
}
