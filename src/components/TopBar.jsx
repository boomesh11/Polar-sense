import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFleet } from '../context/FleetContext';
import { Radio, Activity } from 'lucide-react';

export default function TopBar() {
  const { activeCount, underIceCount, uplinks } = useFleet();

  const lastUplink = uplinks[0];
  const lastUplinkText = lastUplink
    ? `Uplink ${lastUplink.floatId} (${new Date(lastUplink.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`
    : 'Uplink nominal';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-logo">
          <span className="brand-title">PolarSense</span>
          <span className="brand-sep">|</span>
          <span className="brand-sub">Ground Station</span>
        </div>
      </div>

      <nav className="topbar-nav">
        <NavLink to="/fleet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Fleet
        </NavLink>
        <NavLink to="/float/PS-001" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Float
        </NavLink>
        <NavLink to="/profiles" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Profiles
        </NavLink>
        <NavLink to="/export" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Export
        </NavLink>
        <NavLink to="/network" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Network
        </NavLink>
        <NavLink to="/api" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          API
        </NavLink>
      </nav>

      <div className="topbar-right">
        <div className="status-cluster tabular-nums">
          <span className="cluster-item">
            <span className="cluster-dot dot-active"></span>
            <strong>{activeCount}</strong> active
          </span>
          <span className="cluster-divider">·</span>
          <span className="cluster-item">
            <span className="cluster-dot dot-under-ice"></span>
            <strong>{underIceCount}</strong> under ice
          </span>
          <span className="cluster-divider">·</span>
          <span className="cluster-item text-secondary text-mono" title="Latest satellite telemetry reception">
            <Radio size={12} className="icon-pulse" style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px', color: 'var(--accent-teal)' }} />
            {lastUplinkText}
          </span>
        </div>
      </div>

      <style>{`
        .topbar {
          height: 52px;
          background: #FFFFFF;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .topbar-left {
          display: flex;
          align-items: center;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .brand-sep {
          color: var(--border-color);
          font-weight: 300;
        }
        .brand-sub {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 400;
        }
        .topbar-nav {
          display: flex;
          gap: 32px;
          height: 52px;
        }
        .nav-link {
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          height: 52px;
          position: relative;
          border-bottom: 2px solid transparent;
          transition: color 0.15s;
        }
        .nav-link:hover {
          color: var(--text-primary);
        }
        .nav-link.active {
          color: var(--accent-teal);
          font-weight: 600;
          border-bottom: 2px solid var(--accent-teal);
        }
        .topbar-right {
          display: flex;
          align-items: center;
        }
        .status-cluster {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-primary);
        }
        .cluster-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cluster-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .cluster-divider {
          color: #CBD5E1;
        }
        .icon-pulse {
          animation: pulse 2s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
      `}</style>
    </header>
  );
}
