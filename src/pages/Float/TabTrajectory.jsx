import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Info, MapPin } from 'lucide-react';

export default function TabTrajectory({ float }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || !float?.trajectory?.length) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const points = float.trajectory;
    const initialLat = points[points.length - 1]?.lat || 0;
    const initialLon = points[points.length - 1]?.lon || 0;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap standard tiles (No API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // Group trajectory into segments (solid GPS vs dashed dead-reckoned)
    let currentSegment = [];
    let isCurrentEstimated = points[0]?.estimated || false;

    points.forEach((pt, i) => {
      const latlng = [pt.lat, pt.lon];
      
      // Uncertainty circle for dead reckoned under-ice positions
      if (pt.estimated || pt.uncertaintyKm > 0.5) {
        L.circle(latlng, {
          radius: (pt.uncertaintyKm || 2.0) * 1000,
          color: '#D97706',
          fillColor: '#D97706',
          fillOpacity: 0.15,
          weight: 1,
          dashArray: '3, 3'
        }).addTo(map);
      }

      // Marker for each surface / fix event
      const isLatest = i === points.length - 1;
      const markerColor = isLatest ? '#0E7C8B' : (pt.estimated ? '#D97706' : '#516B84');
      
      const customIcon = L.divIcon({
        className: 'custom-float-marker',
        html: `<div style="
          width: ${isLatest ? '14px' : '10px'};
          height: ${isLatest ? '14px' : '10px'};
          border-radius: 50%;
          background: ${markerColor};
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker(latlng, { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <strong style="color: #0E7C8B;">Cycle ${pt.cycle}</strong><br/>
          <span>${new Date(pt.timestamp).toLocaleDateString()}</span><br/>
          <span style="font-family: monospace; font-size: 11px;">${pt.lat.toFixed(3)}°, ${pt.lon.toFixed(3)}°</span><br/>
          <span style="color: ${pt.estimated ? '#D97706' : '#1E7A4D'}; font-size: 11px; font-weight: 600;">
            ${pt.estimated ? '⚠️ Dead Reckoned (Under Ice)' : '✓ GPS Surface Fix'}
          </span>
        </div>
      `);

      // Segment handling
      if (pt.estimated === isCurrentEstimated) {
        currentSegment.push(latlng);
      } else {
        if (currentSegment.length > 0) {
          currentSegment.push(latlng); // connect junction
          L.polyline(currentSegment, {
            color: isCurrentEstimated ? '#8E9CA8' : '#0E7C8B',
            weight: 2.5,
            dashArray: isCurrentEstimated ? '6, 6' : undefined,
            opacity: 0.85
          }).addTo(map);
        }
        currentSegment = [latlng];
        isCurrentEstimated = pt.estimated;
      }
    });

    if (currentSegment.length > 0) {
      L.polyline(currentSegment, {
        color: isCurrentEstimated ? '#8E9CA8' : '#0E7C8B',
        weight: 2.5,
        dashArray: isCurrentEstimated ? '6, 6' : undefined,
        opacity: 0.85
      }).addTo(map);
    }

    // Fit map bounds to trajectory
    const latLngs = points.map((p) => [p.lat, p.lon]);
    if (latLngs.length > 1) {
      map.fitBounds(latLngs, { padding: [40, 40] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [float]);

  return (
    <div className="tab-trajectory">
      {/* Trajectory Map */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="section-heading" style={{ margin: 0 }}>Drift & Trajectory Track</span>
            <span className="text-secondary" style={{ fontSize: '12px', marginLeft: '12px' }}>
              {float.trajectory?.length || 0} track points recorded
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '3px', background: '#0E7C8B' }}></span> GPS Fix (Solid)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '3px', borderTop: '2px dashed #8E9CA8' }}></span> Dead Reckoned (Dashed)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.25)', border: '1px dashed #D97706' }}></span> Uncertainty Radius
            </span>
          </div>
        </div>

        <div ref={mapContainerRef} style={{ width: '100%', height: '420px', background: '#F8FAFC' }} />

        <div style={{ padding: '10px 20px', background: '#FAFAF9', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={14} color="var(--accent-teal)" />
          <span>
            <em>Dashed segments are estimated. Under-ice positions represent cycle-averaged drift displacement with uncertainty bounds (PolarSense Spec §24.1).</em>
          </span>
        </div>
      </div>

      {/* Surfacing Events Table */}
      <div className="panel">
        <div className="panel-header">
          <span className="section-heading" style={{ margin: 0 }}>Surfacing & Telemetry Event Log</span>
          <span className="text-mono text-secondary" style={{ fontSize: '11px' }}>{float.wmo}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cycle</th>
                <th>Timestamp (UTC)</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Fix Quality</th>
                <th>Est. Uncertainty</th>
                <th>Mission Status</th>
              </tr>
            </thead>
            <tbody>
              {[...(float.trajectory || [])].reverse().map((t, idx) => (
                <tr key={idx}>
                  <td className="text-mono"><strong>#{t.cycle}</strong></td>
                  <td className="text-mono">{new Date(t.timestamp).toISOString().replace('T', ' ').substring(0, 19)}</td>
                  <td className="text-mono">{t.lat.toFixed(4)}° {t.lat >= 0 ? 'N' : 'S'}</td>
                  <td className="text-mono">{t.lon.toFixed(4)}° {t.lon >= 0 ? 'E' : 'W'}</td>
                  <td>
                    {t.estimated ? (
                      <span className="status-pill status-under-ice" style={{ fontSize: '10px' }}>Dead Reckoned</span>
                    ) : (
                      <span className="status-pill status-active" style={{ fontSize: '10px' }}>GPS Fixed (3D)</span>
                    )}
                  </td>
                  <td className="text-mono">{t.estimated ? `± ${t.uncertaintyKm} km` : '± 50 m'}</td>
                  <td>
                    {t.estimated ? (
                      <span style={{ color: 'var(--alert-amber)', fontWeight: 500, fontSize: '12px' }}>Ice Abort (Subsurface Drift)</span>
                    ) : (
                      <span style={{ color: 'var(--success-green)', fontWeight: 500, fontSize: '12px' }}>Nominal Uplink</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
