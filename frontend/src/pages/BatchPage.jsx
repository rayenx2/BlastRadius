import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadMetadataCsv, getBatchUploadHistory } from '../api/endpoints';

export default function BatchPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  async function loadHistory() {
    try {
      const res = await getBatchUploadHistory();
      setHistory(res.data || []);
    } catch {
      // history is a convenience view, not critical to surface a failure here
    }
  }

  useEffect(() => { loadHistory(); }, []);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await uploadMetadataCsv(file);
      setResult(res.data);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Upload failed. Check CSV format.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Batch CSV Upload</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Upload area */}
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              background: dragOver ? 'rgba(249,115,22,0.06)' : 'var(--surface)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⬆</div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              {file ? file.name : 'Drop CSV file here or click to browse'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB — Ready to upload` : 'Supports CSV files up to 100MB (40,000+ records)'}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          {file && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleUpload}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'var(--primary)', color: '#fff', border: 'none',
                  borderRadius: '8px', padding: '0.65rem',
                  fontWeight: 600, fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Processing...' : 'Upload & Process'}
              </button>
              <button
                onClick={() => { setFile(null); setResult(null); setError(''); }}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '0.65rem 1rem',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem' }}>
              {String(error)}
            </div>
          )}

          {result && (
            <div style={{ marginTop: '1rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: '0.75rem' }}>Batch Processing Complete</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <Stat label="Records read" value={result.totalRecordsRead} />
                <Stat label="Imported" value={result.successfulRecords} color="#22c55e" />
                <Stat label="Skipped" value={result.skippedRecords} color={result.skippedRecords > 0 ? '#f59e0b' : undefined} />
                <Stat label="Time" value={`${result.processingTimeMs} ms`} />
              </div>
              <button
                onClick={() => navigate('/metadata')}
                style={{
                  width: '100%', background: 'var(--primary)', color: '#fff', border: 'none',
                  borderRadius: '6px', padding: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                View imported changes →
              </button>
            </div>
          )}

          {history.length > 0 && (
            <div style={{ marginTop: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Upload History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '0.78rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{h.filename}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {h.successfulRecords}/{h.totalRecords} imported · {h.uploadedBy} · {new Date(h.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>CSV Format</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            The CSV must include a header row with the following columns:
          </p>
          <pre style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '0.75rem',
            fontSize: '0.75rem', color: '#22c55e', overflowX: 'auto',
            marginBottom: '1rem', lineHeight: 1.6,
          }}>
{`component_name,component_type,change_type,
changed_by,deployment_id,changed_at,
old_value,new_value`}
          </pre>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--text)' }}>Example rows:</strong>
          </div>
          <pre style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '0.75rem',
            fontSize: '0.7rem', color: '#94a3b8', overflowX: 'auto',
            marginBottom: '1.25rem', lineHeight: 1.6,
          }}>
{`PaymentAPI,API,CREATED,john.dev,1,
2024-05-28T10:30:00Z,,v2.0
UserLayout,PageLayout,DELETED,jane.dev,1,
2024-05-28T10:31:00Z,v1.0,
ConfigService,Service,MODIFIED,mike.dev,2,
2024-05-28T10:32:00Z,v1.5,v2.0`}
          </pre>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text)' }}>Supported change types:</strong></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '1px 8px', borderRadius: '999px', fontSize: '0.7rem' }}>CREATED</span>
                <span>New component added (also: ADDED)</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 8px', borderRadius: '999px', fontSize: '0.7rem' }}>MODIFIED</span>
                <span>Component updated (also: UPDATED)</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 8px', borderRadius: '999px', fontSize: '0.7rem' }}>DELETED</span>
                <span>Component removed (also: REMOVED)</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Performance:</strong> Streams and saves records in chunks of 500, tolerating malformed rows instead of failing the whole upload.
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: color || 'var(--text)' }}>{value}</div>
    </div>
  );
}
