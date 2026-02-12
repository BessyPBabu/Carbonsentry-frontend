import React from 'react';

const RiskScoreCard = ({ score, maxScore = 5, subtitle }) => {
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Overall Risk Score</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-gray-900">
          {parseFloat(score).toFixed(1)}
        </span>
        <span className="text-2xl text-gray-400">/ {maxScore}</span>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
};

export default RiskScoreCard;