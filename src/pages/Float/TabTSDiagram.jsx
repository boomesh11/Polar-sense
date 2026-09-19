import React, { useState, useMemo } from 'react';
import { calculateSigmaTheta, generateIsopycnals, getDepthColor } from '../../data/oceanography';

export default function TabTSDiagram({ float }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedCycleOnly, setSelectedCycleOnly] = useState('all');

  const profiles = float?.profiles || [];

  // Compile all CTD points from float profiles
  const allPoints = useMemo(() => {
    const pts = [];
    profiles.forEach((p) => {
      if (selectedCycleOnly !== 'all' && p.cycle !== Number(selectedCycleOnly)) return;
      (p.levels || []).forEach((lvl) => {
        const sigma = calculateSigmaTheta(lvl.psal, lvl.temp);
        pts.push({
          cycle: p.cycle,
          timestamp: p.timestamp,
          pres: lvl.pres,
          temp: lvl.temp,
          psal: lvl.psal,
          sigma: sigma,
          qc: lvl.qc
        });
      });
    });
    return pts;
  }, [profiles, selectedCycleOnly]);

  // Compute bounding box for Salinity and Temperature with padding
  const bounds = useMemo(() => {
    if (!allPoints.length) {
      return { minS: 33.0, maxS: 35.5, minT: -2.5, maxT: 8.0 };
    }
    const sVals = allPoints.map((p) => p.psal);
    const tVals = allPoints.map((p) => p.temp);
    return {
      minS: Math.max(28.0, Math.floor(Math.min(...sVals) * 2) / 2 - 0.3),
      maxS: Math.min(36.5, Math.ceil(Math.max(...sVals) * 2) / 2 + 0.3),
      minT: Math.floor(Math.min(...tVals) - 1.0),
      maxT: Math.ceil(Math.max(...tVals) + 1.0)
    };
  }, [allPoints]);

  // Generate UNESCO density isopycnals for this bounding box
  const isopycnals = useMemo(() => {
    return generateIsopycnals(
      bounds.minS,
      bounds.maxS,
      bounds.minT,
      bounds.maxT,
      [23.0, 24.0, 25.0, 26.0, 26.5, 27.0, 27.2, 27.4, 27.6, 27.8, 28.0, 28.2]
    );
  }, [bounds]);

  // SVG coordinate transform helpers
  const svgWidth = 680;
  const svgHeight = 440;
  const margin = { top: 30, right: 40, bottom: 50, left: 60 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  const toX = (sal) => {
    return margin.left + ((sal - bounds.minS) / (bounds.maxS - bounds.minS)) * plotWidth;
  };

  const toY = (temp) => {
    // Standard Temperature Y-axis: Higher temp at the top, lower at bottom
    return margin.top + plotHeight - ((temp - bounds.minT) / (bounds.maxT - bounds.minT)) * plotHeight;
  };

  // Generate X (Salinity) and Y (Temperature) grid ticks
  const xTicks = useMemo(() => {
    const ticks = [];
    const step = bounds.maxS - bounds.minS > 4 ? 1.0 : 0.5;
    for (let s = Math.ceil(bounds.minS * 2) / 2; s <= bounds.maxS; s += step) {
      ticks.push(Number(s.toFixed(2)));
    }
    return ticks;
  }, [bounds]);

  const yTicks = useMemo(() => {
    const ticks = [];
    const step = bounds.maxT - bounds.minT > 10 ? 2 : 1;
    for (let t = Math.ceil(bounds.minT); t <= bounds.maxT; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [bounds]);

  return (
    <div className="tab-ts-diagram">
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div>
            <span className="section-heading" style={{ margin: 0 }}>Temperature–Salinity (T–S) Diagram</span>
            <div className="text-secondary" style={{ fontSize: '12px', marginTop: '2px' }}>
              Potential temperature versus practical salinity with UNESCO EOS-80 potential density anomaly isopycnals (σ<sub>θ</sub> kg/m³).
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cycle Filter:</span>
            <select
              value={selectedCycleOnly}
              onChange={(e) => setSelectedCycleOnly(e.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              <option value="all">All Cycles ({profiles.length})</option>
              {profiles.map((p) => (
                <option key={p.cycle} value={p.cycle}>
                  Cycle #{p.cycle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Main SVG T-S Coordinate Space */}
          <div style={{ flex: 1, position: 'relative', background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Background Grid Lines */}
              {xTicks.map((s) => (
                <g key={`x-grid-${s}`}>
                  <line
                    x1={toX(s)}
                    y1={margin.top}
                    x2={toX(s)}
                    y2={margin.top + plotHeight}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x={toX(s)}
                    y={margin.top + plotHeight + 20}
                    textAnchor="middle"
                    fill="#5A6B78"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {s}
                  </text>
                </g>
              ))}

              {yTicks.map((t) => (
                <g key={`y-grid-${t}`}>
                  <line
                    x1={margin.left}
                    y1={toY(t)}
                    x2={margin.left + plotWidth}
                    y2={toY(t)}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x={margin.left - 12}
                    y={toY(t) + 4}
                    textAnchor="end"
                    fill="#5A6B78"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {t}°C
                  </text>
                </g>
              ))}

              {/* Density Isopycnals (Contour lines) */}
              {isopycnals.map((iso) => {
                const pathD = iso.points.reduce((acc, pt, idx) => {
                  const x = toX(pt.sal);
                  const y = toY(pt.temp);
                  return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }, '');

                const midPt = iso.points[Math.floor(iso.points.length / 2)];
                return (
                  <g key={`iso-${iso.sigma}`}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    {midPt && (
                      <text
                        x={toX(midPt.sal) + 4}
                        y={toY(midPt.temp) - 4}
                        fill="#94A3B8"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        σ<sub>θ</sub>={iso.sigma}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Axis Labels */}
              <text
                x={margin.left + plotWidth / 2}
                y={svgHeight - 10}
                textAnchor="middle"
                fill="#1A2733"
                fontSize="12"
                fontWeight="600"
              >
                Practical Salinity S (PSU)
              </text>
              <text
                x={- (margin.top + plotHeight / 2)}
                y={18}
                textAnchor="middle"
                transform="rotate(-90)"
                fill="#1A2733"
                fontSize="12"
                fontWeight="600"
              >
                In-Situ Temperature T (°C)
              </text>

              {/* CTD Scatter Points */}
              {allPoints.map((pt, i) => {
                const cx = toX(pt.psal);
                const cy = toY(pt.temp);
                const color = getDepthColor(pt.pres);
                const isHovered = hoveredPoint === pt;

                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4}
                    fill={color}
                    stroke={isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
                    strokeWidth={isHovered ? 2 : 1}
                    style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Inspector Tooltip */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-teal)', marginBottom: '4px' }}>
                  Cycle #{hoveredPoint.cycle} Level
                </div>
                <div>Pressure / Depth: <strong>{hoveredPoint.pres} dbar</strong></div>
                <div>Salinity: <strong>{hoveredPoint.psal} PSU</strong></div>
                <div>Temperature: <strong>{hoveredPoint.temp} °C</strong></div>
                <div>Density σ<sub>θ</sub>: <strong>{hoveredPoint.sigma} kg/m³</strong></div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  QC Flag: {hoveredPoint.qc}
                </div>
              </div>
            )}
          </div>

          {/* Vertical Depth Colormap Legend */}
          <div style={{ width: '140px', background: '#FAFAF9', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '12px' }}>
            <span className="section-heading" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
              Depth Colormap
            </span>
            <div style={{ display: 'flex', gap: '10px', height: '280px' }}>
              {/* Gradient Bar */}
              <div
                style={{
                  width: '18px',
                  borderRadius: '3px',
                  background: 'linear-gradient(to bottom, #0E7C8B 0%, #2E5B88 50%, #1E293B 100%)',
                  border: '1px solid #CBD5E1'
                }}
              />
              {/* Ticks */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                <span>0 m (Sfc)</span>
                <span>100 m</span>
                <span>250 m</span>
                <span>380 m</span>
                <span>500 m</span>
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Points plotted: <strong>{allPoints.length}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
