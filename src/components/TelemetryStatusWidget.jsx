import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

function ageSeconds(dateOrIso) {
  if (!dateOrIso) return Infinity;
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
}

function formatAge(secs) {
  if (secs < 60)   return `${secs} sec`;
  if (secs < 3600) return `${Math.floor(secs / 60)} min ${secs % 60} sec`;
  return `${Math.floor(secs / 3600)} hr ${Math.floor((secs % 3600) / 60)} min`;
}

export default function TelemetryStatusWidget() {
  const { latestUplink, lastNetworkUpdate } = useFleet();
  const [tick, setTick] = useState(0);

  // Re-render every second to keep age counter live
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const packetAge = latestUplink ? ageSeconds(latestUplink.timestamp) : Infinity;
  const syncAge   = ageSeconds(lastNetworkUpdate);

  // Determine status tier
  let tier = 'live';    // ≤ 60 s
  if (packetAge > 900) tier = 'red';    // > 15 min
  else if (packetAge > 300) tier = 'amber'; // > 5 min

  const colors = {
    live:  { dot: '#10B981', label: 'LIVE', bg: '#ECFDF5', border: '#6EE7B7', text: '#065F46' },
    amber: { dot: '#D97706', label: 'DEGRADED', bg: '#FFFBEB', border: '#FCD34D', text: '#92400E' },
    red:   { dot: '#DC2626', label: 'STALE', bg: '#FEF2F2', border: '#FCA5A5', text: '#7F1D1D' },
  };
  const c = colors[tier];

  const packetTime = latestUplink
    ? new Date(latestUplink.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  const syncTime = lastNetworkUpdate
    ? lastNetworkUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: c.text,
        minWidth: 280,
        flexShrink: 0,
      }}
    >
      {/* Status dot — pulses when live */}
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, flexShrink: 0 }}>
        {tier === 'live' && (
          <span
            style={{
              position: 'absolute',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: c.dot,
              opacity: 0.35,
              animation: 'telemetry-ping 1.5s ease-out infinite',
            }}
          />
        )}
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'block', position: 'relative' }} />
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontWeight: 700, letterSpacing: '0.06em', fontSize: 10 }}>
          {c.label} TELEMETRY
        </span>
        {latestUplink ? (
          <>
            <span>Last packet: <strong>{packetTime}</strong></span>
            <span>Age: <strong>{formatAge(packetAge)}</strong> · Source: <strong>{latestUplink.floatId}</strong></span>
          </>
        ) : (
          <span>No uplink data received</span>
        )}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, opacity: 0.75 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.04em' }}>NETWORK SYNC</span>
        <span><strong>{syncTime}</strong></span>
        <span>+{formatAge(syncAge)}</span>
      </div>

      <style>{`
        @keyframes telemetry-ping {
          0%   { transform: scale(1);   opacity: 0.35; }
          80%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
