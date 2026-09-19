import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Radio } from 'lucide-react';

const STATE_COLORS = {
  SURFACE:   { bg: '#EBF7F9', text: '#0E7C8B', border: '#B5E4EA' },
  DESCENT:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  DRIFTING:  { bg: '#F5F3FF', text: '#6B21A8', border: '#DDD6FE' },
  ASCENDING: { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
  ICE_CHECK: { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
  RECOVERED: { bg: '#ECFDF5', text: '#1E7A4D', border: '#84E1BC' },
  SILENT:    { bg: '#F1F5F9', text: '#5A6B78', border: '#CBD5E1' },
};

const STATE_LABELS = {
  SURFACE: 'Surface', DESCENT: 'Diving', DRIFTING: 'Profiling',
  ASCENDING: 'Ascending', ICE_CHECK: 'Under Ice', RECOVERED: 'Recovered', SILENT: 'Silent',
};

function BatteryBar({ pct }) {
  const color = pct > 50 ? '#10B981' : pct > 20 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#E4E7EA', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color, minWidth: 32, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

function RowKV({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid #F0F2F4' }}>
      <span style={{ fontSize: 11, color: '#5A6B78', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: mono ? 'var(--font-mono)' : undefined, color: '#1A2733', fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  );
}

export default function FloatSidePanel({ float: f, onClose }) {
  if (!f) return null;

  const latestProfile = f.profiles?.[0];
  const surfLevel     = latestProfile?.levels?.[0];
  const stateKey      = f.missionState || 'SURFACE';
  const sc            = STATE_COLORS[stateKey] || STATE_COLORS.SURFACE;

  const lastContactDate = f.lastContact ? new Date(f.lastContact) : null;
  const ageSec = lastContactDate ? Math.floor((Date.now() - lastContactDate.getTime()) / 1000) : null;
  const staleWarning = ageSec !== null && ageSec > 1800;

  const signalLabel = {
    gps:           'GPS (Good)',
    dead_reckoned: 'Dead-Reckoned (Degraded)',
    acoustic:      'Acoustic (Estimated)',
  }[f.position?.fixQuality] || f.position?.fixQuality || '—';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 310,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAFAF9',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0E7C8B', fontFamily: 'var(--font-mono)' }}>{f.id}</div>
          <div style={{ fontSize: 11, color: '#5A6B78', marginTop: 1 }}>WMO {f.wmo}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
              padding: '2px 8px', borderRadius: 3,
            }}
          >
            {STATE_LABELS[stateKey]}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6B78', padding: 4, display: 'flex' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px', flex: 1 }}>

        {staleWarning && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 3, padding: '6px 10px', marginBottom: 10, fontSize: 11, color: '#92400E', display: 'flex', gap: 6 }}>
            <span>⚠</span>
            <span>Last contact {Math.floor(ageSec / 60)} min ago — data may be stale</span>
          </div>
        )}

        {/* Position */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0E7C8B', marginBottom: 6 }}>Position</div>
          <RowKV label="Latitude"  value={`${(f.position?.lat ?? 0).toFixed(4)}°`} mono />
          <RowKV label="Longitude" value={`${(f.position?.lon ?? 0).toFixed(4)}°`} mono />
          <RowKV label="Fix Quality" value={signalLabel} />
          <RowKV label="Uncertainty" value={f.position?.uncertaintyKm != null ? `± ${f.position.uncertaintyKm} km` : '—'} mono />
          <RowKV label="Region" value={f.region} />
        </div>

        {/* Telemetry */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0E7C8B', marginBottom: 6 }}>Telemetry</div>
          <RowKV label="Last Contact" value={lastContactDate ? lastContactDate.toLocaleString() : '—'} />
          <RowKV label="Cycles"       value={f.cyclesCompleted} mono />
          <RowKV label="Current Depth" value={`${(f.currentDepth ?? 0).toFixed(0)} m`} mono />
          <RowKV label="Normal Park"   value="450 m (500m max)" mono />
          <RowKV label="Buoyancy Stroke" value="650 ml (±100g)" mono />
          <RowKV label="Ice Aborts"    value={f.iceAborts ?? 0} mono />
        </div>

        {/* Battery */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0E7C8B', marginBottom: 6 }}>Power Architecture</div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: '#5A6B78', marginBottom: 3 }}>24-Cell 3S8P Pack</div>
            <BatteryBar pct={f.battery ?? 0} />
          </div>
          <RowKV label="Pack Voltage"   value={f.health?.packVoltage != null ? `${f.health.packVoltage} V` : '10.8 V'} mono />
          <RowKV label="Nameplate"      value="1123 Wh (104 Ah)" mono />
          <RowKV label="Cycle Budget"   value="5.30 Wh (Open)" mono />
          <RowKV label="Internal Temp"  value={f.health?.internalTemp != null ? `${f.health.internalTemp} °C` : '—'} mono />
          <RowKV label="Humidity"       value={f.health?.humidity != null ? `${f.health.humidity}%` : '—'} mono />
          {f.health?.warning && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 3, padding: '5px 8px', fontSize: 11, color: '#92400E', marginTop: 4 }}>
              ⚠ {f.health.warning}
            </div>
          )}
        </div>

        {/* Surface Oceanography */}
        {surfLevel && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0E7C8B', marginBottom: 6 }}>
              Surface Oceanography
              {latestProfile?.timestamp && (
                <span style={{ fontWeight: 400, color: '#5A6B78', marginLeft: 6, textTransform: 'none' }}>
                  (cycle {latestProfile.cycle})
                </span>
              )}
            </div>
            <RowKV label="Temperature" value={`${surfLevel.temp?.toFixed(2)} °C`} mono />
            <RowKV label="Salinity"    value={`${surfLevel.psal?.toFixed(3)} PSU`} mono />
            <RowKV label="Dissolved O₂" value={surfLevel.doxy != null ? `${surfLevel.doxy?.toFixed(1)} µmol/kg` : '—'} mono />
            <RowKV label="Pressure"    value={`${surfLevel.pres?.toFixed(1)} dbar`} mono />
            <RowKV label="Data Mode"   value={latestProfile?.dataMode === 'D' ? 'Delayed-mode (D)' : 'Real-time (R)'} />
            <RowKV label="Profile QC"  value={latestProfile?.aborted ? 'Ice-aborted' : 'Complete'} />
          </div>
        )}

        {/* Recent Track Summary */}
        {f.trajectory && f.trajectory.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0E7C8B', marginBottom: 6 }}>Recent Track</div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E4E7EA', borderRadius: 3, padding: 8 }}>
              {f.trajectory.slice(-5).reverse().map((pt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: i < 4 ? '1px solid #F0F2F4' : 'none', fontSize: 11 }}>
                  <span style={{ color: '#5A6B78' }}>Cycle {pt.cycle}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1A2733' }}>
                    {pt.lat?.toFixed(3)}°, {pt.lon?.toFixed(3)}°
                    {pt.estimated && <span style={{ color: '#D97706', marginLeft: 4 }}>est.</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-color)', background: '#FAFAF9' }}>
        <Link
          to={`/float/${f.id}`}
          style={{ color: '#0E7C8B', textDecoration: 'none', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          View full instrument details &rarr;
        </Link>
      </div>
    </div>
  );
}
