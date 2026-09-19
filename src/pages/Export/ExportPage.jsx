import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { generateCSV, generateNetCDFAscii } from '../../data/oceanography';
import { Download, FileCode, CheckCircle, Database, ShieldCheck } from 'lucide-react';

export default function ExportPage() {
  const { fleet } = useFleet();

  const [dateRange, setDateRange] = useState({ start: '2025-08-01', end: '2026-08-26' });
  const [bbox, setBbox] = useState({ minLat: -75, maxLat: 85, minLon: -180, maxLon: 180 });
  const [selectedFloatIds, setSelectedFloatIds] = useState(fleet.map((f) => f.id));
  const [parameters, setParameters] = useState({
    temp: true,
    psal: true,
    pres: true,
    doxy: true,
    ph: false
  });
  const [dataMode, setDataMode] = useState('both'); // 'R', 'D', 'both'
  const [qcFlags, setQcFlags] = useState({ 1: true, 2: true, 3: false, 4: false });
  const [depthRange, setDepthRange] = useState({ min: 0, max: 500 });
  const [exportFormat, setExportFormat] = useState('netcdf'); // 'netcdf', 'csv', 'json'
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Compute live match metrics
  const matchedFloats = useMemo(() => {
    return fleet.filter((f) => {
      if (!selectedFloatIds.includes(f.id)) return false;
      const lat = f.position?.lat || 0;
      const lon = f.position?.lon || 0;
      if (lat < bbox.minLat || lat > bbox.maxLat || lon < bbox.minLon || lon > bbox.maxLon) return false;
      return true;
    });
  }, [fleet, selectedFloatIds, bbox]);

  const matchedProfilesCount = useMemo(() => {
    return matchedFloats.reduce((acc, f) => {
      const validProfs = (f.profiles || []).filter((p) => {
        if (dataMode !== 'both' && p.dataMode !== dataMode) return false;
        return true;
      });
      return acc + validProfs.length;
    }, 0);
  }, [matchedFloats, dataMode]);

  const matchedLevelsCount = useMemo(() => {
    return matchedFloats.reduce((acc, f) => {
      return acc + (f.profiles || []).reduce((pAcc, p) => {
        if (dataMode !== 'both' && p.dataMode !== dataMode) return pAcc;
        const validLvls = (p.levels || []).filter((lvl) => {
          if (!qcFlags[lvl.qc]) return false;
          if (lvl.pres < depthRange.min || lvl.pres > depthRange.max) return false;
          return true;
        });
        return pAcc + validLvls.length;
      }, 0);
    }, 0);
  }, [matchedFloats, dataMode, qcFlags, depthRange]);

  const estimatedSizeMb = useMemo(() => {
    const bytesPerLevel = exportFormat === 'netcdf' ? 120 : exportFormat === 'csv' ? 65 : 180;
    const totalBytes = matchedLevelsCount * bytesPerLevel + matchedProfilesCount * 2048;
    return (totalBytes / (1024 * 1024)).toFixed(2);
  }, [matchedLevelsCount, matchedProfilesCount, exportFormat]);

  const handleToggleFloat = (id) => {
    setSelectedFloatIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerateExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      let content = '';
      let filename = `polarsense_export_${new Date().toISOString().substring(0, 10)}`;

      if (exportFormat === 'csv') {
        content = generateCSV(matchedFloats);
        filename += '.csv';
      } else if (exportFormat === 'json') {
        content = JSON.stringify(matchedFloats, null, 2);
        filename += '.json';
      } else {
        content = generateNetCDFAscii(matchedFloats);
        filename += '.cdl';
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    }, 400);
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title">Data Selection & Export Engine</h1>
        <p className="text-secondary" style={{ fontSize: '13px', marginTop: '2px' }}>
          Standardized scientific query builder compliant with Euro-Argo and Coriolis NetCDF/CSV distribution specs.
        </p>
      </div>

      <div className="grid-12" style={{ alignItems: 'start' }}>
        {/* Left Column: Serious 2-Column Form (Col 8) */}
        <div className="col-8 panel">
          <div className="panel-header">
            <span className="section-heading" style={{ margin: 0 }}>Scientific Query Criteria</span>
            <span className="text-secondary" style={{ fontSize: '12px' }}>Argo 3.1 Conventions</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* 1. Date Range */}
            <div>
              <label className="form-group-title">Observation Temporal Window</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  style={{ width: '100%' }}
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* 2. Depth Range */}
            <div>
              <label className="form-group-title">Pressure / Depth Envelope (dbar)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="number"
                  value={depthRange.min}
                  min="0"
                  max="500"
                  onChange={(e) => setDepthRange({ ...depthRange, min: Number(e.target.value) })}
                  style={{ width: '80px' }}
                />
                <span className="text-muted">to</span>
                <input
                  type="number"
                  value={depthRange.max}
                  min="0"
                  max="500"
                  onChange={(e) => setDepthRange({ ...depthRange, max: Number(e.target.value) })}
                  style={{ width: '80px' }}
                />
                <span className="text-secondary" style={{ fontSize: '12px' }}>dbar</span>
              </div>
            </div>

            {/* 3. Geographic Bounding Box */}
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-group-title">Geographic Bounding Box (WGS84 Coordinates)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '6px' }}>
                <div>
                  <span className="text-secondary" style={{ fontSize: '10px', display: 'block' }}>MIN LAT</span>
                  <input
                    type="number"
                    value={bbox.minLat}
                    onChange={(e) => setBbox({ ...bbox, minLat: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <span className="text-secondary" style={{ fontSize: '10px', display: 'block' }}>MAX LAT</span>
                  <input
                    type="number"
                    value={bbox.maxLat}
                    onChange={(e) => setBbox({ ...bbox, maxLat: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <span className="text-secondary" style={{ fontSize: '10px', display: 'block' }}>MIN LON</span>
                  <input
                    type="number"
                    value={bbox.minLon}
                    onChange={(e) => setBbox({ ...bbox, minLon: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <span className="text-secondary" style={{ fontSize: '10px', display: 'block' }}>MAX LON</span>
                  <input
                    type="number"
                    value={bbox.maxLon}
                    onChange={(e) => setBbox({ ...bbox, maxLon: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* 4. Float Multi-Select */}
            <div>
              <label className="form-group-title">Target Platform Platforms (WMO)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px', maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '4px' }}>
                {fleet.map((f) => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedFloatIds.includes(f.id)}
                      onChange={() => handleToggleFloat(f.id)}
                    />
                    <span className="text-mono">{f.id} ({f.wmo})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Parameters */}
            <div>
              <label className="form-group-title">Oceanographic Variables</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={parameters.temp}
                    onChange={(e) => setParameters({ ...parameters, temp: e.target.checked })}
                  />
                  <span>In-Situ Temperature (<code>TEMP</code>, °C)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={parameters.psal}
                    onChange={(e) => setParameters({ ...parameters, psal: e.target.checked })}
                  />
                  <span>Practical Salinity (<code>PSAL</code>, PSU)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={parameters.pres}
                    onChange={(e) => setParameters({ ...parameters, pres: e.target.checked })}
                  />
                  <span>Sea Pressure (<code>PRES</code>, dbar)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={parameters.doxy}
                    onChange={(e) => setParameters({ ...parameters, doxy: e.target.checked })}
                  />
                  <span>Dissolved Oxygen (<code>DOXY</code>, µmol/kg)</span>
                </label>
              </div>
            </div>

            {/* 6. Data Mode */}
            <div>
              <label className="form-group-title">Data Processing Mode</label>
              <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="expDataMode"
                    value="both"
                    checked={dataMode === 'both'}
                    onChange={(e) => setDataMode(e.target.value)}
                  />
                  <span>Real-time & Delayed (Both)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="expDataMode"
                    value="D"
                    checked={dataMode === 'D'}
                    onChange={(e) => setDataMode(e.target.value)}
                  />
                  <span>DMQC (D) Only</span>
                </label>
              </div>
            </div>

            {/* 7. QC Flags Filter */}
            <div>
              <label className="form-group-title">QC Flags to Include</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {[1, 2, 3, 4].map((flag) => (
                  <label key={flag} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={qcFlags[flag]}
                      onChange={(e) => setQcFlags({ ...qcFlags, [flag]: e.target.checked })}
                    />
                    <span className="text-mono">QC {flag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Summary & Export Action (Col 4) */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Live Summary Panel */}
          <div className="panel">
            <div className="panel-header">
              <span className="section-heading" style={{ margin: 0 }}>Matching Selection Summary</span>
              <Database size={14} color="var(--accent-teal)" />
            </div>

            <div style={{ padding: '12px', background: '#FAFAF9', borderRadius: '4px', border: '1px solid var(--border-light)', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.8 }}>
              <div>Matching: <strong>{matchedFloats.length}</strong> floats</div>
              <div>Profiles: <strong>{matchedProfilesCount}</strong> profiles</div>
              <div>Levels: <strong>{matchedLevelsCount.toLocaleString()}</strong> levels</div>
              <div style={{ borderTop: '1px solid #CBD5E1', marginTop: '6px', paddingTop: '6px', color: 'var(--accent-teal)', fontWeight: 600 }}>
                Estimated size: {estimatedSizeMb} MB
              </div>
            </div>

            {/* Format Selection */}
            <div style={{ marginTop: '16px' }}>
              <label className="form-group-title">File Export Format</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="netcdf"
                    checked={exportFormat === 'netcdf'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span><strong>Argo NetCDF 3.1</strong> (CF-1.6 Compliant)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span><strong>CSV Table</strong> (Spreadsheet / Pandas)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span><strong>JSON Payload</strong> (GeoJSON API)</span>
                </label>
              </div>
            </div>

            {/* Generate Export Button */}
            <button
              className="btn btn-primary"
              onClick={handleGenerateExport}
              disabled={isExporting || matchedFloats.length === 0}
              style={{ width: '100%', marginTop: '20px', padding: '10px', justifyContent: 'center', fontSize: '14px' }}
            >
              {isExporting ? (
                'Compiling Binary Archive...'
              ) : exportSuccess ? (
                <>
                  <CheckCircle size={16} /> Export Downloaded
                </>
              ) : (
                <>
                  <Download size={16} /> Generate Export Archive
                </>
              )}
            </button>
          </div>

          {/* Citation Block in Bordered Panel */}
          <div className="panel" style={{ background: '#FAFAF9', fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            <span className="section-heading" style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Data Citation Policy</span>
            <p style={{ fontStyle: 'italic', borderLeft: '2px solid var(--accent-teal)', paddingLeft: '10px' }}>
              These data were collected and made freely available by the PolarSense programme. Argo-format files follow the Argo data management conventions.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .form-group-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
