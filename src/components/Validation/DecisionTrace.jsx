import React from 'react';
import { formatDateTime } from '../../utils/formatters';

const DecisionTrace = ({ aiRecommendation, humanDecision, reviewedBy, reviewedAt }) => {
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision Trace</h3>
      
      <div className="space-y-4">
        <div>
          <span className="text-sm font-medium text-gray-700">AI Recommendation: </span>
          <span className="text-sm text-gray-900">{aiRecommendation}</span>
        </div>
        
        <div>
          <span className="text-sm font-medium text-gray-700">Human Decision: </span>
          <span className="text-sm text-gray-900">{humanDecision}</span>
        </div>
        
        <div>
          <span className="text-sm font-medium text-gray-700">Reviewed By: </span>
          <span className="text-sm text-gray-900">{reviewedBy}</span>
        </div>
        
        {reviewedAt && (
          <div className="text-sm text-gray-500 italic">
            Reviewed on {formatDateTime(reviewedAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionTrace;