import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import StatusPill from '../../components/StatusPill';

import TabOverview from './TabOverview';
import TabTrajectory from './TabTrajectory';
import TabProfileTrend from './TabProfileTrend';
import TabOverlay from './TabOverlay';
import TabTSDiagram from './TabTSDiagram';
import TabRaw from './TabRaw';
import { ChevronRight, Calendar, Compass, Battery, RefreshCw } from 'lucide-react';

export default function FloatPage() {
  const { id } = useParams();
  const { fleet, getFloatById } = useFleet();
  const [activeTab, setActiveTab] = useState('ts'); // Start on T-S or Overview

  const float = getFloatById(id) || fleet[0];

  if (!float) {
    return (
      <div className="main-content">
        <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--error-red)' }}>Float Not Found</h2>
          <p className="text-secondary" style={{ marginTop: '8px' }}>
            Instrument identifier "{id}" does not exist in the PolarSense active registry.
          </p>
          <Link to="/fleet" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Return to Fleet Map
          </Link>
        </div>
      </div>
    );
  }

  // Calculate days deployed
  const deployedDate = new Date(float.deployed);
  const now = new Date();
  const daysDeployed = Math.floor((now - deployedDate) / (1000 * 60 * 60 * 24));

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'trajectory', label: 'Trajectory' },
    { id: 'profile', label: 'Profile & Trend' },
    { id: 'overlay', label: 'Overlay' },
    { id: 'ts', label: 'T-S Diagram' },
    { id: 'raw', label: 'Raw' }
  ];

  return (
    <div className="main-content">
      {/* Breadcrumb / Float Switcher Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <Link to="/fleet" style={{ color: 'var(--accent-teal)', textDecoration: 'none' }}>Fleet</Link>
          <ChevronRight size={12} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{float.id}</span>
          <span className="text-mono text-muted">({float.wmo})</span>
        </div>

        {/* Quick float selector */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {fleet.map((f) => (
            <Link
              key={f.id}
              to={`/float/${f.id}`}
              style={{
                textDecoration: 'none',
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: f.id === float.id ? 700 : 400,
                background: f.id === float.id ? 'var(--accent-teal)' : '#FFFFFF',
                color: f.id === float.id ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {f.id}
            </Link>
          ))}
        </div>
      </div>

      {/* Header Block (Spans full width, white panel) */}
      <div className="panel" style={{ marginBottom: '20px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          {/* Left: Float ID large, WMO number in monospace beneath */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {float.id}
              </h1>
              <StatusPill status={float.status} />
            </div>
            <div className="text-mono text-secondary" style={{ fontSize: '13px', marginTop: '3px' }}>
              WMO {float.wmo} · SBE-41CP CTD #8842
            </div>
          </div>

          {/* Centre: Four stat readouts */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div>
              <div className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cycles Completed
              </div>
              <div className="stat-val-large tabular-nums">
                {float.cyclesCompleted}
              </div>
            </div>

            <div>
              <div className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Last Depth
              </div>
              <div className="stat-val-large tabular-nums">
                {float.currentDepth?.toFixed(0) || '498'}<span className="stat-unit">m</span>
              </div>
            </div>

            <div>
              <div className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Battery Pack
              </div>
              <div className="stat-val-large tabular-nums" style={{ color: float.battery < 40 ? 'var(--alert-amber)' : 'var(--text-primary)' }}>
                {float.battery}<span className="stat-unit">%</span>
              </div>
            </div>

            <div>
              <div className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Days Deployed
              </div>
              <div className="stat-val-large tabular-nums">
                {daysDeployed}<span className="stat-unit">d</span>
              </div>
            </div>
          </div>

          {/* Right: Region & Deployment Info */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {float.region}
            </div>
            <div className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
              Deployed {new Date(float.deployed).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-mono text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
              Lat {float.position?.lat.toFixed(2)}°, Lon {float.position?.lon.toFixed(2)}°
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar (Underline style, not boxed) */}
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab View */}
      {activeTab === 'overview' && <TabOverview float={float} />}
      {activeTab === 'trajectory' && <TabTrajectory float={float} />}
      {activeTab === 'profile' && <TabProfileTrend float={float} />}
      {activeTab === 'overlay' && <TabOverlay float={float} />}
      {activeTab === 'ts' && <TabTSDiagram float={float} />}
      {activeTab === 'raw' && <TabRaw float={float} />}
    </div>
  );
}
