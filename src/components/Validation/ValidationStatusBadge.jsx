import React from 'react';

const ValidationStatusBadge = ({ status, currentStep }) => {
  const configs = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    requires_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Needs Review' }
  };

  const config = configs[status] || configs.pending;

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
      {status === 'processing' && currentStep && (
        <span className="text-xs text-gray-500">
          {currentStep.replace(/_/g, ' ')}
        </span>
      )}
    </div>
  );
};

export default ValidationStatusBadge;