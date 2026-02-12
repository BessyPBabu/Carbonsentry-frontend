import React from 'react';
import { RISK_COLORS } from '../../services/constants';

const RiskBadge = ({ level }) => {
  const config = RISK_COLORS[level] || RISK_COLORS.medium;

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default RiskBadge;