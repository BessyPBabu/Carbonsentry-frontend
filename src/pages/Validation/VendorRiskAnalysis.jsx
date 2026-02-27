import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { riskService } from '../../services/riskService';
import { validationService } from '../../services/validationService';
import RiskScoreCard from '../../components/Validation/RiskScoreCard';
import ComplianceStats from '../../components/Validation/ComplianceStats';
import RiskFactorCard from '../../components/Validation/RiskFactorCard';
import DecisionTrace from '../../components/Validation/DecisionTrace';
import RiskBadge from '../../components/Validation/RiskBadge';

const VendorRiskAnalysis = () => {
  const { vendorId } = useParams();
  const [riskProfile, setRiskProfile] = useState(null);
  const [validations, setValidations] = useState([]);
  const [latestReview, setLatestReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const RISK_SCORE_DISPLAY_DIVISOR = 20;

  useEffect(() => {
    fetchAllData();
  }, [vendorId]);

  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [profileData, validationsData, reviewData] = await Promise.all([
        riskService.getVendorRiskProfile(vendorId),
        validationService.getValidationsByVendor(vendorId),
        validationService.getLatestReviewByVendor(vendorId).catch(() => null)
      ]);
      
      setRiskProfile(profileData);
      setValidations(validationsData || []);
      setLatestReview(reviewData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskFactors = () => {
    if (!validations.length) return [];

    const factors = [];
    
    const expiredDocs = validations.filter(v => {
      if (v.metadata?.expiry_date) {
        return new Date(v.metadata.expiry_date) < new Date();
      }
      return false;
    });

    const expiringSoon = validations.filter(v => {
      if (v.metadata?.expiry_date) {
        const expiryDate = new Date(v.metadata.expiry_date);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return expiryDate > today && expiryDate < thirtyDaysFromNow;
      }
      return false;
    });

    if (expiredDocs.length > 0) {
      const latestExpired = expiredDocs.reduce((latest, doc) => {
        return new Date(doc.metadata.expiry_date) > new Date(latest.metadata.expiry_date) 
          ? doc 
          : latest;
      });
      
      factors.push({
        title: "Document Expiry Risk",
        description: `${expiredDocs.length} certificate(s) expired. Latest: ${new Date(latestExpired.metadata.expiry_date).toLocaleDateString()}`,
        type: "high"
      });
    } else if (expiringSoon.length > 0) {
      factors.push({
        title: "Document Expiry Risk",
        description: `${expiringSoon.length} certificate(s) expiring within 30 days`,
        type: "medium"
      });
    } else {
      factors.push({
        title: "Document Expiry Risk",
        description: "All certificates valid and not expiring soon",
        type: "low"
      });
    }

    const avgConfidence = riskProfile.avg_document_confidence 
      ? parseFloat(riskProfile.avg_document_confidence) 
      : 0;

    if (avgConfidence < 50) {
      factors.push({
        title: "AI Confidence Risk",
        description: `Very low extraction confidence (${avgConfidence.toFixed(0)}%)`,
        type: "high"
      });
    } else if (avgConfidence < 70) {
      factors.push({
        title: "AI Confidence Risk",
        description: `Extraction confidence below auto-approval threshold (${avgConfidence.toFixed(0)}%)`,
        type: "medium"
      });
    } else {
      factors.push({
        title: "AI Confidence Risk",
        description: `High extraction confidence (${avgConfidence.toFixed(0)}%)`,
        type: "low"
      });
    }

    if (riskProfile.total_co2_emissions) {
      const emissions = parseFloat(riskProfile.total_co2_emissions);
      const threshold = getIndustryThreshold(riskProfile.vendor_industry);
      
      if (emissions > threshold.high) {
        factors.push({
          title: "Emissions Level Risk",
          description: `Total emissions (${emissions.toLocaleString()} tonnes) exceed high threshold`,
          type: "high"
        });
      } else if (emissions > threshold.medium) {
        factors.push({
          title: "Emissions Level Risk",
          description: `Total emissions (${emissions.toLocaleString()} tonnes) above medium threshold`,
          type: "medium"
        });
      } else {
        factors.push({
          title: "Emissions Level Risk",
          description: `Emissions within acceptable range (${emissions.toLocaleString()} tonnes)`,
          type: "low"
        });
      }
    }

    const flaggedRatio = riskProfile.total_documents > 0 
      ? (riskProfile.flagged_documents / riskProfile.total_documents) * 100 
      : 0;

    if (flaggedRatio > 50) {
      factors.push({
        title: "Document Quality Risk",
        description: `${flaggedRatio.toFixed(0)}% of documents flagged for manual review`,
        type: "high"
      });
    } else if (flaggedRatio > 20) {
      factors.push({
        title: "Document Quality Risk",
        description: `${flaggedRatio.toFixed(0)}% of documents flagged for manual review`,
        type: "medium"
      });
    } else {
      factors.push({
        title: "Document Quality Risk",
        description: `Low flagged rate (${flaggedRatio.toFixed(0)}%)`,
        type: "low"
      });
    }

    return factors;
  };

  const getIndustryThreshold = (industry) => {
    const thresholds = {
      'Manufacturing': { low: 1000, medium: 5000, high: 10000 },
      'Technology': { low: 500, medium: 2000, high: 5000 },
      'Retail': { low: 300, medium: 1500, high: 3000 },
      'Logistics': { low: 2000, medium: 10000, high: 20000 },
      'Energy': { low: 5000, medium: 20000, high: 50000 },
      'default': { low: 1000, medium: 5000, high: 10000 }
    };
    return thresholds[industry] || thresholds.default;
  };

  const generateRecommendedActions = () => {
    const actions = [];
    
    const expiredDocs = validations.filter(v => {
      if (v.metadata?.expiry_date) {
        return new Date(v.metadata.expiry_date) < new Date();
      }
      return false;
    });

    if (expiredDocs.length > 0) {
      actions.push("Request updated carbon certificates for expired documents");
    }

    const avgConfidence = riskProfile.avg_document_confidence 
      ? parseFloat(riskProfile.avg_document_confidence) 
      : 0;

    if (avgConfidence < 70) {
      actions.push("Review flagged documents and request higher quality scans");
    }

    if (riskProfile.risk_level === 'high' || riskProfile.risk_level === 'critical') {
      actions.push("Schedule immediate compliance audit");
      actions.push("Escalate to senior management for review");
    }

    if (riskProfile.exceeds_threshold) {
      actions.push("Request emission reduction plan from vendor");
    }

    const flaggedRatio = riskProfile.total_documents > 0 
      ? (riskProfile.flagged_documents / riskProfile.total_documents) * 100 
      : 0;

    if (flaggedRatio > 30) {
      actions.push("Increase document verification frequency to quarterly");
    }

    if (actions.length === 0) {
      actions.push("Continue standard monitoring procedures");
      actions.push("Annual compliance review scheduled");
    }

    return actions;
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

  const riskFactors = calculateRiskFactors();
  const recommendedActions = generateRecommendedActions();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
       <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        ← Back to Risk Analysis
      </button>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Risk Analysis</h1>
        <p className="text-gray-600 mt-2">Explainable risk profile after AI & human review</p>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{riskProfile.vendor_name}</h2>
            <p className="text-gray-600 mt-1">
              {riskProfile.vendor_industry || 'Industry Not Specified'}
            </p>
          </div>
          <RiskBadge level={riskProfile.risk_level} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RiskScoreCard
          score={riskProfile.risk_score 
            ? (parseFloat(riskProfile.risk_score) / RISK_SCORE_DISPLAY_DIVISOR).toFixed(1)
            : '0.0'}
          maxScore={5}
          subtitle={`Based on ${riskProfile.total_documents} document(s)`}
        />

        <ComplianceStats stats={complianceStats} />
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors Breakdown</h3>
        
        <div className="space-y-4">
          {riskFactors.map((factor, index) => (
            <RiskFactorCard
              key={index}
              title={factor.title}
              description={factor.description}
              type={factor.type}
            />
          ))}
        </div>
      </div>

      {latestReview && (
        <DecisionTrace
          aiRecommendation={latestReview.reason || "Flagged for human review"}
          humanDecision={latestReview.resolution_decision || "Pending review"}
          reviewedBy={latestReview.assigned_to_name || "Not assigned"}
          reviewedAt={latestReview.resolved_at || latestReview.created_at}
        />
      )}

      <div className="bg-white border rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
        <ul className="space-y-2">
          {recommendedActions.map((action, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-emerald-600 mt-0.5">•</span>
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VendorRiskAnalysis;