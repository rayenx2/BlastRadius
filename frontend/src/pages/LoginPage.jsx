import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/endpoints';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: 'admin_user', password: 'AdminPass123!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form.username, form.password);
      const data = res.data;
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          username: data.username || form.username,
          role: data.role || 'VIEWER',
        }));
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '2.5rem',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width="30" height="30" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="27" fill="none" stroke="#fff" strokeWidth="2" opacity="0.35" />
              <circle cx="30" cy="30" r="17" fill="none" stroke="#fff" strokeWidth="2.2" opacity="0.6" />
              <circle cx="30" cy="30" r="5.5" fill="#fff" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Blastradius</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Deployment Audit & Change Management
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="admin_user"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px', padding: '0.75rem',
              color: 'var(--danger)', fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '0.75rem',
              fontSize: '0.9rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '6px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}>
          <strong style={{ color: 'var(--text)' }}>Default credentials:</strong><br />
          Username: admin_user<br />
          Password: AdminPass123!
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Built by{' '}
          <a href="https://github.com/rayenx2" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
            Rayen Lassoued
          </a>
          {' '}|{' '}
          <a href="https://linkedin.com/in/Rayen-Lassoued" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
