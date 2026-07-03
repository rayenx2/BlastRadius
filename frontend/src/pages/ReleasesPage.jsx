import React, { useEffect, useState } from 'react';
import {
  getReleases, createRelease, deleteRelease, getReleaseSummary,
  assignDeploymentToRelease, updateReleaseStatus, getDeployments,
} from '../api/endpoints';

const STATUS_COLORS = {
  PLANNED: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  DEPLOYED: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  ROLLED_BACK: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
};

const STATUS_OPTIONS = ['PLANNED', 'IN_PROGRESS', 'DEPLOYED', 'ROLLED_BACK'];
const RISK_COLORS = {
  HIGH: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  LOW: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
};

export default function ReleasesPage() {
  const [releases, setReleases] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ releaseName: '', version: '', plannedDate: '', createdBy: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [assignChoice, setAssignChoice] = useState({});

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';
  const canManage = isAdmin || user.role === 'DEVELOPER';

  async function load() {
    setLoading(true);
    try {
      const [releasesRes, deploymentsRes] = await Promise.all([
        getReleases(),
        getDeployments(0, 100),
      ]);
      setReleases(releasesRes.data?.content || releasesRes.data || []);
      setDeployments(deploymentsRes.data?.content || deploymentsRes.data || []);
    } catch (err) {
      setError('Failed to load releases');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createRelease(form);
      setSuccess('Release created');
      setShowForm(false);
      setForm({ releaseName: '', version: '', plannedDate: '', createdBy: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create release');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this release?')) return;
    try {
      await deleteRelease(id);
      setSuccess('Deleted');
      load();
    } catch {
      setError('Failed to delete');
    }
  }

  async function loadSummary(id) {
    try {
      const res = await getReleaseSummary(id);
      setSummaries((prev) => ({ ...prev, [id]: res.data }));
    } catch {
      setError('Failed to load release detail');
    }
  }

  function toggleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!summaries[id]) loadSummary(id);
  }

  async function handleAssign(releaseId) {
    const deploymentId = assignChoice[releaseId];
    if (!deploymentId) return;
    try {
      await assignDeploymentToRelease(releaseId, Number(deploymentId));
      setSuccess('Deployment linked to release');
      setAssignChoice((prev) => ({ ...prev, [releaseId]: '' }));
      loadSummary(releaseId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to link deployment');
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateReleaseStatus(id, status);
      setSuccess('Release status updated');
      load();
    } catch {
      setError('Failed to update status');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Releases</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '0.5rem 1.25rem',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          + New Release
        </button>
      </div>

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

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Create Release</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Release Name *</label>
              <input value={form.releaseName} onChange={(e) => setForm({ ...form, releaseName: e.target.value })} placeholder="Q2 2026 Release" required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Version *</label>
              <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="2.1.0" required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Planned Date</label>
              <input type="date" value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Created By *</label>
              <input value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })} placeholder="Username" required />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem 1rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>Create</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : releases.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No releases yet.</div>
        ) : (
          releases.map((r) => {
            const st = STATUS_COLORS[r.status] || { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' };
            const isExpanded = expandedId === r.id;
            const summary = summaries[r.id];
            const linkedIds = new Set((summary?.deployments || []).map((d) => d.id));
            const availableDeployments = deployments.filter((d) => !linkedIds.has(d.id));

            return (
              <div key={r.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{r.releaseName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>v{r.version}</div>
                  </div>
                  {canManage ? (
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      style={{
                        background: st.bg, color: st.text, border: 'none',
                        padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span style={{
                      background: st.bg, color: st.text,
                      padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>{r.status}</span>
                  )}
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {r.createdBy && <div>Created by: {r.createdBy}</div>}
                  {r.plannedDate && <div>Planned: {new Date(r.plannedDate).toLocaleDateString()}</div>}
                  {r.createdAt && <div>Created: {new Date(r.createdAt).toLocaleDateString()}</div>}
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleExpand(r.id)}
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: '4px', padding: '3px 10px',
                      fontSize: '0.75rem', color: 'var(--text)', cursor: 'pointer',
                    }}
                  >{isExpanded ? 'Hide details' : 'View linked deployments'}</button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '4px', padding: '3px 8px',
                        fontSize: '0.75rem', cursor: 'pointer',
                      }}
                    >Delete</button>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    {!summary ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</div>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          {summary.totalDeployments} deployment{summary.totalDeployments === 1 ? '' : 's'} linked · {summary.totalMetadataChanges} metadata change{summary.totalMetadataChanges === 1 ? '' : 's'} across them
                        </div>
                        {summary.deployments && summary.deployments.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            {summary.deployments.map((d) => {
                              const rk = RISK_COLORS[d.riskLevel] || { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' };
                              return (
                                <div key={d.id} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  background: 'var(--surface2)', borderRadius: '6px', padding: '0.4rem 0.6rem',
                                  fontSize: '0.8rem',
                                }}>
                                  <span>{d.name}</span>
                                  <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{d.environment}</span>
                                    <span style={{ background: rk.bg, color: rk.text, padding: '1px 6px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 600 }}>{d.riskLevel}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>No deployments linked yet.</div>
                        )}

                        {canManage && availableDeployments.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                              value={assignChoice[r.id] || ''}
                              onChange={(e) => setAssignChoice((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              style={{ flex: 1, fontSize: '0.75rem', padding: '4px 6px' }}
                            >
                              <option value="">Link a deployment...</option>
                              {availableDeployments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name} ({d.environment})</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(r.id)}
                              disabled={!assignChoice[r.id]}
                              style={{
                                background: 'var(--primary)', color: '#fff', border: 'none',
                                borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem',
                                cursor: assignChoice[r.id] ? 'pointer' : 'not-allowed',
                                opacity: assignChoice[r.id] ? 1 : 0.6,
                              }}
                            >Link</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
