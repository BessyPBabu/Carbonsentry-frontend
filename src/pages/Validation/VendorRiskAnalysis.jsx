import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { riskService } from '../../services/riskService';
import RiskScoreCard from '../../components/Validation/RiskScoreCard';
import ComplianceStats from '../../components/Validation/ComplianceStats';
import RiskFactorCard from '../../components/Validation/RiskFactorCard';
import DecisionTrace from '../../components/Validation/DecisionTrace';
import RiskBadge from '../../components/Validation/RiskBadge';

const VendorRiskAnalysis = () => {
  const { vendorId } = useParams();
  const [riskProfile, setRiskProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskProfile();
  }, [vendorId]);

  const fetchRiskProfile = async () => {
    try {
      setLoading(true);
      const data = await riskService.getVendorRiskProfile(vendorId);
      setRiskProfile(data);
    } catch (error) {
      console.error('Error fetching risk profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!riskProfile) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center text-gray-500">No risk data available</div>
      </div>
    );
  }

  const complianceStats = {
    documents_valid: riskProfile.validated_documents,
    expired_missing: riskProfile.total_documents - riskProfile.validated_documents,
    ai_confidence_avg: riskProfile.avg_document_confidence
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Risk Analysis</h1>
        <p className="text-gray-600 mt-2">Explainable risk profile after AI & human review</p>
      </div>

      {/* Vendor Header */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{riskProfile.vendor_name}</h2>
            <p className="text-gray-600 mt-1">Manufacturing · Germany</p>
          </div>
          <RiskBadge level={riskProfile.risk_level} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Risk Score */}
        <RiskScoreCard
          score={riskProfile.risk_score || 0}
          maxScore={5}
          subtitle="Increased from last quarter"
        />

        {/* Compliance Status */}
        <ComplianceStats stats={complianceStats} />
      </div>

      {/* Risk Factors Breakdown */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors Breakdown</h3>
        
        <div className="space-y-4">
          <RiskFactorCard
            title="Document Expiry Risk"
            description="Carbon certificate expired on 2024-03-01"
            type="high"
          />
          
          <RiskFactorCard
            title="AI Confidence Risk"
            description={`Extraction confidence below auto-approval threshold (${
              riskProfile.avg_document_confidence 
                ? parseFloat(riskProfile.avg_document_confidence).toFixed(0) 
                : 0
            }%)`}
            type="medium"
          />
          
          <RiskFactorCard
            title="Historical Trend Risk"
            description="Emission values consistent with last year"
            type="low"
          />
        </div>
      </div>

      {/* Decision Trace */}
      <DecisionTrace
        aiRecommendation="Flagged for human review due to low confidence and expiry mismatch"
        humanDecision="Approved with conditional acceptance"
        reviewedBy="Compliance Officer - Anjali S"
        reviewedAt="2025-01-12T14:32:00Z"
      />

      {/* Recommended Actions */}
      <div className="bg-white border rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-emerald-600 mt-0.5">•</span>
            Request updated carbon certificate
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-emerald-600 mt-0.5">•</span>
            Increase document review frequency
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-emerald-600 mt-0.5">•</span>
            Flag vendor for next compliance audit
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VendorRiskAnalysis;