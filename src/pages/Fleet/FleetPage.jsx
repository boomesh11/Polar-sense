import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import L from 'leaflet';
import { useFleet } from '../../context/FleetContext';
import FleetFilterRail from './FleetFilterRail';
import FleetSummaryCards from '../../components/FleetSummaryCards';
import TelemetryStatusWidget from '../../components/TelemetryStatusWidget';
import FloatSidePanel from '../../components/FloatSidePanel';
import StatusPill from '../../components/StatusPill';
import Sparkline from '../../components/Sparkline';
import { ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

function BatteryBar({ pct }) {
  const color = pct > 50 ? '#10B981' : pct > 20 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 44, height: 5, background: '#E4E7EA', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color, fontWeight: 500 }}>
        {pct}%
      </span>
    </div>
  );
}

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

export default function FleetPage() {
  const navigate = useNavigate();
  const { fleet, totalProfiles, simTick, lastNetworkUpdate } = useFleet();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const bboxRectRef = useRef(null);

  const [selectedFloat, setSelectedFloat] = useState(null);
  const [isDrawingBBox, setIsDrawingBBox] = useState(false);
  const isDrawingBBoxRef = useRef(isDrawingBBox);

  // Sync ref and configure map dragging / cursor
  useEffect(() => {
    isDrawingBBoxRef.current = isDrawingBBox;
    if (mapInstanceRef.current) {
      if (isDrawingBBox) {
        mapInstanceRef.current.dragging.disable();
        if (mapContainerRef.current) mapContainerRef.current.style.cursor = 'crosshair';
      } else {
        mapInstanceRef.current.dragging.enable();
        if (mapContainerRef.current) mapContainerRef.current.style.cursor = '';
      }
    }
  }, [isDrawingBBox]);

  const resetFilters = () => {
    setFilters({
      dateWindow: '30d',
      region: 'All',
      statuses: ['active', 'under_ice', 'silent', 'recovered'],
      dataMode: 'all',
      minDepth: 0,
      maxDepth: 500,
      bbox: null,
    });
    setIsDrawingBBox(false);
  };

  // Filter floats
  const filteredFloats = useMemo(() => {
    return fleet.filter((f) => {
      if (filters.region !== 'All' && f.region !== filters.region) return false;
      if (!filters.statuses.includes(f.status)) return false;
      if (filters.dataMode !== 'all') {
        const latestMode = f.profiles?.[0]?.dataMode || 'R';
        if (latestMode !== filters.dataMode) return false;
      }
      if (f.currentDepth < filters.minDepth || f.currentDepth > filters.maxDepth) return false;
      if (filters.bbox) {
        const lat = f.position?.lat || 0;
        const lon = f.position?.lon || 0;
        if (
          lat < filters.bbox.minLat ||
          lat > filters.bbox.maxLat ||
          lon < filters.bbox.minLon ||
          lon > filters.bbox.maxLon
        ) {
          return false;
        }
      }
      return true;
    });
  }, [fleet, filters]);

  // Leaflet Map Initialization — uses OpenStreetMap standard tiles (No API key required)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [15, 10],
        zoom: 2,
        minZoom: 1.5,
        zoomControl: true,
        attributionControl: true,
      });

      // Free, open-access tile layer (No API key watermarks)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Click / Drag Bounding Box event using ref to prevent stale closures
      let startLatLng = null;
      let tempPreviewRect = null;

      map.on('mousedown', (e) => {
        if (!isDrawingBBoxRef.current) return;
        startLatLng = e.latlng;
      });

      map.on('mousemove', (e) => {
        if (!isDrawingBBoxRef.current || !startLatLng) return;
        const bounds = L.latLngBounds(startLatLng, e.latlng);
        if (tempPreviewRect) {
          tempPreviewRect.setBounds(bounds);
        } else {
          tempPreviewRect = L.rectangle(bounds, {
            color: '#0E7C8B',
            weight: 2,
            fillOpacity: 0.15,
            dashArray: '4, 4',
          }).addTo(map);
        }
      });

      map.on('mouseup', (e) => {
        if (!isDrawingBBoxRef.current || !startLatLng) return;
        if (tempPreviewRect) {
          tempPreviewRect.remove();
          tempPreviewRect = null;
        }
        const bounds = L.latLngBounds(startLatLng, e.latlng);
        setFilters((prev) => ({
          ...prev,
          bbox: {
            minLat: Math.min(bounds.getSouth(), bounds.getNorth()),
            maxLat: Math.max(bounds.getSouth(), bounds.getNorth()),
            minLon: Math.min(bounds.getWest(), bounds.getEast()),
            maxLon: Math.max(bounds.getWest(), bounds.getEast()),
          },
        }));
        setIsDrawingBBox(false);
        startLatLng = null;
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Trajectories when filteredFloats changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const group = markersGroupRef.current;
    group.clearLayers();

    if (bboxRectRef.current) {
      bboxRectRef.current.remove();
      bboxRectRef.current = null;
    }
    if (filters.bbox) {
      bboxRectRef.current = L.rectangle(
        [
          [filters.bbox.minLat, filters.bbox.minLon],
          [filters.bbox.maxLat, filters.bbox.maxLon],
        ],
        { color: '#0E7C8B', weight: 2, fillOpacity: 0.1, dashArray: '4, 4' }
      ).addTo(mapInstanceRef.current);
    }

    filteredFloats.forEach((f) => {
      const pos = f.position;
      if (!pos) return;

      let color = '#0E7C8B'; // Active Teal
      if (f.status === 'under_ice') color = '#D97706'; // Amber
      else if (f.status === 'silent') color = '#5A6B78'; // Grey
      else if (f.status === 'recovered') color = '#1E7A4D'; // Green

      // Trajectory lines
      if (f.trajectory && f.trajectory.length > 1) {
        let currentSegment = [];
        let isCurrentEstimated = f.trajectory[0]?.estimated || false;

        f.trajectory.forEach((t) => {
          const latlng = [t.lat, t.lon];
          if (t.estimated === isCurrentEstimated) {
            currentSegment.push(latlng);
          } else {
            if (currentSegment.length > 0) {
              currentSegment.push(latlng);
              L.polyline(currentSegment, {
                color: isCurrentEstimated ? '#CBD5E1' : color,
                weight: 1.5,
                opacity: 0.6,
                dashArray: isCurrentEstimated ? '4, 4' : undefined,
              }).addTo(group);
            }
            currentSegment = [latlng];
            isCurrentEstimated = t.estimated;
          }
        });

        if (currentSegment.length > 0) {
          L.polyline(currentSegment, {
            color: isCurrentEstimated ? '#CBD5E1' : color,
            weight: 1.5,
            opacity: 0.6,
            dashArray: isCurrentEstimated ? '4, 4' : undefined,
          }).addTo(group);
        }
      }

      // Circular float marker
      const customIcon = L.divIcon({
        className: 'fleet-marker',
        html: `<div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
          cursor: pointer;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([pos.lat, pos.lon], { icon: customIcon }).addTo(group);

      marker.on('click', () => {
        setSelectedFloat(f);
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 160px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #E4E7EA; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #1A2733; font-family: monospace;">${f.id}</strong>
            <span style="font-family: monospace; font-size: 11px; color: #5A6B78;">WMO ${f.wmo}</span>
          </div>
          <div>Status: <strong>${f.status.replace('_', ' ').toUpperCase()}</strong></div>
          <div>Depth: <strong>${f.currentDepth.toFixed(0)} m</strong> · Cycles: <strong>${f.cyclesCompleted}</strong></div>
          <div style="color: #5A6B78; font-size: 11px; margin-top: 2px;">
            Contact: ${new Date(f.lastContact).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style="margin-top: 8px; border-top: 1px solid #E4E7EA; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #0E7C8B; font-weight: 600; font-size: 11px; cursor: pointer;">
              Open side panel &rarr;
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
    });
  }, [filteredFloats, filters.bbox]);

  // Keep selectedFloat synchronized with live context updates
  const liveSelectedFloat = useMemo(() => {
    if (!selectedFloat) return null;
    return fleet.find((f) => f.id === selectedFloat.id) || selectedFloat;
  }, [fleet, selectedFloat]);

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Breadcrumb & Live Telemetry Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Global Float Array</h1>
          <p className="text-secondary" style={{ fontSize: '13px', marginTop: '2px' }}>
            Primary operational array. Spatial telemetry indexing — 15 s refresh cadence.
          </p>
        </div>
        <TelemetryStatusWidget />
      </div>

      {/* Fleet Summary Stat Cards (6 Cards) */}
      <FleetSummaryCards />

      {/* Main Map + Filter Rail Row */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch', position: 'relative' }}>
        {/* Left Filter Rail */}
        <FleetFilterRail
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
          isDrawingBBox={isDrawingBBox}
          setIsDrawingBBox={setIsDrawingBBox}
        />

        {/* Map Container */}
        <div className="panel" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', minHeight: '520px' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '520px', background: '#F8FAFC' }} />

          {/* Float Side Panel Overlay */}
          {liveSelectedFloat && (
            <FloatSidePanel
              float={liveSelectedFloat}
              onClose={() => setSelectedFloat(null)}
            />
          )}

          {/* Bottom-Left Legend Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              zIndex: 800,
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '11px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>ARRAY LEGEND</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-teal)' }}></span> Active (GPS Fix)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--alert-amber)' }}></span> Under Ice (Acoustic / Est.)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-secondary)' }}></span> Silent (&gt; 30 Days)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-green)' }}></span> Recovered (DMQC)
              </span>
            </div>
          </div>

          {/* Bottom-Right Summary Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              zIndex: 800,
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Showing <strong>{filteredFloats.length}</strong> floats · <strong>{totalProfiles}</strong> profiles · OSM OceanBase WGS-84
          </div>
        </div>
      </div>

      {/* Matching Floats Table */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="section-heading" style={{ margin: 0 }}>Matching Array Instruments</span>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                background: '#EBF7F9',
                color: '#0E7C8B',
                padding: '2px 6px',
                borderRadius: 3,
                border: '1px solid #B5E4EA',
              }}
            >
              LIVE INDEX
            </span>
          </div>
          <span className="text-secondary tabular-nums text-mono" style={{ fontSize: '12px' }}>
            {filteredFloats.length} instruments matching query
          </span>
        </div>

        {filteredFloats.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={32} color="#8E9CA8" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>No floats match current query criteria</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing active bounding box or resetting operational status filters.</div>
            <button onClick={resetFilters} className="btn" style={{ marginTop: 12 }}>
              Reset all filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Float ID</th>
                  <th>WMO</th>
                  <th>Status</th>
                  <th>Mission State</th>
                  <th>Battery</th>
                  <th>Last Contact</th>
                  <th>Cycles</th>
                  <th>Depth</th>
                  <th>Surf T / S</th>
                  <th>Fix Quality</th>
                  <th>Region</th>
                  <th>Data Mode</th>
                  <th>T-Profile</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFloats.map((f) => {
                  const stateKey = f.missionState || 'SURFACE';
                  const sc = STATE_COLORS[stateKey] || STATE_COLORS.SURFACE;
                  const latestProf = f.profiles?.[0];
                  const surfT = latestProf?.levels?.[0]?.temp;
                  const surfS = latestProf?.levels?.[0]?.psal;

                  const ageSec = f.lastContact ? Math.floor((Date.now() - new Date(f.lastContact).getTime()) / 1000) : null;
                  const isStale = ageSec !== null && ageSec > 1800;

                  return (
                    <tr
                      key={f.id}
                      className="clickable"
                      onClick={() => setSelectedFloat(f)}
                      style={{ transition: 'background 0.2s' }}
                    >
                      <td className="text-mono">
                        <strong style={{ color: 'var(--accent-teal)' }}>{f.id}</strong>
                      </td>
                      <td className="text-mono">{f.wmo}</td>
                      <td>
                        <StatusPill status={f.status} />
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            background: sc.bg,
                            color: sc.text,
                            border: `1px solid ${sc.border}`,
                            padding: '2px 6px',
                            borderRadius: 3,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {STATE_LABELS[stateKey]}
                        </span>
                      </td>
                      <td>
                        <BatteryBar pct={f.battery ?? 0} />
                      </td>
                      <td className="text-mono" style={{ fontSize: 11 }}>
                        <div>
                          {new Date(f.lastContact).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        {isStale && (
                          <span style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>⚠ STALE</span>
                        )}
                      </td>
                      <td className="text-mono"><strong>{f.cyclesCompleted}</strong></td>
                      <td className="text-mono">{f.currentDepth.toFixed(0)} m</td>
                      <td className="text-mono" style={{ fontSize: 11 }}>
                        {surfT != null ? `${surfT.toFixed(1)}°C` : '—'} / {surfS != null ? `${surfS.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ fontSize: 11 }}>
                        {f.position?.fixQuality === 'gps' ? (
                          <span style={{ color: '#10B981', fontWeight: 500 }}>GPS</span>
                        ) : (
                          <span style={{ color: '#D97706', fontWeight: 500 }}>Dead-Rec</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12 }}>{f.region}</td>
                      <td>
                        <span className={`qc-chip ${latestProf?.dataMode === 'D' ? 'qc-1' : 'qc-2'}`}>
                          {latestProf?.dataMode === 'D' ? 'Delayed (D)' : 'Real-time (R)'}
                        </span>
                      </td>
                      <td>
                        <Sparkline
                          data={latestProf?.levels || []}
                          width={110}
                          height={32}
                          color={f.status === 'under_ice' ? '#D97706' : '#0E7C8B'}
                          type="profile"
                        />
                      </td>
                      <td>
                        <Link
                          to={`/float/${f.id}`}
                          style={{
                            color: 'var(--accent-teal)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
