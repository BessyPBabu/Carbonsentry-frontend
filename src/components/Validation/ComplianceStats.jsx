import React from 'react';

const ComplianceStats = ({ stats }) => {
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-4">Compliance Status</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Documents Valid:</span>
          <span className="font-semibold text-gray-900">{stats.documents_valid || 0}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Expired / Missing:</span>
          <span className="font-semibold text-gray-900">{stats.expired_missing || 0}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">AI Confidence Avg:</span>
          <span className="font-semibold text-gray-900">
            {stats.ai_confidence_avg ? `${parseFloat(stats.ai_confidence_avg).toFixed(0)}%` : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ComplianceStats;