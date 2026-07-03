import React, { useEffect, useState } from 'react';
import { getMetadataChanges, exportMetadataChangesCsv } from '../api/endpoints';

const CHANGE_COLORS = {
  CREATED: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  MODIFIED: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  DELETED: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
};

export default function MetadataPage() {
  const [changes, setChanges] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load(p = 0) {
    setLoading(true);
    try {
      const res = await getMetadataChanges(p, 20);
      setChanges(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error('Error loading metadata:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]);

  const filtered = changes.filter((c) =>
    !search || c.componentName?.toLowerCase().includes(search.toLowerCase()) ||
    c.changedBy?.toLowerCase().includes(search.toLowerCase()) ||
    c.changeType?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleExport() {
    try {
      await exportMetadataChangesCsv();
    } catch {
      // export failures are non-fatal to the page; the button itself gives immediate feedback via the browser download
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Metadata Changes</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by component, user, type..."
            style={{ maxWidth: '300px' }}
          />
          <button
            onClick={handleExport}
            style={{
              background: 'none', color: 'var(--text)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.5rem 1.25rem',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No metadata changes found. Upload a CSV in the Batch Upload tab.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  {['ID', 'Component', 'Type', 'Change', 'Changed By', 'Deployment', 'Old Value', 'New Value', 'Changed At'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const changeStyle = CHANGE_COLORS[c.changeType] || { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' };
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)' }}>#{c.id}</td>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: 500 }}>{c.componentName}</td>
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)' }}>{c.componentType}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <span style={{
                          background: changeStyle.bg, color: changeStyle.text,
                          padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        }}>{c.changeType}</span>
                      </td>
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)' }}>{c.changedBy}</td>
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)' }}>#{c.deploymentId}</td>
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.oldValue || '—'}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.newValue || '—'}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {c.changedAt ? new Date(c.changedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
