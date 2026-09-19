import React from 'react';

export default function Sparkline({
  data = [],
  width = 110,
  height = 36,
  color = '#0E7C8B',
  type = 'profile',
}) {
  if (!data || data.length < 2) {
    return <span className="text-muted" style={{ fontSize: '11px' }}>—</span>;
  }

  let points = [];
  let tooltipLines = [];

  if (type === 'profile') {
    const xs  = data.map((d) => d.temp ?? d.val ?? 0);
    const ys  = data.map((d) => d.pres ?? d.depth ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys, 500);
    const rangeX = maxX - minX || 1;

    const padL = 4, padR = 4, padT = 4, padB = 14; // bottom pad for axis labels
    const drawW = width - padL - padR;
    const drawH = height - padT - padB;

    points = data.map((d) => {
      const x = padL + (((d.temp ?? d.val ?? 0) - minX) / rangeX) * drawW;
      const y = padT + ((d.pres ?? d.depth ?? 0) / maxY) * drawH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const minTemp = minX.toFixed(1);
    const maxTemp = maxX.toFixed(1);
    const maxPres = maxY.toFixed(0);
    const minPsal = Math.min(...data.map((d) => d.psal ?? 0)).toFixed(2);
    const maxPsal = Math.max(...data.map((d) => d.psal ?? 0)).toFixed(2);

    tooltipLines = [
      `T: ${minTemp}–${maxTemp} °C`,
      `P: 0–${maxPres} dbar`,
      `S: ${minPsal}–${maxPsal} PSU`,
    ];

    // Tick marks at 0, 250, 500 dbar
    const ticks = [0, 250, 500].filter((p) => p <= maxY);
    const tickY = ticks.map((p) => ({
      p,
      y: padT + (p / maxY) * drawH,
    }));

    return (
      <div title={tooltipLines.join(' | ')} style={{ display: 'inline-block', cursor: 'help' }}>
        <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          {/* Axis ticks */}
          {tickY.map(({ p, y }) => (
            <g key={p}>
              <line x1={padL} y1={y} x2={padL + 3} y2={y} stroke="#CBD5E1" strokeWidth="1" />
              <text x={padL + 4} y={y + 3} fontSize="7" fill="#8E9CA8" textAnchor="start">
                {p}
              </text>
            </g>
          ))}
          {/* Profile line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.join(' ')}
          />
        </svg>
      </div>
    );
  } else {
    // Standard time-series trend
    const values = data.map((d) => (typeof d === 'number' ? d : (d.val ?? d.battery ?? 0)));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    points = values.map((val, i) => {
      const x = (i / (values.length - 1)) * (width - 4) + 2;
      const y = height - (((val - min) / range) * (height - 6) + 3);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return (
      <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(' ')}
        />
      </svg>
    );
  }
}
