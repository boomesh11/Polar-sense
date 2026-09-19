import React, { useState } from 'react';
import { X, ShieldCheck, Cpu, Battery, Gauge, Compass, Radio, FileText, AlertTriangle } from 'lucide-react';

export default function SpecModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('baseline');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(26, 39, 51, 0.65)',
        backdropFilter: 'blur(2px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: '#FFFFFF',
          borderRadius: '6px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAFAF9',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-teal)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                PS 26065 · Ministry of Earth Sciences / NCPOR · Team AQUA LEAGUE
              </span>
              <span className="qc-chip qc-1" style={{ fontSize: '10px' }}>v3.0 Baseline</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
              PolarSense Engineering Specification & First Principles
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#FFFFFF', padding: '0 24px' }}>
          {[
            { id: 'baseline', label: 'Controlled Baseline (§07)' },
            { id: 'physics', label: 'Mass, Stroke & Hydraulics (§10–12)' },
            { id: 'ice', label: '3-State Ice Logic (§15–16)' },
            { id: 'power', label: 'Power & 24-Cell Pack (§19–20)' },
            { id: 'telemetry', label: 'SBD & 340B Frame (§23)' },
            { id: 'decisions', label: 'Decisions D1–D3 & Integrity (§35)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '10px 14px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, fontSize: '13px', lineHeight: 1.6 }}>
          {activeTab === 'baseline' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>NORMAL PARK DEPTH</div>
                  <div className="stat-val-large" style={{ fontSize: '22px', marginTop: '2px', color: 'var(--accent-teal)' }}>450 m</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>500 m ceiling post-qual</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>USABLE BUOYANCY STROKE</div>
                  <div className="stat-val-large" style={{ fontSize: '22px', marginTop: '2px', color: 'var(--accent-teal)' }}>650 ml</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>50 ml residual to 700 ml</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>ENERGY PER 10-DAY CYCLE</div>
                  <div className="stat-val-large" style={{ fontSize: '22px', marginTop: '2px', color: 'var(--accent-teal)' }}>5.30 Wh</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>5.40 Wh in blocked cycle</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>MISSION ENDURANCE</div>
                  <div className="stat-val-large" style={{ fontSize: '22px', marginTop: '2px', color: 'var(--success-green)' }}>3.5 yr</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>3.95–4.47 yr computed</div>
                </div>
              </div>

              <span className="section-heading">Master Baseline Parameters (v3.0 Controlled Specification)</span>
              <table className="data-table" style={{ marginTop: '8px' }}>
                <thead>
                  <tr>
                    <th>Subsystem Item</th>
                    <th>Specification Value</th>
                    <th>Class</th>
                    <th>Physical Rationale / Verification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Pressure Hull</strong></td>
                    <td className="text-mono">1300 mm × 160 mm OD, 8 mm wall</td>
                    <td><span className="qc-chip qc-2">ALLOCATED</span></td>
                    <td>6061-T6 seamless aluminum, σ=48 MPa hoop stress, buckling factor 3.0</td>
                  </tr>
                  <tr>
                    <td><strong>Target Assembled Mass</strong></td>
                    <td className="text-mono">27.549 kg @ 1.027 kg/L</td>
                    <td><span className="qc-chip qc-1">DERIVED</span></td>
                    <td>Neutral mass at 26.825 L mid-stroke; includes 2.049 kg adjustable steel ballast</td>
                  </tr>
                  <tr>
                    <td><strong>Battery Pack Architecture</strong></td>
                    <td className="text-mono">24 × Li-SOCl₂ D cells (3S8P)</td>
                    <td><span className="qc-chip qc-2">ALLOCATED</span></td>
                    <td>10.8 V nom, 104 Ah, 1123.2 Wh nameplate, 918.7 Wh usable post cold/reserve</td>
                  </tr>
                  <tr>
                    <td><strong>Protected Reserve</strong></td>
                    <td className="text-mono">36 Wh held back</td>
                    <td><span className="qc-chip qc-1">DERIVED</span></td>
                    <td>2 recovery attempts (16 Wh) + 60d wait (1 Wh) + locating (4 Wh) + margin</td>
                  </tr>
                  <tr>
                    <td><strong>Reference Seawater Density</strong></td>
                    <td className="text-mono">1.027 kg/L (range 1.024–1.031)</td>
                    <td><span className="qc-chip qc-2">ALLOCATED</span></td>
                    <td>Southern Ocean offshore Prydz Bay baseline; mandatory pre-deployment trim (D1)</td>
                  </tr>
                  <tr>
                    <td><strong>Ice-Risk Approach Window</strong></td>
                    <td className="text-mono">50 m depth initiation, 6 m abort target</td>
                    <td><span className="qc-chip qc-3">TARGET</span></td>
                    <td>Slowing at 50m, 2-range acoustics (2–60 m and 0.05–5 m overlap), 10 clear pings</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '16px', background: '#FFFBEB', border: '1px solid #FCD34D', padding: '10px 14px', borderRadius: '4px', fontSize: '12px', color: '#92400E' }}>
                <strong>The Coupling Rule (§07):</strong> Any change to mass, volume, stroke, energy or depth invalidates §10, §11 and §20 together. Recompute all three, or change none of them.
              </div>
            </div>
          )}

          {activeTab === 'physics' && (
            <div>
              <span className="section-heading">Buoyancy Balance & Stroke Sizing (§09, §11)</span>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Archimedes balance equation: <code>Buoyancy = water_density × displaced_volume − total_mass</code>. Cold polar water density is 1.027 kg/L. At mid-stroke (26.825 L), neutral mass is precisely 27.549 kg.
              </p>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component Assembly</th>
                    <th>Mass (kg)</th>
                    <th>Displaced Vol (L)</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>6061-T6 Hull, End Caps, Joint Metal</td>
                    <td className="text-mono">15.000</td>
                    <td className="text-mono">25.070</td>
                    <td>54% of total mass budget; 13.33 kg ideal shell + joints</td>
                  </tr>
                  <tr>
                    <td>24-Cell 3S8P Battery Pack & Mount</td>
                    <td className="text-mono">3.200</td>
                    <td className="text-mono">—</td>
                    <td>Upgraded from 9 cells (+2.00 kg taken directly out of ballast)</td>
                  </tr>
                  <tr>
                    <td>Pump, Valves & Internal Reservoir</td>
                    <td className="text-mono">1.700</td>
                    <td className="text-mono">—</td>
                    <td>Bi-stable latching valve draws 0 mA in park state</td>
                  </tr>
                  <tr>
                    <td>Hydraulic Oil (Lines & Residual)</td>
                    <td className="text-mono">1.100</td>
                    <td className="text-mono">0.050</td>
                    <td>≈ 1.22 L at 0.90 kg/L density; cold-viscosity rated to −2 °C</td>
                  </tr>
                  <tr>
                    <td>Core CTD Sensor Head</td>
                    <td className="text-mono">0.800</td>
                    <td className="text-mono">0.600</td>
                    <td>RBRlegato4 / SBE-41CP standard sampling configuration</td>
                  </tr>
                  <tr>
                    <td>Dual Acoustic Transducers & Boards</td>
                    <td className="text-mono">0.800</td>
                    <td className="text-mono">0.250</td>
                    <td>Long-range (2–60m) and short-range (0.05–5m) transducers</td>
                  </tr>
                  <tr>
                    <td>Antenna Mast, GNSS, Radio & Weather</td>
                    <td className="text-mono">0.700</td>
                    <td className="text-mono">0.200</td>
                    <td>250 mm narrow mast providing ≥150 mm antenna freeboard</td>
                  </tr>
                  <tr>
                    <td>Bladder, Guard, Penetrators, Electronics</td>
                    <td className="text-mono">2.200</td>
                    <td className="text-mono">0.330</td>
                    <td>Wiring, coatings, controller and desiccant packs</td>
                  </tr>
                  <tr style={{ background: '#F8FAFC', fontWeight: 600 }}>
                    <td>Adjustable Internal Steel Ballast</td>
                    <td className="text-mono">2.049</td>
                    <td className="text-mono">—</td>
                    <td>Trim range for site density (261 ml steel; replaces lead)</td>
                  </tr>
                  <tr style={{ background: '#EBF7F9', fontWeight: 700 }}>
                    <td>Total Assembled Baseline</td>
                    <td className="text-mono">27.549 kg</td>
                    <td className="text-mono">26.500 L (min)</td>
                    <td>Usable stroke: 650 ml (span: 354 ml neutral + 200 ml auth + 101 ml spare)</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>Working Authority:</strong> 100 g net buoyancy per side drives ascent at 0.18–0.31 m/s, safely covering the 0.08 m/s deep target and ≤0.05 m/s near-surface speed without wasting stroke volume.
              </div>
            </div>
          )}

          {activeTab === 'ice' && (
            <div>
              <span className="section-heading">Three-State Ice-Risk Decision Logic (§15, §16)</span>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
                A sound reflection proves only an acoustic boundary; absence of an echo is never proof of open water. PolarSense enforces an asymmetric three-state decision engine:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '14px', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, color: '#B91C1C', fontSize: '13px' }}>1. BLOCKED</div>
                  <p style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '6px' }}>
                    Thermal veto (T within 0.5 °C of freezing point in 20–50 m layer) OR qualified sonar obstruction within 6 m abort clearance.
                  </p>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#991B1B', marginTop: '8px' }}>Action: Stop ascent, persist evidence, sink back to park.</div>
                </div>

                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '14px', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, color: '#D97706', fontSize: '13px' }}>2. UNKNOWN</div>
                  <p style={{ fontSize: '12px', color: '#92400E', marginTop: '6px' }}>
                    Missing echoes, excess tilt (&gt;10°), acoustic/pressure disagreement, or poor SNR. First-class result, never assumed clear.
                  </p>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#B45309', marginTop: '8px' }}>Action: Treated as BLOCKED during normal operations.</div>
                </div>

                <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', padding: '14px', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, color: '#065F46', fontSize: '13px' }}>3. CLEAR (Within Limits)</div>
                  <p style={{ fontSize: '12px', color: '#064E3B', marginTop: '6px' }}>
                    No thermal veto AND 10 consecutive valid clear acoustic returns from dual channels (2–60m and 0.05–5m overlap).
                  </p>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#047857', marginTop: '8px' }}>Action: Permits next controlled 1 m step (never surfacing at once).</div>
                </div>
              </div>

              <span className="section-heading">Four Separate Error Counts (§15.4)</span>
              <table className="data-table" style={{ marginTop: '8px' }}>
                <thead>
                  <tr>
                    <th>Metric Count</th>
                    <th>Target Standard</th>
                    <th>Significance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Correct Decisions</strong></td>
                    <td className="text-mono">Baseline tracker</td>
                    <td>Tracks general agreement against labelled oceanographic test cases</td>
                  </tr>
                  <tr>
                    <td><strong>Unsafe Clears</strong></td>
                    <td className="text-mono" style={{ color: '#B91C1C', fontWeight: 700 }}>MUST BE STRICTLY 0</td>
                    <td>The single error that destroys the float by surfacing into ice. One error ends the mission.</td>
                  </tr>
                  <tr>
                    <td><strong>False Stops</strong></td>
                    <td className="text-mono">&lt; 15% rate</td>
                    <td>Safely aborts ascent in cold open water; profile saved in flash for next cycle.</td>
                  </tr>
                  <tr>
                    <td><strong>Unknowns</strong></td>
                    <td className="text-mono">Non-zero (Honest)</td>
                    <td>A method claiming zero unknowns hides edge cases. Reported openly.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'power' && (
            <div>
              <span className="section-heading">Power Architecture & 24-Cell Energy Budget (§19, §20)</span>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Primary pack uses 24 × Li-SOCl₂ D cells in 3S8P configuration (10.8 V nominal, 104 Ah, 1,123.2 Wh nameplate). At 85% cold derating (−2 °C) minus 36 Wh reserve, <strong>918.7 Wh</strong> is usable.
              </p>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subsystem Load</th>
                    <th>Open Cycle (Wh)</th>
                    <th>Share (%)</th>
                    <th>Technical Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Buoyancy Hydraulic Pump</td>
                    <td className="text-mono">2.80 Wh</td>
                    <td>53%</td>
                    <td>Moving 650 ml against 51 bar; buck-boost regulator; latching return valve</td>
                  </tr>
                  <tr>
                    <td>GNSS & Iridium SBD Telemetry</td>
                    <td className="text-mono">1.20 Wh</td>
                    <td>23%</td>
                    <td>20-min surface cap; SIM-less 9603 modem on dedicated 5V 2A rail</td>
                  </tr>
                  <tr>
                    <td>CTD & Controller Ascent Recording</td>
                    <td className="text-mono">0.60 Wh</td>
                    <td>11%</td>
                    <td>1 Hz sample rate for 3 hr ascent; load switch cuts sensor power completely when idle</td>
                  </tr>
                  <tr>
                    <td>Upward Acoustic Sonar Pings</td>
                    <td className="text-mono">0.25 Wh</td>
                    <td>5%</td>
                    <td>Pulsed 200 kHz inspection in upper 50 m layer</td>
                  </tr>
                  <tr>
                    <td>Park Sleep & Health Watchdog</td>
                    <td className="text-mono">0.15 Wh</td>
                    <td>3%</td>
                    <td>35 nA hardware nano-watchdog; sleeping controller draws 1–2 µA (58 µA total)</td>
                  </tr>
                  <tr>
                    <td>Descent Control & Valve Actuation</td>
                    <td className="text-mono">0.10 Wh</td>
                    <td>2%</td>
                    <td>Bi-stable latching valve draws current only during 50 ms transition pulse</td>
                  </tr>
                  <tr>
                    <td>Other Small Loads & Sensor Overhead</td>
                    <td className="text-mono">0.20 Wh</td>
                    <td>4%</td>
                    <td>Leak detector (1 µA continuous), RTC, and power supply quiescent losses</td>
                  </tr>
                  <tr style={{ background: '#EBF7F9', fontWeight: 700 }}>
                    <td>Total 10-Day Cycle Planning Ceiling</td>
                    <td className="text-mono">5.30 Wh</td>
                    <td>100%</td>
                    <td>Endurance: 4.47 yr open water (163 cycles) · 4.19 yr seasonal · 3.95 yr severe ice</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '16px', background: '#F8FAFC', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px' }}>
                <strong>No Recharging Stated Honestly (§18.4):</strong> Solar (polar winter darkness &gt;99.8% submerged), thermal harvesting (Southern Ocean 500m ΔT &lt; 2 °C), and current turbines (float drifts with current) are physically unviable. Energy conservation is the entire design.
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div>
              <span className="section-heading">Satellite Telemetry & 340-Byte SBD Frame Encoding (§23)</span>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Polar ocean communications rely on the 66-satellite Iridium LEO constellation (the only network covering &gt;60°S). A full 500 m profile is 4,224 bytes, divided into 15 science chunks + 1 health message.
              </p>

              <div style={{ background: '#1A2733', color: '#E2E8F0', padding: '16px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '16px' }}>
                <div style={{ color: '#38BDF8', fontWeight: 700, marginBottom: '6px' }}>340-BYTE IRIDIUM SBD ENVELOPE STRUCTURE:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#0F172A', padding: '8px', borderRadius: '3px' }}>
                    <div style={{ color: '#38BDF8' }}>Header (24 Bytes)</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>Version, MsgType, FloatID, CycleID, ChunkIndex/Count, SeqNo</div>
                  </div>
                  <div style={{ background: '#0F172A', padding: '8px', borderRadius: '3px' }}>
                    <div style={{ color: '#4ADE80' }}>Data Payload (300 Bytes)</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>Up to 37 levels × 8B per level or packed engineering health</div>
                  </div>
                  <div style={{ background: '#0F172A', padding: '8px', borderRadius: '3px' }}>
                    <div style={{ color: '#FCD34D' }}>CRC32 (4 Bytes)</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>Detects bit flips and channel transmission corruption</div>
                  </div>
                  <div style={{ background: '#0F172A', padding: '8px', borderRadius: '3px' }}>
                    <div style={{ color: '#F87171' }}>HMAC Tag (12 Bytes)</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>HMAC-SHA256 authenticated ground station security</div>
                  </div>
                </div>
              </div>

              <span className="section-heading">8-Byte Physical Level Encoding Format (§23.2)</span>
              <table className="data-table" style={{ marginTop: '8px' }}>
                <thead>
                  <tr>
                    <th>Parameter Field</th>
                    <th>Binary Encoding</th>
                    <th>Resolution</th>
                    <th>Max Rounding Error</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sea Pressure (<code>PRES</code>)</td>
                    <td className="text-mono">2 bytes unsigned</td>
                    <td className="text-mono">0.1 dbar</td>
                    <td>0.05 dbar</td>
                  </tr>
                  <tr>
                    <td>In-Situ Temperature (<code>TEMP</code>)</td>
                    <td className="text-mono">2 bytes signed</td>
                    <td className="text-mono">0.001 °C</td>
                    <td>0.0005 °C</td>
                  </tr>
                  <tr>
                    <td>Practical Salinity (<code>PSAL</code>)</td>
                    <td className="text-mono">2 bytes unsigned</td>
                    <td className="text-mono">0.001 PSU</td>
                    <td>0.0005 PSU</td>
                  </tr>
                  <tr>
                    <td>Quality Control Flags (<code>QC</code>)</td>
                    <td className="text-mono">2 bytes</td>
                    <td className="text-mono">4-bit P, 4-bit T, 4-bit S, 4-bit res</td>
                    <td>Lossless discrete flags</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'decisions' && (
            <div>
              <span className="section-heading">Three Binding Design Decisions (§00) & Retired Claims (§35)</span>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
                PolarSense v3.0 explicitly documents all corrections and design decisions so no critical assumptions are buried:
              </p>

              <table className="data-table" style={{ marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th>Decision</th>
                    <th>Core Requirement</th>
                    <th>Consequence if Ignored</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>D1: Site Ballast Trim</strong></td>
                    <td>Establish site density before launch from CTD cast and adjust internal steel ballast</td>
                    <td>Stroke requirement rises to ~800 ml; pump energy rises 23%; endurance drops ~8 months</td>
                  </tr>
                  <tr>
                    <td><strong>D2: Cost-Reduction Path</strong></td>
                    <td>Pursue Tier B component sourcing (Rs 5.0–9.0 lakh) vs imported reference (Rs 22 lakh)</td>
                    <td>Without written vendor quotes, drop "low cost" framing and compete on endurance-per-rupee alone</td>
                  </tr>
                  <tr>
                    <td><strong>D3: Salinity Drift Budget</strong></td>
                    <td>Formal agreement on 4-year conductivity drift budget and delayed-mode correction (DMQC)</td>
                    <td>Endurance without a drift answer is simply a higher volume of decreasingly trustworthy data</td>
                  </tr>
                </tbody>
              </table>

              <span className="section-heading">Explicitly Retired Claims (§35.2)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
                  <span style={{ color: '#B91C1C', fontWeight: 600 }}>❌ "World First" in upward sonar:</span>
                  <div style={{ color: '#475569', marginTop: '2px' }}>NAOS / Pro-Ice used upward 200 kHz sonar earlier. PolarSense innovates on uncertainty handling.</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
                  <span style={{ color: '#B91C1C', fontWeight: 600 }}>❌ "2.6 km under-ice accuracy":</span>
                  <div style={{ color: '#475569', marginTop: '2px' }}>Published result for someone else's method on different data. Replaced by cycle displacement integration.</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
                  <span style={{ color: '#B91C1C', fontWeight: 600 }}>❌ "4.4 years on 9 cells":</span>
                  <div style={{ color: '#475569', marginTop: '2px' }}>Belonged to an inaccurate 300 ml stroke model. Real 3.5+ year endurance requires the 24-cell 3S8P pack.</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
                  <span style={{ color: '#B91C1C', fontWeight: 600 }}>❌ "Twelve parameters":</span>
                  <div style={{ color: '#475569', marginTop: '2px' }}>Counted calculated variables as separate sensors. Core CTD measures Conductivity, Temperature, and Pressure directly.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-color)',
            background: '#FAFAF9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Reference: <em>PolarSense Complete Project Specification v3.0 (Smart India Hackathon 2026, PS 26065)</em>
          </span>
          <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '12px' }}>
            Close Specification Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
