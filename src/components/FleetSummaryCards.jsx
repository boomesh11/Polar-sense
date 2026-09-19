import React from 'react';
import { useFleet } from '../context/FleetContext';

const CARDS = [
  {
    key: 'active',
    label: 'Active Floats',
    getValue: (ctx) => ctx.activeCount,
    color: '#0E7C8B',
    bg: '#EBF7F9',
    border: '#B5E4EA',
    desc: 'Transmitting / GPS fix',
  },
  {
    key: 'under_ice',
    label: 'Under Ice',
    getValue: (ctx) => ctx.underIceCount,
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FCD34D',
    desc: 'Acoustic / dead-reckoned',
  },
  {
    key: 'silent',
    label: 'Silent',
    getValue: (ctx) => ctx.silentCount,
    color: '#5A6B78',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    desc: '> 30 days no contact',
  },
  {
    key: 'recovered',
    label: 'Recovered',
    getValue: (ctx) => ctx.recoveredCount,
    color: '#1E7A4D',
    bg: '#ECFDF5',
    border: '#6EE7B7',
    desc: 'DMQC complete',
  },
  {
    key: 'profiles',
    label: 'Total Profiles',
    getValue: (ctx) => ctx.totalProfiles,
    color: '#3B5EA6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    desc: 'Across all missions',
  },
  {
    key: 'sync',
    label: 'Last Network Sync',
    getValue: (ctx) =>
      ctx.lastNetworkUpdate
        ? ctx.lastNetworkUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '—',
    color: '#6B21A8',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    desc: '15 s refresh cadence',
    isText: true,
  },
];

export default function FleetSummaryCards() {
  const ctx = useFleet();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
      }}
    >
      {CARDS.map((card) => {
        const value = card.getValue(ctx);
        return (
          <div
            key={card.key}
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: 4,
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: card.color,
              }}
            >
              {card.label}
            </span>
            <span
              style={{
                fontSize: card.isText ? 18 : 28,
                fontWeight: 600,
                color: card.color,
                lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: card.isText ? 'var(--font-mono)' : undefined,
                letterSpacing: card.isText ? '0.03em' : undefined,
              }}
            >
              {value}
            </span>
            <span style={{ fontSize: 11, color: '#5A6B78' }}>{card.desc}</span>
          </div>
        );
      })}
    </div>
  );
}
