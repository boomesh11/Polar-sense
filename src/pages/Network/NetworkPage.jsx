import React from 'react';
import { useFleet } from '../../context/FleetContext';
import Sparkline from '../../components/Sparkline';
import StatusPill from '../../components/StatusPill';
import { AlertTriangle, Radio, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NetworkPage() {
  const {
    fleet,
    alerts,
    uplinks,
    totalFloats,
    activeCount,
    underIceCount,
    silentCount
  } = useFleet();

  return (
    <div className="main-content">
      {/* Page Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title">Network & Constellation Operations</h1>
        <p className="text-secondary" style={{ fontSize: '13px', marginTop: '2px' }}>
          OceanOPS-grade telemetry health tracking, satellite passes, battery exhaustion projections, and anomaly alerts.
        </p>
      </div>

      {/* Top Row: Four Counters */}
      <div className="grid-12" style={{ marginBottom: '20px' }}>
        <div className="col-3 panel">
          <div className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Total Deployed
          </div>
          <div className="stat-val-large" style={{ marginTop: '4px' }}>
            {totalFloats}
          </div>
          <div className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>Global autonomous array</div>
        </div>

        <div className="col-3 panel" style={{ borderLeft: '3px solid var(--accent-teal)' }}>
          <div className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Active & Transmitting
          </div>
          <div className="stat-val-large" style={{ marginTop: '4px', color: 'var(--accent-teal)' }}>
            {activeCount}
          </div>
          <div className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>Nominal GPS/Iridium link</div>
        </div>

        <div className="col-3 panel" style={{ borderLeft: '3px solid var(--alert-amber)' }}>
          <div className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Under Sea Ice
          </div>
          <div className="stat-val-large" style={{ marginTop: '4px', color: 'var(--alert-amber)' }}>
            {underIceCount}
          </div>
          <div className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>Acoustic dead reckoning</div>
        </div>

        <div className="col-3 panel" style={{ borderLeft: '3px solid var(--error-red)' }}>
          <div className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Silent &gt; 30 Days
          </div>
          <div className="stat-val-large" style={{ marginTop: '4px', color: 'var(--error-red)' }}>
            {silentCount}
          </div>
          <div className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>Missed transmission schedule</div>
        </div>
      </div>

      {/* Uplink Timeline Panel */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="var(--accent-teal)" />
            <span className="section-heading" style={{ margin: 0 }}>Iridium SBD Uplink Event Timeline (Last 30 Days)</span>
          </div>
          <span className="text-mono text-secondary" style={{ fontSize: '11px' }}>
            {uplinks.length} Telemetry Bursts Received
          </span>
        </div>

        {/* Timeline visualization: ticks per uplink */}
        <div style={{ background: '#FAFAF9', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', position: 'relative' }}>
            {uplinks.map((up) => {
              const isAbort = up.status === 'ABORT_ICE';
              return (
                <div
                  key={up.id}
                  style={{
                    flex: 1,
                    height: isAbort ? '24px' : '36px',
                    background: isAbort ? 'var(--alert-amber)' : 'var(--accent-teal)',
                    borderRadius: '2px',
                    opacity: 0.85,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title={`Uplink: ${up.floatId} (Cycle ${up.cycle}) - ${new Date(up.timestamp).toLocaleTimeString()}`}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span>T-30 Days</span>
            <span style={{ display: 'flex', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent-teal)', display: 'inline-block' }}></span> 680B CTD Burst
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--alert-amber)', display: 'inline-block' }}></span> Ice Abort Heartbeat
              </span>
            </span>
            <span>Real-Time (Now)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Health Table (Col 8) + Open Alerts Panel (Col 4) */}
      <div className="grid-12">
        {/* Fleet Health Table */}
        <div className="col-8 panel">
          <div className="panel-header">
            <span className="section-heading" style={{ margin: 0 }}>Fleet Telemetry Health Matrix</span>
            <span className="text-secondary" style={{ fontSize: '11px' }}>Rows with warnings flagged</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Float ID</th>
                  <th>Last Contact</th>
                  <th>Battery</th>
                  <th>Flash Used</th>
                  <th>Missed Cycles</th>
                  <th>Pump Cycles</th>
                  <th>Discharge Trend</th>
                </tr>
              </thead>
              <tbody>
                {fleet.map((f) => {
                  const hasError = f.status === 'silent';
                  const hasWarning = f.status === 'under_ice' || f.health?.humidity > 60 || f.health?.warning;
                  const borderStyle = hasError
                    ? '3px solid var(--error-red)'
                    : hasWarning
                    ? '3px solid var(--alert-amber)'
                    : '1px solid var(--border-light)';

                  const batteryHist = [f.battery + 8, f.battery + 5, f.battery + 3, f.battery + 1, f.battery];

                  return (
                    <tr key={f.id} style={{ borderLeft: borderStyle }}>
                      <td className="text-mono">
                        <Link to={`/float/${f.id}`} style={{ color: 'var(--accent-teal)', fontWeight: 600, textDecoration: 'none' }}>
                          {f.id}
                        </Link>
                      </td>
                      <td className="text-mono">
                        {new Date(f.lastContact).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="text-mono" style={{ color: f.battery < 40 ? 'var(--alert-amber)' : 'inherit' }}>
                        {f.battery}% ({f.health?.packVoltage?.toFixed(1)}V)
                      </td>
                      <td className="text-mono">{f.health?.flashUsedPct || 20}%</td>
                      <td className="text-mono">
                        {f.status === 'silent' ? (
                          <strong style={{ color: 'var(--error-red)' }}>4 (Overdue)</strong>
                        ) : f.iceAborts > 0 ? (
                          <span style={{ color: 'var(--alert-amber)' }}>{f.iceAborts} (Ice Abort)</span>
                        ) : (
                          '0 (Nominal)'
                        )}
                      </td>
                      <td className="text-mono">{f.health?.pumpCycles || 142}</td>
                      <td>
                        <Sparkline data={batteryHist} width={70} height={18} color="var(--accent-teal)" type="trend" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open Alerts Panel */}
        <div className="col-4 panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} color="var(--alert-amber)" />
              <span className="section-heading" style={{ margin: 0 }}>Active Operator Alerts</span>
            </div>
            <span className="text-mono text-secondary" style={{ fontSize: '11px' }}>{alerts.length} OPEN</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((alt) => (
              <div
                key={alt.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '4px',
                  background: alt.severity === 'error' ? 'var(--error-red-light)' : 'var(--alert-amber-light)',
                  border: `1px solid ${alt.severity === 'error' ? 'var(--error-red-border)' : 'var(--alert-amber-border)'}`,
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ color: alt.severity === 'error' ? 'var(--error-red)' : '#92400E', fontFamily: 'var(--font-mono)' }}>
                    {alt.floatId}
                  </strong>
                  <span className="text-secondary" style={{ fontSize: '10px' }}>
                    {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ color: alt.severity === 'error' ? '#991B1B' : '#78350F', lineHeight: 1.4 }}>
                  {alt.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
