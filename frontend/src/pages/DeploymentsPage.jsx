import React, { useEffect, useState } from 'react';
import { getDeployments, createDeployment, deleteDeployment, updateDeploymentStatus, exportDeploymentsCsv } from '../api/endpoints';

const RISK_COLORS = {
  HIGH: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  LOW: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
};

const STATUS_OPTIONS = ['PLANNED', 'IN_PROGRESS', 'DEPLOYED', 'FAILED', 'ROLLED_BACK'];
const ENV_OPTIONS = ['PRODUCTION', 'STAGING', 'TEST', 'DEV'];

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', environment: 'STAGING', deployedBy: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';
  const canCreate = isAdmin || user.role === 'DEVELOPER';

  async function load(p = 0) {
    setLoading(true);
    try {
      const res = await getDeployments(p, 10);
      setDeployments(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError('Failed to load deployments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createDeployment(form);
      setSuccess('Deployment created');
      setShowForm(false);
      setForm({ name: '', environment: 'STAGING', deployedBy: '', notes: '' });
      load(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deployment');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this deployment?')) return;
    try {
      await deleteDeployment(id);
      setSuccess('Deleted');
      load(page);
    } catch {
      setError('Failed to delete');
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateDeploymentStatus(id, status);
      setSuccess('Status updated');
      load(page);
    } catch {
      setError('Failed to update status');
    }
  }

  async function handleExport() {
    try {
      await exportDeploymentsCsv();
    } catch {
      setError('Failed to export CSV');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Deployments</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleExport}
            style={{
              background: 'none', color: 'var(--text)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.5rem 1.25rem',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
          {canCreate && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                background: 'var(--primary)', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '0.5rem 1.25rem',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              + New Deployment
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error} <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', float: 'right' }}>x</button>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', padding: '0.75rem', color: '#22c55e', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {success} <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', float: 'right' }}>x</button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Create Deployment</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. PaymentService v2.1" required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Environment *</label>
              <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
                {ENV_OPTIONS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Deployed By *</label>
              <input value={form.deployedBy} onChange={(e) => setForm({ ...form, deployedBy: e.target.value })} placeholder="Username" required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                padding: '0.5rem 1rem', color: 'var(--text-muted)', cursor: 'pointer',
              }}>Cancel</button>
              <button type="submit" style={{
                background: 'var(--primary)', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600,
              }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : deployments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No deployments yet. Create your first one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  {['ID', 'Name', 'Environment', 'Risk', 'Status', 'Deployed By', 'Notes', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deployments.map((d, i) => {
                  const riskStyle = RISK_COLORS[d.riskLevel] || { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' };
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>#{d.id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{d.name}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{d.environment}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          background: riskStyle.bg, color: riskStyle.text,
                          padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        }}>{d.riskLevel}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {canCreate ? (
                          <select
                            value={d.status || ''}
                            onChange={(e) => handleStatusChange(d.id, e.target.value)}
                            style={{ width: 'auto', padding: '3px 6px', fontSize: '0.75rem' }}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.8rem' }}>{d.status || 'N/A'}</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{d.deployedBy}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.notes || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(d.id)}
                            style={{
                              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: '4px', padding: '3px 8px',
                              fontSize: '0.75rem', cursor: 'pointer',
                            }}
                          >Delete</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setPage(page - 1)} disabled={page === 0} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>Prev</button>
            <span style={{ padding: '4px 12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
