import React from 'react';

export default function StatusPill({ status }) {
  const norm = (status || '').toLowerCase();
  
  if (norm === 'active') {
    return (
      <span className="status-pill status-active">
        <span className="dot-indicator dot-active"></span>
        Active
      </span>
    );
  }
  if (norm === 'under_ice' || norm === 'under ice') {
    return (
      <span className="status-pill status-under-ice">
        <span className="dot-indicator dot-under-ice"></span>
        Under Ice
      </span>
    );
  }
  if (norm === 'silent') {
    return (
      <span className="status-pill status-silent">
        <span className="dot-indicator dot-silent"></span>
        Silent
      </span>
    );
  }
  if (norm === 'recovered') {
    return (
      <span className="status-pill status-recovered">
        <span className="dot-indicator dot-active" style={{ background: 'var(--success-green)' }}></span>
        Recovered
      </span>
    );
  }
  return (
    <span className="status-pill status-fault">
      <span className="dot-indicator dot-fault"></span>
      {status || 'Unknown'}
    </span>
  );
}
