import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function TabOverlay({ float }) {
  const profiles = float?.profiles || [];
  const latestCycle = profiles[0]?.cycle || 1;
  const [highlightedCycle, setHighlightedCycle] = useState(latestCycle);

  // Generate color ramp from earliest cycle (slate) to latest cycle (teal/emerald)
  const getCycleColor = (cycle, totalCycles, isHighlighted) => {
    if (isHighlighted) return '#0E7C8B'; // Bold Teal for selected
    const ratio = cycle / Math.max(1, totalCycles);
    // Interpolate from Slate (#516B84) to Soft Teal (#38BDF8)
    return `rgba(81, 107, 132, ${0.25 + ratio * 0.45})`;
  };

  // Compile unified depth levels
  const depthGrid = [5, 20, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
  const overlayData = depthGrid.map((depth) => {
    const row = { pres: depth };
    profiles.forEach((p) => {
      // Find nearest level
      const nearest = p.levels?.reduce((prev, curr) => {
        return Math.abs(curr.pres - depth) < Math.abs(prev.pres - depth) ? curr : prev;
      }, p.levels[0]);
      row[`c_${p.cycle}`] = nearest ? Number(nearest.temp.toFixed(2)) : null;
    });
    return row;
  });

  return (
    <div className="tab-overlay">
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div>
            <span className="section-heading" style={{ margin: 0 }}>Mission Profile Superposition (Overlay)</span>
            <div className="text-secondary" style={{ fontSize: '12px', marginTop: '2px' }}>
              All {profiles.length} historical CTD profiles drawn simultaneously to reveal water-mass shifts over time.
            </div>
          </div>
          <span className="text-mono text-secondary" style={{ fontSize: '11px' }}>
            Highlighted: Cycle #{highlightedCycle}
          </span>
        </div>

        {/* Temporal Color Ramp Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', background: '#FAFAF9', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>MISSION TIMELINE RAMP:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...profiles].reverse().map((p) => (
                <button
                  key={p.cycle}
                  onClick={() => setHighlightedCycle(p.cycle)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    background: p.cycle === highlightedCycle ? '#0E7C8B' : '#FFFFFF',
                    color: p.cycle === highlightedCycle ? '#FFFFFF' : '#516B84',
                    border: '1px solid #CBD5E1',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  C{p.cycle}
                </button>
              ))}
            </div>
          </div>
          <span className="text-secondary" style={{ fontSize: '11px' }}>
            Earlier cycles (Faded) &rarr; Recent cycles (Vibrant)
          </span>
        </div>

        {/* Overlay Chart */}
        <div style={{ width: '100%', height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={overlayData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" />
              <YAxis
                dataKey="pres"
                type="number"
                domain={[0, 520]}
                reversed={true}
                unit=" dbar"
                tick={{ fontSize: 11, fill: '#5A6B78' }}
                label={{ value: 'Pressure / Depth (dbar)', angle: -90, position: 'insideLeft', offset: -2, style: { fontSize: 11, fill: '#5A6B78' } }}
              />
              <XAxis
                type="number"
                domain={['auto', 'auto']}
                unit="°C"
                tick={{ fontSize: 11, fill: '#5A6B78' }}
                label={{ value: 'In-Situ Temperature (°C)', position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: '#5A6B78' } }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="panel" style={{ padding: '8px 12px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600 }}>Depth: {d.pres} dbar</div>
                        <div style={{ color: '#0E7C8B', marginTop: '4px' }}>
                          Highlighted Cycle #{highlightedCycle}: <strong>{d[`c_${highlightedCycle}`]} °C</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {profiles.map((p) => {
                const isSelected = p.cycle === highlightedCycle;
                return (
                  <Line
                    key={p.cycle}
                    dataKey={`c_${p.cycle}`}
                    name={`Cycle ${p.cycle}`}
                    stroke={isSelected ? '#0E7C8B' : getCycleColor(p.cycle, float.cyclesCompleted, false)}
                    strokeWidth={isSelected ? 3 : 1.2}
                    dot={false}
                    activeDot={isSelected ? { r: 5 } : false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
