import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { calculateSigmaTheta } from '../../data/oceanography';
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
import { Layers, CheckSquare, Square, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function ProfilesPage() {
  const { fleet } = useFleet();

  const [regionFilter, setRegionFilter] = useState('All');
  const [dataModeFilter, setDataModeFilter] = useState('all');
  const [paramFilter, setParamFilter] = useState('temp'); // 'temp', 'psal', 'doxy'
  const [axisMode, setAxisMode] = useState('depth'); // 'depth' vs 'density'
  const [selectedProfiles, setSelectedProfiles] = useState(['PS-001_14', 'PS-002_19', 'PS-004_9']);

  // Flatten all profiles across all floats
  const allProfilesList = useMemo(() => {
    const list = [];
    fleet.forEach((f) => {
      if (regionFilter !== 'All' && f.region !== regionFilter) return;
      (f.profiles || []).forEach((p) => {
        if (dataModeFilter !== 'all' && p.dataMode !== dataModeFilter) return;
        const key = `${f.id}_${p.cycle}`;
        list.push({
          key,
          floatId: f.id,
          wmo: f.wmo,
          region: f.region,
          cycle: p.cycle,
          timestamp: p.timestamp,
          dataMode: p.dataMode,
          aborted: p.aborted,
          levels: p.levels || []
        });
      });
    });
    return list;
  }, [fleet, regionFilter, dataModeFilter]);

  const toggleSelectProfile = (key) => {
    setSelectedProfiles((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedProfiles(allProfilesList.map((p) => p.key));
  };

  const clearAll = () => {
    setSelectedProfiles([]);
  };

  // Compile comparison overlay data
  const comparisonData = useMemo(() => {
    if (!selectedProfiles.length) return [];

    const activeList = allProfilesList.filter((p) => selectedProfiles.includes(p.key));

    if (axisMode === 'depth') {
      const depthLevels = [5, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500];
      return depthLevels.map((d) => {
        const row = { yVal: d, depth: d };
        activeList.forEach((prof) => {
          const match = prof.levels.reduce((prev, curr) => {
            return Math.abs(curr.pres - d) < Math.abs(prev.pres - d) ? curr : prev;
          }, prof.levels[0]);

          if (match) {
            row[prof.key] = match[paramFilter] ?? null;
          }
        });
        return row;
      });
    } else {
      // Plot against potential density anomaly sigma_theta (isopycnal coordinate)
      const densityLevels = [25.0, 25.5, 26.0, 26.5, 27.0, 27.2, 27.4, 27.6, 27.8, 28.0];
      return densityLevels.map((sigma) => {
        const row = { yVal: sigma, density: sigma };
        activeList.forEach((prof) => {
          const match = prof.levels.reduce((prev, curr) => {
            const sCurr = calculateSigmaTheta(curr.psal, curr.temp);
            const sPrev = calculateSigmaTheta(prev.psal, prev.temp);
            return Math.abs(sCurr - sigma) < Math.abs(sPrev - sigma) ? curr : prev;
          }, prof.levels[0]);

          if (match) {
            row[prof.key] = match[paramFilter] ?? null;
          }
        });
        return row;
      });
    }
  }, [selectedProfiles, allProfilesList, paramFilter, axisMode]);

  const colors = ['#0E7C8B', '#D97706', '#516B84', '#1E7A4D', '#9B51E0', '#B3261E', '#4B5563'];

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Profile Explorer</h1>
          <p className="text-secondary" style={{ fontSize: '13px', marginTop: '2px' }}>
            Multi-instrument vertical profile comparison across polar oceanographic regimes.
          </p>
        </div>

        {/* Global Controls & Axis Mode Toggle */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => setAxisMode('depth')}
              style={{
                border: 'none',
                borderRadius: 0,
                background: axisMode === 'depth' ? 'var(--accent-teal)' : '#FFFFFF',
                color: axisMode === 'depth' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '12px',
                padding: '6px 12px'
              }}
            >
              Plot vs Depth
            </button>
            <button
              onClick={() => setAxisMode('density')}
              style={{
                border: 'none',
                borderRadius: 0,
                background: axisMode === 'density' ? 'var(--accent-teal)' : '#FFFFFF',
                color: axisMode === 'density' ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '12px',
                padding: '6px 12px'
              }}
            >
              Plot vs Density (σ<sub>θ</sub>)
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Overlay Panel (Enabled when >=1 selected) */}
      {selectedProfiles.length > 0 && (
        <div className="panel" style={{ marginBottom: '24px' }}>
          <div className="panel-header">
            <div>
              <span className="section-heading" style={{ margin: 0 }}>
                Superimposed Comparison ({selectedProfiles.length} Selected Profiles)
              </span>
              <div className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
                Comparing {paramFilter.toUpperCase()} across {axisMode === 'depth' ? 'depth (dbar, inverted)' : 'potential density isopycnals σθ (kg/m³, inverted)'}.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={paramFilter}
                onChange={(e) => setParamFilter(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                <option value="temp">Parameter: Temperature (°C)</option>
                <option value="psal">Parameter: Salinity (PSU)</option>
                <option value="doxy">Parameter: Dissolved Oxygen (µmol/kg)</option>
              </select>
              <button className="btn" onClick={clearAll} style={{ fontSize: '11px' }}>
                Clear Selection
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={comparisonData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EA" />
                <YAxis
                  dataKey="yVal"
                  type="number"
                  domain={axisMode === 'depth' ? [0, 520] : [24.5, 28.5]}
                  reversed={true}
                  unit={axisMode === 'depth' ? ' dbar' : ' kg/m³'}
                  tick={{ fontSize: 11, fill: '#5A6B78' }}
                  label={{
                    value: axisMode === 'depth' ? 'Pressure (dbar)' : 'Potential Density σθ (kg/m³)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -2,
                    style: { fontSize: 11, fill: '#5A6B78' }
                  }}
                />
                <XAxis
                  type="number"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#5A6B78' }}
                  label={{ value: `${paramFilter.toUpperCase()} Measurement`, position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: '#5A6B78' } }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="panel" style={{ padding: '8px 12px', fontSize: '12px' }}>
                          <div style={{ fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                            {axisMode === 'depth' ? `Depth: ${d.yVal} dbar` : `Density σθ: ${d.yVal} kg/m³`}
                          </div>
                          {payload.map((entry, idx) => (
                            <div key={idx} style={{ color: entry.color, marginTop: '3px' }}>
                              {entry.name}: <strong>{entry.value !== null ? entry.value : '—'}</strong>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                {selectedProfiles.map((key, i) => (
                  <Line
                    key={key}
                    dataKey={key}
                    name={key.replace('_', ' Cycle ')}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Strip & Multi-Select Action Bar */}
      <div className="panel" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <label className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Region</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{ fontSize: '12px', marginTop: '2px' }}
            >
              <option value="All">All Regions</option>
              <option value="Arctic">Arctic Ocean</option>
              <option value="Southern Ocean">Southern Ocean</option>
              <option value="Coastal trials">Coastal Trials</option>
            </select>
          </div>

          <div>
            <label className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Data Mode</label>
            <select
              value={dataModeFilter}
              onChange={(e) => setDataModeFilter(e.target.value)}
              style={{ fontSize: '12px', marginTop: '2px' }}
            >
              <option value="all">All Modes</option>
              <option value="R">Real-time (R)</option>
              <option value="D">Delayed-mode QC (D)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={selectAll} style={{ fontSize: '12px' }}>
            Select All ({allProfilesList.length})
          </button>
          <button className="btn" onClick={clearAll} style={{ fontSize: '12px' }}>
            Deselect All
          </button>
        </div>
      </div>

      {/* Grid of Profile Thumbnails */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {allProfilesList.map((prof) => {
          const isSelected = selectedProfiles.includes(prof.key);
          const tVals = prof.levels.map((l) => l.temp);
          const minT = Math.min(...tVals, -2);
          const maxT = Math.max(...tVals, 10);
          const rangeT = maxT - minT || 1;

          // Thumbnail SVG path
          const polylinePoints = prof.levels.map((lvl) => {
            const x = ((lvl.temp - minT) / rangeT) * 190 + 10;
            const y = (lvl.pres / 500) * 80 + 10;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');

          return (
            <div
              key={prof.key}
              onClick={() => toggleSelectProfile(prof.key)}
              className="panel"
              style={{
                cursor: 'pointer',
                border: isSelected ? '1.5px solid var(--accent-teal)' : '1px solid var(--border-color)',
                background: isSelected ? '#F7FAFC' : '#FFFFFF',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSelected ? (
                    <CheckSquare size={16} color="var(--accent-teal)" />
                  ) : (
                    <Square size={16} color="var(--text-secondary)" />
                  )}
                  <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{prof.floatId}</strong>
                  <span className="text-mono text-secondary" style={{ fontSize: '11px' }}>C{prof.cycle}</span>
                </div>
                <span className={`qc-chip ${prof.dataMode === 'D' ? 'qc-1' : 'qc-2'}`} style={{ fontSize: '10px' }}>
                  {prof.dataMode === 'D' ? 'DMQC' : 'Real-time'}
                </span>
              </div>

              {/* Miniature Profile Sketch (T vs Inverted Depth) */}
              <div style={{ background: '#FAFAF9', borderRadius: '3px', border: '1px solid var(--border-light)', padding: '6px', textAlign: 'center' }}>
                <svg width="210" height="95" style={{ display: 'block', margin: '0 auto' }}>
                  <line x1="10" y1="10" x2="200" y2="10" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="10" y1="90" x2="200" y2="90" stroke="#E2E8F0" strokeWidth="1" />
                  <polyline
                    fill="none"
                    stroke={prof.aborted ? '#D97706' : '#0E7C8B'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    points={polylinePoints}
                  />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                  <span>0 dbar</span>
                  <span>{prof.aborted ? '⚠️ Ice Abort' : `${prof.levels.length} levels`}</span>
                  <span>500 dbar</span>
                </div>
              </div>

              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{prof.region}</span>
                <span>{new Date(prof.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
