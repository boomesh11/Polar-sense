import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Battery, Zap, ShieldAlert, Cpu, Gauge, Droplets, HardDrive } from 'lucide-react';
import Sparkline from '../../components/Sparkline';

export default function TabOverview({ float }) {
  if (!float) return null;

  // Depth vs Time data across all cycles
  // Y-axis inverted: domain [500, 0] so 500m is at the bottom, 0m is at the top
  const cycleData = (float.trajectory || []).map((t, idx) => {
    const prof = (float.profiles || []).find((p) => p.cycle === t.cycle) || {};
    const maxDepth = prof.levels ? Math.max(...prof.levels.map((l) => l.pres)) : (t.estimated ? 380 : 500);
    return {
      cycle: `Cycle ${t.cycle}`,
      cycleNum: t.cycle,
      date: new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      maxDepth: maxDepth,
      aborted: prof.aborted || false
    };
  });

  // Battery history simulation
  const batteryData = [
    float.battery + 12,
    float.battery + 9,
    float.battery + 6,
    float.battery + 3,
    float.battery + 1,
    float.battery
  ];

  const latestProfile = float.profiles?.[0];
  const surfaceTemp = latestProfile?.levels?.[0]?.temp ?? '—';
  const bottomTemp = latestProfile?.levels?.[latestProfile.levels.length - 1]?.temp ?? '—';
  const surfacePsal = latestProfile?.levels?.[0]?.psal ?? '—';
  const bottomPsal = latestProfile?.levels?.[latestProfile.levels.length - 1]?.psal ?? '—';

  return (
    <div className="tab-overview">
      {/* Top 3 Metric Cards */}
      <div className="grid-12" style={{ marginBottom: '20px' }}>
        <div className="col-4 panel">
          <div className="panel-header">
            <span className="section-heading" style={{ margin: 0 }}>Last Profile Summary</span>
            <span className="text-mono text-secondary">Cycle {latestProfile?.cycle || float.cyclesCompleted}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div className="text-secondary" style={{ fontSize: '11px' }}>SURFACE T / S</div>
              <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-teal)' }}>
                {surfaceTemp}°C <span style={{ color: 'var(--chart-sal)', fontSize: '13px' }}>/ {surfacePsal} PSU</span>
              </div>
            </div>
            <div>
              <div className="text-secondary" style={{ fontSize: '11px' }}>500m T / S</div>
              <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-teal)' }}>
                {bottomTemp}°C <span style={{ color: 'var(--chart-sal)', fontSize: '13px' }}>/ {bottomPsal} PSU</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Levels collected: <strong>{latestProfile?.levels?.length || 0}</strong> · Mode: <strong>{latestProfile?.dataMode === 'D' ? 'Delayed-mode (QC)' : 'Real-time (R)'}</strong>
          </div>
        </div>

        <div className="col-4 panel">
          <div className="panel-header">
            <span className="section-heading" style={{ margin: 0 }}>Battery & Power Trend</span>
            <span className="tabular-nums text-mono">{float.battery}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-val-large">{float.health?.packVoltage?.toFixed(1) || '10.8'}<span className="stat-unit">V</span></div>
              <div className="text-secondary" style={{ fontSize: '11px' }}>Pack Lithium Thionyl Chloride</div>
            </div>
            <div>
              <Sparkline data={batteryData} width={100} height={32} color="var(--accent-teal)" type="trend" />
              <div className="text-muted text-mono" style={{ fontSize: '10px', textAlign: 'right', marginTop: '2px' }}>6-cycle discharge</div>
            </div>
          </div>
        </div>

        <div className="col-4 panel" style={{ borderLeft: float.iceAborts > 0 ? '3px solid var(--alert-amber)' : '1px solid var(--border-color)' }}>
          <div className="panel-header">
            <span className="section-heading" style={{ margin: 0, color: float.iceAborts > 0 ? 'var(--alert-amber)' : 'var(--accent-teal)' }}>
              Ice-Abort Telemetry
            </span>
            <ShieldAlert size={16} color={float.iceAborts > 0 ? 'var(--alert-amber)' : 'var(--text-secondary)'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="stat-val-large" style={{ color: float.iceAborts > 0 ? 'var(--alert-amber)' : 'var(--text-primary)' }}>
              {float.iceAborts}
            </span>
            <span className="text-secondary">aborts detected ({((float.iceAborts / (float.cyclesCompleted || 1)) * 100).toFixed(0)}% abort rate)</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {float.iceAborts > 0
              ? 'Thermistor ice-sensing suspended ascent at 45m. Profiles cached in on-board flash.'
              : 'Zero ice encounters. All ascents surfaced nominally for GPS/Iridium link.'}
          </p>
        </div>
      </div>

      {/* Mission State Timeline Band */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <span className="section-heading" style={{ margin: 0 }}>Mission State Cycle Timeline</span>
          <span className="text-secondary" style={{ fontSize: '12px' }}>
            Current state: <strong style={{ color: float.missionState === 'ICE_CHECK' ? 'var(--alert-amber)' : 'var(--accent-teal)' }}>{float.missionState}</strong>
          </span>
        </div>
        
        {/* Horizontal colored timeline strip */}
        <div style={{ display: 'flex', height: '24px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', margin: '10px 0' }}>
          {(float.trajectory || []).map((t, idx) => {
            const isAborted = (float.profiles || []).find((p) => p.cycle === t.cycle)?.aborted || t.estimated;
            const bg = isAborted ? 'var(--alert-amber)' : 'var(--accent-teal)';
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  backgroundColor: bg,
                  opacity: 0.85,
                  borderRight: '1px solid #FFFFFF',
                  title: `Cycle ${t.cycle}: ${isAborted ? 'Ice Abort / Dead Reckoned' : 'Nominal Surface'}`
                }}
                title={`Cycle ${t.cycle}: ${isAborted ? 'Ice-Abort' : 'Surface GPS'}`}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>Deployment (Cycle 1)</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--accent-teal)', display: 'inline-block' }}></span> Surface GPS
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--alert-amber)', display: 'inline-block' }}></span> Under-Ice Abort
            </span>
          </span>
          <span>Latest (Cycle {float.cyclesCompleted})</span>
        </div>
      </div>

      {/* Depth vs Time Chart (Inverted Y-axis) */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div>
            <span className="section-heading" style={{ margin: 0 }}>Depth vs Mission Time</span>
            <p className="text-secondary" style={{ fontSize: '12px', marginTop: '2px' }}>
              Maximum cycle penetration (dbar). Y-axis inverted (0 m at top, 500 m deep ocean at bottom).
            </p>
          </div>
          <span className="text-mono text-secondary" style={{ fontSize: '11px' }}>Range: 0–500 dbar</span>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cycleData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="depthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0E7C8B" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0E7C8B" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" vertical={false} />
              <XAxis dataKey="cycle" tick={{ fontSize: 11, fill: '#5A6B78' }} />
              {/* Inverted Y axis: reversed=true puts 0 at the top and 500 at the bottom */}
              <YAxis
                domain={[0, 520]}
                reversed={true}
                tick={{ fontSize: 11, fill: '#5A6B78' }}
                unit=" dbar"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="panel" style={{ padding: '8px 12px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.cycle} ({data.date})</div>
                        <div style={{ color: 'var(--accent-teal)' }}>Max Depth: {data.maxDepth} dbar</div>
                        {data.aborted && <div style={{ color: 'var(--alert-amber)' }}>⚠️ Under-ice abort</div>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="maxDepth"
                stroke="#0E7C8B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#depthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health Strip */}
      <div className="panel">
        <span className="section-heading">Instrument Health Diagnostics</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '12px' }}>
          <div style={{ padding: '10px', background: '#FAFAF9', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px' }}>
              <Droplets size={14} color={float.health?.humidity > 60 ? 'var(--alert-amber)' : 'var(--text-secondary)'} />
              INTERNAL HUMIDITY
            </div>
            <div className="stat-val-large" style={{ fontSize: '20px', marginTop: '4px', color: float.health?.humidity > 60 ? 'var(--alert-amber)' : 'var(--text-primary)' }}>
              {float.health?.humidity || 30}%
            </div>
            <div className="text-secondary" style={{ fontSize: '11px' }}>Nominal &lt; 50% RH</div>
          </div>

          <div style={{ padding: '10px', background: '#FAFAF9', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px' }}>
              <Zap size={14} color="var(--accent-teal)" />
              PACK VOLTAGE
            </div>
            <div className="stat-val-large" style={{ fontSize: '20px', marginTop: '4px' }}>
              {float.health?.packVoltage?.toFixed(1) || '10.8'} V
            </div>
            <div className="text-secondary" style={{ fontSize: '11px' }}>Cutoff limit: 7.2 V</div>
          </div>

          <div style={{ padding: '10px', background: '#FAFAF9', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px' }}>
              <Gauge size={14} color="var(--text-secondary)" />
              HYDRAULIC PUMP CYCLES
            </div>
            <div className="stat-val-large" style={{ fontSize: '20px', marginTop: '4px' }}>
              {float.health?.pumpCycles || 142}
            </div>
            <div className="text-secondary" style={{ fontSize: '11px' }}>MTBF limit: 2,500</div>
          </div>

          <div style={{ padding: '10px', background: '#FAFAF9', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '11px' }}>
              <HardDrive size={14} color="var(--text-secondary)" />
              FLASH BUFFER USED
            </div>
            <div className="stat-val-large" style={{ fontSize: '20px', marginTop: '4px' }}>
              {float.health?.flashUsedPct || 22}%
            </div>
            <div className="text-secondary" style={{ fontSize: '11px' }}>Capacity: 128 MB NOR</div>
          </div>
        </div>
      </div>
    </div>
  );
}
