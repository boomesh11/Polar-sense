import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function TabProfileTrend({ float }) {
  const profiles = float?.profiles || [];
  const latestCycle = profiles[0]?.cycle || 1;
  const [selectedCycle, setSelectedCycle] = useState(latestCycle);

  const currentProfile = profiles.find((p) => p.cycle === selectedCycle) || profiles[0];

  // CTD Profile Data (Depth inverted on Y axis)
  const profileLevels = (currentProfile?.levels || []).map((lvl) => ({
    pres: Number(lvl.pres.toFixed(1)),
    temp: Number(lvl.temp.toFixed(2)),
    psal: Number(lvl.psal.toFixed(2)),
    doxy: lvl.doxy ? Number(lvl.doxy.toFixed(1)) : null,
    qc: lvl.qc
  })).sort((a, b) => a.pres - b.pres);

  // Multi-cycle Trend data across cycles (Surface vs 500m deep values)
  const trendData = [...profiles].reverse().map((p) => {
    const levels = p.levels || [];
    const surfaceLvl = levels[0] || {};
    const deepLvl = levels[levels.length - 1] || {};
    return {
      cycle: `C${p.cycle}`,
      cycleNum: p.cycle,
      surfaceTemp: surfaceLvl.temp ?? null,
      deepTemp: deepLvl.temp ?? null,
      surfacePsal: surfaceLvl.psal ?? null,
      deepPsal: deepLvl.psal ?? null,
      aborted: p.aborted
    };
  });

  return (
    <div className="tab-profile-trend">
      {/* Horizontal Cycle Selector Strip */}
      <div className="panel" style={{ padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="section-heading" style={{ margin: 0 }}>Select Profiling Cycle</span>
          <span className="text-secondary" style={{ fontSize: '12px' }}>
            Showing Cycle <strong>#{selectedCycle}</strong> ({new Date(currentProfile?.timestamp || Date.now()).toLocaleDateString()})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {profiles.map((p) => {
            const isSelected = p.cycle === selectedCycle;
            const isAborted = p.aborted;
            return (
              <button
                key={p.cycle}
                onClick={() => setSelectedCycle(p.cycle)}
                className={`cycle-chip ${isSelected ? 'selected' : ''} ${isAborted ? 'aborted' : ''}`}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isSelected ? 600 : 400,
                  border: isSelected
                    ? '1.5px solid var(--accent-teal)'
                    : isAborted
                    ? '1px solid var(--alert-amber-border)'
                    : '1px solid var(--border-color)',
                  background: isSelected
                    ? (isAborted ? '#FEF3C7' : 'var(--accent-teal-light)')
                    : (isAborted ? '#FFFBEB' : '#FFFFFF'),
                  color: isSelected
                    ? (isAborted ? '#92400E' : 'var(--accent-teal)')
                    : (isAborted ? 'var(--alert-amber)' : 'var(--text-primary)')
                }}
              >
                {isAborted ? `⚠️ C${p.cycle}` : `C${p.cycle}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left CTD Profile (Inverted Y), Right Trend */}
      <div className="grid-12">
        {/* Left: Temperature & Salinity vs Depth */}
        <div className="col-6 panel">
          <div className="panel-header">
            <div>
              <span className="section-heading" style={{ margin: 0 }}>Vertical CTD Profile</span>
              <div className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
                Depth on inverted Y-axis (dbar). Dual series: Temperature (°C) & Salinity (PSU).
              </div>
            </div>
            <span className="text-mono text-secondary" style={{ fontSize: '11px' }}>Cycle #{selectedCycle}</span>
          </div>

          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={profileLevels}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" />
                {/* Inverted Y axis for Depth: Domain [0, 500], reversed */}
                <YAxis
                  dataKey="pres"
                  type="number"
                  domain={[0, 520]}
                  reversed={true}
                  tick={{ fontSize: 11, fill: '#5A6B78' }}
                  unit=" dbar"
                  label={{ value: 'Pressure / Depth (dbar)', angle: -90, position: 'insideLeft', offset: -2, style: { fontSize: 11, fill: '#5A6B78' } }}
                />
                {/* Shared X Axis or Dual Axis */}
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#5A6B78' }}
                  label={{ value: 'Param Values (°C / PSU)', position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: '#5A6B78' } }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="panel" style={{ padding: '8px 12px', fontSize: '12px', lineHeight: 1.5 }}>
                          <div style={{ fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                            Depth: {d.pres} dbar
                          </div>
                          <div style={{ color: 'var(--chart-temp)' }}>Temperature: <strong>{d.temp} °C</strong></div>
                          <div style={{ color: 'var(--chart-sal)' }}>Salinity: <strong>{d.psal} PSU</strong></div>
                          {d.doxy && <div style={{ color: 'var(--chart-oxy)' }}>Dissolved O₂: <strong>{d.doxy} µmol/kg</strong></div>}
                          <div className="text-secondary" style={{ fontSize: '10px', marginTop: '4px' }}>QC Flag: {d.qc}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#0E7C8B"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0E7C8B' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  dataKey="psal"
                  name="Salinity (PSU)"
                  stroke="#516B84"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#516B84' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Trend Chart (Surface vs 500m across cycles) */}
        <div className="col-6 panel">
          <div className="panel-header">
            <div>
              <span className="section-heading" style={{ margin: 0 }}>Mission Multi-Cycle Trend</span>
              <div className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
                Comparing Surface Layer (&lt;10m) vs Deep Water (500m) drift.
              </div>
            </div>
            <span className="text-mono text-secondary" style={{ fontSize: '11px' }}>All Cycles</span>
          </div>

          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" />
                <XAxis dataKey="cycle" tick={{ fontSize: 11, fill: '#5A6B78' }} />
                <YAxis tick={{ fontSize: 11, fill: '#5A6B78' }} unit="°C" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="panel" style={{ padding: '8px 12px', fontSize: '12px', lineHeight: 1.5 }}>
                          <div style={{ fontWeight: 600 }}>{d.cycle}</div>
                          <div style={{ color: '#0E7C8B' }}>Surface Temp: {d.surfaceTemp ?? '—'} °C</div>
                          <div style={{ color: '#0B6370' }}>500m Temp: {d.deepTemp ?? '—'} °C</div>
                          <div style={{ color: '#516B84' }}>Surface Sal: {d.surfacePsal ?? '—'} PSU</div>
                          <div style={{ color: '#1E293B' }}>500m Sal: {d.deepPsal ?? '—'} PSU</div>
                          {d.aborted && <div style={{ color: 'var(--alert-amber)', fontSize: '11px' }}>⚠️ Ice Abort Cycle</div>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  dataKey="surfaceTemp"
                  name="Surface Temp (°C)"
                  stroke="#0E7C8B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  dataKey="deepTemp"
                  name="500m Temp (°C)"
                  stroke="#0B6370"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  dataKey="surfacePsal"
                  name="Surface Salinity (PSU)"
                  stroke="#516B84"
                  strokeWidth={1.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
