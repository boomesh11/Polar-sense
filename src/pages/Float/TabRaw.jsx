import React, { useState } from 'react';
import { generateRawPayload, formatHexDump, generateCSV, generateNetCDFAscii } from '../../data/oceanography';
import QCBadge from '../../components/QCBadge';
import { Download, FileText, Code2, Check } from 'lucide-react';

export default function TabRaw({ float }) {
  const profiles = float?.profiles || [];
  const [selectedCycle, setSelectedCycle] = useState(profiles[0]?.cycle || 1);
  const [copied, setCopied] = useState(false);

  const currentProfile = profiles.find((p) => p.cycle === selectedCycle) || profiles[0];
  const hexPayload = generateRawPayload(float.id, currentProfile?.cycle || 1);
  const formattedHex = formatHexDump(hexPayload);

  // File download triggers
  const handleDownloadCSV = () => {
    const csvContent = generateCSV([float]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${float.id}_${float.wmo}_cycle_${selectedCycle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadNetCDF = () => {
    const netcdfContent = generateNetCDFAscii([float]);
    const blob = new Blob([netcdfContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nodc_${float.wmo}_prof_${selectedCycle}.cdl`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(hexPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tab-raw">
      {/* Action Bar & Cycle Selector */}
      <div className="panel" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="section-heading" style={{ margin: 0 }}>Telemetry Packet Inspector</span>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(Number(e.target.value))}
            style={{ fontSize: '12px' }}
          >
            {profiles.map((p) => (
              <option key={p.cycle} value={p.cycle}>
                Cycle #{p.cycle} ({p.levels?.length || 0} levels, {p.aborted ? 'Aborted' : 'Nominal'})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={handleDownloadCSV}>
            <Download size={14} color="var(--accent-teal)" />
            Download CSV
          </button>
          <button className="btn btn-primary" onClick={handleDownloadNetCDF}>
            <FileText size={14} />
            Download NetCDF (Argo 3.1)
          </button>
        </div>
      </div>

      {/* Raw 340-byte Hex Dump Panel */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div>
            <span className="section-heading" style={{ margin: 0 }}>Raw Iridium SBD Telemetry Frame (340 Bytes, §23.3)</span>
            <div className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
              Standard SIM-less Iridium 9603 SBD uplink envelope · 340 B uplink max · 270 B downlink max
            </div>
          </div>
          <button className="btn" onClick={handleCopyHex} style={{ fontSize: '11px', padding: '4px 8px' }}>
            {copied ? <Check size={12} color="var(--success-green)" /> : <Code2 size={12} />}
            {copied ? 'Copied Hex' : 'Copy Hex Payload'}
          </button>
        </div>

        {/* 340-byte Frame Envelope Visualizer */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 120px', gap: '8px', marginBottom: '12px', fontSize: '11px' }}>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 8px', borderRadius: '3px' }}>
            <div style={{ fontWeight: 600, color: '#1D4ED8' }}>Header (24 B)</div>
            <div style={{ color: '#64748B', fontSize: '10px' }}>Format, ID, SeqNo</div>
          </div>
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 8px', borderRadius: '3px' }}>
            <div style={{ fontWeight: 600, color: '#047857' }}>Science / Health Payload (300 B)</div>
            <div style={{ color: '#64748B', fontSize: '10px' }}>Up to 37 levels × 8 B per level (P, T, S, QC)</div>
          </div>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 8px', borderRadius: '3px' }}>
            <div style={{ fontWeight: 600, color: '#B45309' }}>CRC32 (4 B)</div>
            <div style={{ color: '#64748B', fontSize: '10px' }}>Bitflip check</div>
          </div>
          <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', padding: '6px 8px', borderRadius: '3px' }}>
            <div style={{ fontWeight: 600, color: '#BE185D' }}>Auth Tag (12 B)</div>
            <div style={{ color: '#64748B', fontSize: '10px' }}>HMAC-SHA256</div>
          </div>
        </div>

        <div className="hex-dump">{formattedHex}</div>
      </div>

      {/* Decoded Level Measurements Table */}
      <div className="panel">
        <div className="panel-header">
          <span className="section-heading" style={{ margin: 0 }}>Decoded Physical Levels</span>
          <span className="text-secondary text-mono" style={{ fontSize: '11px' }}>
            {currentProfile?.levels?.length || 0} vertical sample points
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Pressure (dbar)</th>
                <th>Temperature (°C)</th>
                <th>Salinity (PSU)</th>
                <th>Dissolved O₂ (µmol/kg)</th>
                <th>QC Status</th>
                <th>Sensor Status</th>
              </tr>
            </thead>
            <tbody>
              {(currentProfile?.levels || []).map((lvl, idx) => (
                <tr key={idx}>
                  <td className="text-mono">#{idx + 1}</td>
                  <td className="text-mono"><strong>{lvl.pres.toFixed(1)}</strong></td>
                  <td className="text-mono" style={{ color: 'var(--chart-temp)' }}>{lvl.temp.toFixed(2)}</td>
                  <td className="text-mono" style={{ color: 'var(--chart-sal)' }}>{lvl.psal.toFixed(2)}</td>
                  <td className="text-mono" style={{ color: 'var(--chart-oxy)' }}>{lvl.doxy ? lvl.doxy.toFixed(1) : '—'}</td>
                  <td>
                    <QCBadge flag={lvl.qc} showLabel={true} />
                  </td>
                  <td>
                    <span className="text-secondary" style={{ fontSize: '11px' }}>
                      {lvl.qc === 1 ? 'Nominal calibration' : lvl.qc === 2 ? 'Interpolated drift' : 'Flagged by spike test'}
                    </span>
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
