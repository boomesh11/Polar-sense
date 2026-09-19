import React from 'react';
import { RotateCcw, Filter, Map } from 'lucide-react';

export default function FleetFilterRail({
  filters,
  setFilters,
  resetFilters,
  isDrawingBBox,
  setIsDrawingBBox
}) {
  const regions = ['All', 'Arctic', 'Southern Ocean', 'Coastal trials'];
  const statuses = [
    { key: 'active', label: 'Active' },
    { key: 'under_ice', label: 'Under ice' },
    { key: 'silent', label: 'Silent' },
    { key: 'recovered', label: 'Recovered' }
  ];

  const handleStatusToggle = (key) => {
    setFilters((prev) => {
      const exists = prev.statuses.includes(key);
      return {
        ...prev,
        statuses: exists ? prev.statuses.filter((s) => s !== key) : [...prev.statuses, key]
      };
    });
  };

  return (
    <aside className="fleet-filter-rail panel" style={{ width: '280px', flexShrink: 0, padding: '16px' }}>
      <div className="panel-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="var(--accent-teal)" />
          <span className="section-heading" style={{ margin: 0 }}>Fleet Filters</span>
        </div>
      </div>

      {/* Date Range */}
      <div style={{ marginBottom: '16px' }}>
        <label className="filter-label">Date Window</label>
        <select
          value={filters.dateWindow}
          onChange={(e) => setFilters({ ...filters, dateWindow: e.target.value })}
          style={{ width: '100%', marginTop: '4px' }}
        >
          <option value="30d">Last 30 Days (Nominal)</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last 1 Year</option>
          <option value="all">Full Mission Archive</option>
        </select>
      </div>

      {/* Region Dropdown */}
      <div style={{ marginBottom: '16px' }}>
        <label className="filter-label">Ocean Region</label>
        <select
          value={filters.region}
          onChange={(e) => setFilters({ ...filters, region: e.target.value })}
          style={{ width: '100%', marginTop: '4px' }}
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Status Checkboxes */}
      <div style={{ marginBottom: '16px' }}>
        <label className="filter-label">Operational Status</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          {statuses.map((st) => (
            <label key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.statuses.includes(st.key)}
                onChange={() => handleStatusToggle(st.key)}
              />
              <span>{st.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Data Mode Radio */}
      <div style={{ marginBottom: '16px' }}>
        <label className="filter-label">Data Quality Mode</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="dataMode"
              value="all"
              checked={filters.dataMode === 'all'}
              onChange={(e) => setFilters({ ...filters, dataMode: e.target.value })}
            />
            <span>All Modes</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="dataMode"
              value="R"
              checked={filters.dataMode === 'R'}
              onChange={(e) => setFilters({ ...filters, dataMode: e.target.value })}
            />
            <span>Real-time (R) only</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="dataMode"
              value="D"
              checked={filters.dataMode === 'D'}
              onChange={(e) => setFilters({ ...filters, dataMode: e.target.value })}
            />
            <span>Delayed-mode (D) QC</span>
          </label>
        </div>
      </div>

      {/* Depth Range Dual Inputs */}
      <div style={{ marginBottom: '18px' }}>
        <label className="filter-label">Profile Depth Range (dbar)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <input
            type="number"
            min="0"
            max="500"
            value={filters.minDepth}
            onChange={(e) => setFilters({ ...filters, minDepth: Number(e.target.value) })}
            style={{ width: '70px' }}
          />
          <span className="text-muted">to</span>
          <input
            type="number"
            min="0"
            max="500"
            value={filters.maxDepth}
            onChange={(e) => setFilters({ ...filters, maxDepth: Number(e.target.value) })}
            style={{ width: '70px' }}
          />
          <span className="text-secondary" style={{ fontSize: '11px' }}>m</span>
        </div>
      </div>

      {/* Draw Region Button */}
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setIsDrawingBBox(!isDrawingBBox)}
          className={`btn ${isDrawingBBox ? 'btn-active' : ''}`}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Map size={14} />
          {isDrawingBBox ? 'Drawing Bounding Box...' : 'Draw region on map'}
        </button>
        {filters.bbox && (
          <div className="text-mono text-secondary" style={{ fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
            BBox: [{filters.bbox.minLat.toFixed(1)}°, {filters.bbox.minLon.toFixed(1)}° to {filters.bbox.maxLat.toFixed(1)}°, {filters.bbox.maxLon.toFixed(1)}°]
          </div>
        )}
      </div>

      {/* Reset Filters Link */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', textAlign: 'center' }}>
        <button
          onClick={resetFilters}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline'
          }}
        >
          Reset all filters
        </button>
      </div>

      <style>{`
        .filter-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
        }
      `}</style>
    </aside>
  );
}
