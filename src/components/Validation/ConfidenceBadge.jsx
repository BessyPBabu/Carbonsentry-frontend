import React from 'react';

const ConfidenceBadge = ({ confidence }) => {
  const value = parseFloat(confidence);
  
  const getColor = () => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <span className={`font-semibold ${getColor()}`}>
      {value.toFixed(0)}%
    </span>
  );
};

export default ConfidenceBadge;