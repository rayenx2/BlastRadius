import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const NAV = [
  { path: '/', label: 'Dashboard', icon: '▣' },
  { path: '/deployments', label: 'Deployments', icon: '⬡' },
  { path: '/metadata', label: 'Metadata Changes', icon: '≡' },
  { path: '/releases', label: 'Releases', icon: '◈' },
  { path: '/batch', label: 'Batch Upload', icon: '⇧' },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : '60px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="27" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.35" />
              <circle cx="30" cy="30" r="17" fill="none" stroke="#fff" strokeWidth="3" opacity="0.6" />
              <circle cx="30" cy="30" r="5.5" fill="#fff" />
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>Blastradius</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Change Management</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 1.25rem',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--primary-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
          }}>
            {(user.username || 'U')[0].toUpperCase()}
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, truncate: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.username || 'User'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role || 'VIEWER'}</div>
            </div>
          )}
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: '1rem',
              cursor: 'pointer', padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.15s',
            }}
            onMouseOver={(e) => e.target.style.color = 'var(--danger)'}
            onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            ⎋
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: '56px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          gap: '1rem',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer',
            }}
          >
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Blastradius v1.0 | Rayen Lassoued |{' '}
            <a href="https://github.com/rayenx2" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>github.com/rayenx2</a>
            {' '}|{' '}
            <a href="https://linkedin.com/in/Rayen-Lassoued" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>linkedin.com/in/Rayen-Lassoued</a>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
