import React, { useEffect, useState } from 'react';
import { getDeployments, getMetadataChanges, getReleases, getHighRiskDeployments, getStats } from '../api/endpoints';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const COLORS = {
  HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e',
  PRODUCTION: '#ef4444', STAGING: '#f59e0b', TEST: '#3b82f6', DEV: '#22c55e',
};

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color || 'var(--text)' }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [deployments, setDeployments] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [releases, setReleases] = useState([]);
  const [highRisk, setHighRisk] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [d, m, r, hr, stats] = await Promise.all([
          getDeployments(0, 100),
          getMetadataChanges(0, 100),
          getReleases(),
          getHighRiskDeployments(),
          getStats(),
        ]);
        setDeployments(d.data?.content || d.data || []);
        setMetadata(m.data?.content || m.data || []);
        setReleases(r.data?.content || r.data || []);
        setHighRisk(hr.data || []);
        setActivity(stats.data?.recentActivity || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  // Compute risk distribution
  const riskCounts = deployments.reduce((acc, d) => {
    acc[d.riskLevel] = (acc[d.riskLevel] || 0) + 1;
    return acc;
  }, {});
  const riskData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));

  // Compute env distribution
  const envCounts = deployments.reduce((acc, d) => {
    acc[d.environment] = (acc[d.environment] || 0) + 1;
    return acc;
  }, {});
  const envData = Object.entries(envCounts).map(([name, value]) => ({ name, value }));

  // Change type distribution
  const changeCounts = metadata.reduce((acc, m) => {
    acc[m.changeType] = (acc[m.changeType] || 0) + 1;
    return acc;
  }, {});
  const changeData = Object.entries(changeCounts).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Dashboard Overview</h2>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Deployments" value={deployments.length} sub="All environments" />
        <StatCard label="Metadata Changes" value={metadata.length} sub="Tracked modifications" />
        <StatCard label="Releases" value={releases.length} sub="Planned & deployed" />
        <StatCard label="High Risk" value={highRisk.length} sub="Production deployments" color="#ef4444" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Risk Pie */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Risk Distribution
          </h3>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.875rem' }}>
              No deployments yet
            </div>
          )}
        </div>

        {/* Env Bar */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Environment Distribution
          </h3>
          {envData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={envData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.875rem' }}>
              No data yet
            </div>
          )}
        </div>

        {/* Change Types */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Metadata Change Types
          </h3>
          {changeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={changeData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.875rem' }}>
              No metadata yet
            </div>
          )}
        </div>
      </div>

      {/* Recent High-Risk deployments */}
      {highRisk.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px', padding: '1.25rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: '#ef4444' }}>
            High-Risk Deployments — Requires Attention
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['ID', 'Name', 'Environment', 'Status', 'Deployed By', 'Notes'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '0.5rem 0.75rem',
                      color: 'var(--text-muted)', fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {highRisk.slice(0, 5).map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>#{d.id}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{d.name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span style={{
                        background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                        padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem',
                      }}>{d.environment}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span style={{
                        background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                        padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem',
                      }}>{d.status || 'N/A'}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{d.deployedBy}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity Timeline */}
      <div style={{
        marginTop: '1.5rem',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '1.25rem',
      }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-muted)' }}>
          Recent Activity
        </h3>
        {activity.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.875rem' }}>
            No activity recorded yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {activity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                padding: '0.5rem 0', borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '0.85rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                    background: a.type === 'DEPLOYMENT' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
                    color: a.type === 'DEPLOYMENT' ? '#60a5fa' : '#c084fc',
                    whiteSpace: 'nowrap',
                  }}>{a.type === 'DEPLOYMENT' ? 'DEPLOY' : 'CHANGE'}</span>
                  <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.description}
                  </span>
                  {a.riskLevel && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '999px',
                      background: COLORS[a.riskLevel] ? `${COLORS[a.riskLevel]}26` : 'rgba(148,163,184,0.15)',
                      color: COLORS[a.riskLevel] || '#94a3b8',
                    }}>{a.riskLevel}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                  <span>{a.actor}</span>
                  <span>{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
