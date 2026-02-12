import React from 'react';

const RiskFactorCard = ({ title, description, type = 'low' }) => {
  const colors = {
    high: 'bg-red-50 border-red-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-green-50 border-green-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${colors[type]}`}>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-700">{description}</p>
    </div>
  );
};

export default RiskFactorCard;