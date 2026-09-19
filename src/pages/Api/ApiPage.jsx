import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

export default function ApiPage() {
  const [expandedEndpoints, setExpandedEndpoints] = useState({
    'GET /floats': true,
    'GET /floats/:id': false,
    'GET /floats/:id/profiles': false,
    'GET /profiles': false,
    'GET /export': false
  });

  const [copiedId, setCopiedId] = useState(null);

  const toggleExpand = (endpointKey) => {
    setExpandedEndpoints((prev) => ({
      ...prev,
      [endpointKey]: !prev[endpointKey]
    }));
  };

  const handleCopyCurl = (cmd, id) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/floats',
      desc: 'Retrieve full metadata and real-time operational status for all array floats.',
      params: [
        { name: 'region', type: 'string', desc: 'Filter by ocean basin (e.g. "Southern Ocean", "Arctic")' },
        { name: 'status', type: 'string', desc: 'Filter by status ("active", "under_ice", "silent", "recovered")' }
      ],
      curl: 'curl -s https://api.polarsense.ocean/v1/floats?region=Southern+Ocean',
      response: `[
  {
    "id": "PS-001",
    "wmo": "2903881",
    "status": "active",
    "region": "Southern Ocean",
    "deployed": "2026-03-14",
    "lastContact": "2026-08-26T08:12:00Z",
    "battery": 84,
    "cyclesCompleted": 14,
    "iceAborts": 3,
    "position": { "lat": -58.42, "lon": 42.19, "fixQuality": "gps" }
  }
]`
    },
    {
      method: 'GET',
      path: '/floats/:id',
      desc: 'Retrieve comprehensive telemetry, trajectory history, and sensor health diagnostics for a single float.',
      params: [
        { name: 'id', type: 'string', desc: 'Float identifier (e.g. "PS-001" or WMO "2903881")' }
      ],
      curl: 'curl -s https://api.polarsense.ocean/v1/floats/PS-001',
      response: `{
  "id": "PS-001",
  "wmo": "2903881",
  "status": "active",
  "position": { "lat": -58.42, "lon": 42.19, "fixQuality": "gps" },
  "health": {
    "humidity": 31,
    "packVoltage": 10.8,
    "flashUsedPct": 22,
    "pumpCycles": 142
  }
}`
    },
    {
      method: 'GET',
      path: '/floats/:id/profiles',
      desc: 'Retrieve vertical CTD profile level series collected during all ascent cycles.',
      params: [
        { name: 'cycle', type: 'integer', desc: 'Specific cycle number (optional, defaults to all)' },
        { name: 'data_mode', type: 'string', desc: 'Filter by "R" (real-time) or "D" (delayed-mode QC)' }
      ],
      curl: 'curl -s https://api.polarsense.ocean/v1/floats/PS-001/profiles?cycle=14',
      response: `[
  {
    "cycle": 14,
    "timestamp": "2026-08-26T07:45:00Z",
    "dataMode": "R",
    "aborted": false,
    "levels": [
      { "pres": 4.2, "temp": -0.85, "psal": 33.88, "doxy": 320.4, "qc": 1 },
      { "pres": 50.0, "temp": -1.45, "psal": 34.02, "doxy": 315.2, "qc": 1 },
      { "pres": 498.2, "temp": 1.48, "psal": 34.77, "doxy": 228.4, "qc": 1 }
    ]
  }
]`
    },
    {
      method: 'GET',
      path: '/profiles',
      desc: 'Spatio-temporal bounding box profile search across all instruments.',
      params: [
        { name: 'bbox', type: 'string', desc: 'Bounding box formatted as "minLon,minLat,maxLon,maxLat"' },
        { name: 'start', type: 'ISO8601', desc: 'Start date window (e.g. "2026-01-01")' },
        { name: 'end', type: 'ISO8601', desc: 'End date window' }
      ],
      curl: 'curl -s "https://api.polarsense.ocean/v1/profiles?bbox=30,-70,50,-50&start=2026-06-01"',
      response: `{
  "count": 18,
  "profiles": [
    { "floatId": "PS-001", "cycle": 14, "lat": -58.42, "lon": 42.19, "levelsCount": 14 }
  ]
}`
    },
    {
      method: 'GET',
      path: '/export',
      desc: 'Stream standardized Argo NetCDF (CF-1.6), CSV, or JSON bundle for automated scientific workflows.',
      params: [
        { name: 'format', type: 'string', desc: 'Target format: "netcdf", "csv", or "json"' },
        { name: 'floats', type: 'string', desc: 'Comma-separated float identifiers' },
        { name: 'qc_min', type: 'integer', desc: 'Minimum acceptable QC flag (1 or 2 recommended)' }
      ],
      curl: 'curl -s -O -J "https://api.polarsense.ocean/v1/export?format=netcdf&floats=PS-001,PS-002"',
      response: `// Binary NetCDF 3.1 Classic File Stream Header
netcdf polarsense_export_20260826 {
dimensions:
  N_PROF = 48 ;
  N_LEVELS = 30 ;
...
}`
    }
  ];

  return (
    <div className="main-content">
      {/* Title & Intro Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title">PolarSense REST API Reference</h1>
        <p className="text-secondary" style={{ fontSize: '13px', marginTop: '4px', maxWidth: '900px', lineHeight: 1.6 }}>
          The PolarSense Ground Station exposes an open REST interface for programmatic oceanographic data ingest, model assimilation, and automated NetCDF harvesting.
        </p>
      </div>

      {/* Open Access Badge Bar */}
      <div className="panel" style={{ marginBottom: '24px', background: '#F8FAFC', borderLeft: '3px solid var(--accent-teal)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Open Scientific Data Protocol</strong>
            <p className="text-secondary" style={{ fontSize: '12px', marginTop: '2px' }}>
              No API key required. No rate limit. CORS enabled globally. Standard UNESCO EOS-80 & Argo 3.1 schemas.
            </p>
          </div>
          <div className="text-mono" style={{ fontSize: '11px', background: '#FFFFFF', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            Base URI: <code>https://api.polarsense.ocean/v1</code>
          </div>
        </div>
      </div>

      {/* Endpoints Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {endpoints.map((ep, i) => {
          const key = `${ep.method} ${ep.path}`;
          const isExpanded = expandedEndpoints[key];

          return (
            <div key={key} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Endpoint Header Row */}
              <div
                onClick={() => toggleExpand(key)}
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isExpanded ? '#FAFAF9' : '#FFFFFF',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      background: 'var(--accent-teal-light)',
                      color: 'var(--accent-teal)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      border: '1px solid #B5E4EA'
                    }}
                  >
                    {ep.method}
                  </span>
                  <span className="text-mono" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {ep.path}
                  </span>
                  <span className="text-secondary" style={{ fontSize: '12px' }}>
                    — {ep.desc}
                  </span>
                </div>

                <div style={{ color: 'var(--text-secondary)' }}>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
                  {/* Parameter Table */}
                  {ep.params && ep.params.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <span className="section-heading" style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Query Parameters</span>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p) => (
                            <tr key={p.name}>
                              <td className="text-mono"><code>{p.name}</code></td>
                              <td className="text-mono text-secondary">{p.type}</td>
                              <td>{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Curl Command */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="section-heading" style={{ fontSize: '11px', margin: 0 }}>Example Request</span>
                      <button
                        className="btn"
                        onClick={() => handleCopyCurl(ep.curl, i)}
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        {copiedId === i ? <Check size={12} color="var(--success-green)" /> : <Copy size={12} />}
                        {copiedId === i ? 'Copied' : 'Copy cURL'}
                      </button>
                    </div>
                    <pre style={{ background: '#1A2733', color: '#E2E8F0', padding: '12px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                      {ep.curl}
                    </pre>
                  </div>

                  {/* Sample JSON Response */}
                  <div>
                    <span className="section-heading" style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Response Payload (application/json)</span>
                    <pre style={{ background: '#F8FAFC', color: '#334155', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                      {ep.response}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
