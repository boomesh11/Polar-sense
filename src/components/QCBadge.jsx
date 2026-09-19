import React from 'react';
import { QC_FLAGS } from '../data/oceanography';

export default function QCBadge({ flag, showLabel = false }) {
  const qc = QC_FLAGS[flag] || { label: 'Unknown', className: 'qc-4' };
  return (
    <span className={`qc-chip ${qc.className}`} title={`QC ${flag}: ${qc.desc}`}>
      QC {flag} {showLabel && `(${qc.label})`}
    </span>
  );
}
