import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { validationService } from '../../../services/validationService';
import ValidationStatusBadge from '../../../components/Validation/ValidationStatusBadge';
import ConfidenceBadge from '../../../components/Validation/ConfidenceBadge';

const ValidationDetails = () => {
  const { validationId } = useParams();
  const [validation, setValidation] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [validationId]);

  const fetchData = async () => {
    try {
      const [validationData, logsData] = await Promise.all([
        validationService.getValidationDetails(validationId),
        validationService.getAuditLogs(validationId)
      ]);
      
      setValidation(validationData);
      setAuditLogs(logsData);
    } catch (error) {
      console.error('Error fetching validation details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!validation) return <div className="p-8 text-center">Validation not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Validation Details</h1>
        <p className="text-gray-600 mt-1">
          {validation.vendor_name} - {validation.document_name}
        </p>
      </div>

      {/* Status Overview */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <ValidationStatusBadge 
              status={validation.status} 
              currentStep={validation.current_step}
            />
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Overall Confidence</div>
            {validation.overall_confidence ? (
              <ConfidenceBadge confidence={validation.overall_confidence} />
            ) : (
              <span className="text-gray-400">Pending</span>
            )}
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Processing Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {validation.total_processing_time_seconds 
                ? `${validation.total_processing_time_seconds}s`
                : 'In progress'
              }
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Manual Review</div>
            <div className="text-lg font-semibold">
              {validation.requires_manual_review ? (
                <span className="text-yellow-600">Required</span>
              ) : (
                <span className="text-green-600">Not Required</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Steps */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Steps</h3>
        
        <div className="space-y-4">
          {/* Readability */}
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">Readability Check</div>
                <div className="text-sm text-gray-600 mt-1">
                  {validation.readability_passed ? 'Passed' : 'Failed'}
                  {validation.readability_score && ` - Score: ${validation.readability_score}%`}
                </div>
                {validation.readability_issues?.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600">
                    {validation.readability_issues.map((issue, idx) => (
                      <li key={idx}>• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Relevance */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="font-medium text-gray-900">Relevance Classification</div>
            <div className="text-sm text-gray-600 mt-1">
              {validation.is_relevant ? 'Relevant' : 'Not Relevant'}
              {validation.detected_document_type && ` - Type: ${validation.detected_document_type}`}
              {validation.relevance_confidence && (
                <span className="ml-2">
                  (Confidence: {validation.relevance_confidence}%)
                </span>
              )}
            </div>
          </div>

          {/* Authenticity */}
          <div className="border-l-4 border-purple-500 pl-4">
            <div className="font-medium text-gray-900">Authenticity Analysis</div>
            <div className="text-sm text-gray-600 mt-1">
              Score: {validation.authenticity_score || 'Pending'}%
            </div>
            {validation.authenticity_indicators?.length > 0 && (
              <div className="mt-2">
                <div className="text-sm font-medium text-green-700">Positive Indicators:</div>
                <ul className="text-sm text-gray-600">
                  {validation.authenticity_indicators.map((ind, idx) => (
                    <li key={idx}>• {ind}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.authenticity_red_flags?.length > 0 && (
              <div className="mt-2">
                <div className="text-sm font-medium text-red-700">Red Flags:</div>
                <ul className="text-sm text-gray-600">
                  {validation.authenticity_red_flags.map((flag, idx) => (
                    <li key={idx}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Extracted Metadata */}
          {validation.metadata && (
            <div className="border-l-4 border-emerald-500 pl-4">
              <div className="font-medium text-gray-900">Extracted Metadata</div>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {validation.metadata.co2_value && (
                  <div>
                    <div className="text-sm text-gray-600">CO₂ Value</div>
                    <div className="font-semibold">
                      {validation.metadata.co2_value} {validation.metadata.co2_unit}
                    </div>
                  </div>
                )}
                {validation.metadata.issue_date && (
                  <div>
                    <div className="text-sm text-gray-600">Issue Date</div>
                    <div className="font-semibold">{validation.metadata.issue_date}</div>
                  </div>
                )}
                {validation.metadata.expiry_date && (
                  <div>
                    <div className="text-sm text-gray-600">Expiry Date</div>
                    <div className="font-semibold">{validation.metadata.expiry_date}</div>
                  </div>
                )}
                {validation.metadata.issuing_authority && (
                  <div>
                    <div className="text-sm text-gray-600">Issuing Authority</div>
                    <div className="font-semibold">{validation.metadata.issuing_authority}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Audit Trail</h3>
        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div key={log.id} className="border-l-2 border-gray-300 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">
                    {log.validation_step.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Model: {log.model_used}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  {log.success ? (
                    <span className="text-green-600 text-sm">✓ Success</span>
                  ) : (
                    <span className="text-red-600 text-sm">✗ Failed</span>
                  )}
                </div>
              </div>
              
              {log.error_message && (
                <div className="mt-2 text-sm text-red-600">
                  Error: {log.error_message}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValidationDetails;