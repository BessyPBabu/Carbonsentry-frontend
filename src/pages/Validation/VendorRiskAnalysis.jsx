import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { riskService }       from "../../services/riskService";
import { validationService } from "../../services/validationService";
import RiskScoreCard     from "../../components/Validation/RiskScoreCard";
import ComplianceStats   from "../../components/Validation/ComplianceStats";
import RiskFactorCard    from "../../components/Validation/RiskFactorCard";
import DecisionTrace     from "../../components/Validation/DecisionTrace";
import RiskBadge         from "../../components/Validation/RiskBadge";
import { safeFloat }     from "../../utils/formatters";

const RISK_SCORE_DISPLAY_DIVISOR = 20;

// Must match backend constants.py DEFAULT_THRESHOLDS
const INDUSTRY_THRESHOLDS = {
  Manufacturing: { low: 1000,  medium: 5000,  high: 15000, critical: 50000  },
  Technology:    { low: 300,   medium: 1500,  high: 5000,  critical: 12000  },
  Retail:        { low: 300,   medium: 1500,  high: 3000,  critical: 8000   },
  Logistics:     { low: 2000,  medium: 10000, high: 30000, critical: 100000 },
  Energy:        { low: 5000,  medium: 20000, high: 80000, critical: 250000 },
  Healthcare:    { low: 400,   medium: 2000,  high: 7000,  critical: 20000  },
};
const DEFAULT_THRESHOLD = { low: 1000, medium: 5000, high: 10000, critical: 50000 };

// Must match backend constants.py MIN_AUTO_APPROVE_CONFIDENCE
const MIN_AUTO_APPROVE_CONFIDENCE = 50;

const VendorRiskAnalysis = () => {
  const { vendorId } = useParams();
  const navigate     = useNavigate();

  const [riskProfile,  setRiskProfile]  = useState(null);
  const [validations,  setValidations]  = useState([]);
  const [latestReview, setLatestReview] = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => { fetchAllData(); }, [vendorId]); // eslint-disable-line

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [profileData, validationsData, reviewData] = await Promise.all([
        riskService.getVendorRiskProfile(vendorId),
        validationService.getValidationsByVendor(vendorId),
        validationService.getLatestReviewByVendor(vendorId).catch(() => null),
      ]);
      setRiskProfile(profileData);
      setValidations(validationsData || []);
      setLatestReview(reviewData);
    } catch (error) {
      console.error("VendorRiskAnalysis.fetchAllData:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskFactors = () => {
    if (!riskProfile) return [];

    const now    = new Date();
    const in30d  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90d  = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const factors = [];

    // ── 1. Document expiry ───────────────────────────────────────────────────
    const expiredDocs  = validations.filter(
      (v) => v.metadata?.expiry_date && new Date(v.metadata.expiry_date) < now
    );
    const expiringSoon = validations.filter((v) => {
      if (!v.metadata?.expiry_date) return false;
      const d = new Date(v.metadata.expiry_date);
      return d > now && d < in30d;
    });
    const expiringIn90 = validations.filter((v) => {
      if (!v.metadata?.expiry_date) return false;
      const d = new Date(v.metadata.expiry_date);
      return d >= in30d && d < in90d;
    });

    if (expiredDocs.length > 0) {
      const latest = expiredDocs.reduce((a, b) =>
        new Date(a.metadata.expiry_date) > new Date(b.metadata.expiry_date) ? a : b
      );
      factors.push({
        title: "Document Expiry Risk",
        description: `${expiredDocs.length} certificate(s) expired. Latest expired: ${new Date(latest.metadata.expiry_date).toLocaleDateString()}`,
        type: "high",
      });
    } else if (expiringSoon.length > 0) {
      factors.push({
        title: "Document Expiry Risk",
        description: `${expiringSoon.length} certificate(s) expiring within 30 days`,
        type: "medium",
      });
    } else if (expiringIn90.length > 0) {
      factors.push({
        title: "Document Expiry Risk",
        description: `${expiringIn90.length} certificate(s) expiring within 90 days`,
        type: "medium",
      });
    } else {
      factors.push({
        title: "Document Expiry Risk",
        description: "All certificates valid and not expiring soon",
        type: "low",
      });
    }

    // ── 2. AI confidence ─────────────────────────────────────────────────────
    // Only evaluate when we actually have confidence data — null/0 means
    // no documents have been validated yet, not that confidence is bad.
    const rawConfidence = riskProfile.avg_document_confidence;
    if (rawConfidence === null || rawConfidence === undefined || riskProfile.validated_documents === 0) {
      factors.push({
        title: "AI Confidence Risk",
        description: "No validated documents yet — confidence not available",
        type: "low",
      });
    } else {
      const avgConfidence = safeFloat(rawConfidence);
      if (avgConfidence < MIN_AUTO_APPROVE_CONFIDENCE) {
        factors.push({
          title: "AI Confidence Risk",
          description: `Low extraction confidence (${avgConfidence.toFixed(0)}%) — below auto-approval threshold of ${MIN_AUTO_APPROVE_CONFIDENCE}%`,
          type: "high",
        });
      } else if (avgConfidence < 70) {
        factors.push({
          title: "AI Confidence Risk",
          description: `Moderate extraction confidence (${avgConfidence.toFixed(0)}%)`,
          type: "medium",
        });
      } else {
        factors.push({
          title: "AI Confidence Risk",
          description: `Good extraction confidence (${avgConfidence.toFixed(0)}%)`,
          type: "low",
        });
      }
    }

    // ── 3. Emissions level ───────────────────────────────────────────────────
    if (riskProfile.total_co2_emissions) {
      const emissions = safeFloat(riskProfile.total_co2_emissions);
      const threshold = INDUSTRY_THRESHOLDS[riskProfile.vendor_industry] || DEFAULT_THRESHOLD;

      if (emissions > threshold.critical) {
        factors.push({
          title: "Emissions Level Risk",
          description: `Total emissions (${emissions.toLocaleString()} t) exceed critical threshold (${threshold.critical.toLocaleString()} t)`,
          type: "high",
        });
      } else if (emissions > threshold.high) {
        factors.push({
          title: "Emissions Level Risk",
          description: `Total emissions (${emissions.toLocaleString()} t) exceed high threshold (${threshold.high.toLocaleString()} t)`,
          type: "high",
        });
      } else if (emissions > threshold.medium) {
        factors.push({
          title: "Emissions Level Risk",
          description: `Total emissions (${emissions.toLocaleString()} t) above medium threshold (${threshold.medium.toLocaleString()} t)`,
          type: "medium",
        });
      } else {
        factors.push({
          title: "Emissions Level Risk",
          description: `Emissions within acceptable range (${emissions.toLocaleString()} t)`,
          type: "low",
        });
      }
    } else {
      factors.push({
        title: "Emissions Level Risk",
        description: "No emissions data extracted yet",
        type: "low",
      });
    }

    // ── 4. Document quality (flagged ratio) ──────────────────────────────────
    const total        = riskProfile.total_documents   || 0;
    const flagged      = riskProfile.flagged_documents || 0;
    const flaggedRatio = total > 0 ? (flagged / total) * 100 : 0;

    if (total === 0) {
      factors.push({
        title: "Document Quality Risk",
        description: "No documents uploaded yet",
        type: "low",
      });
    } else if (flaggedRatio > 50) {
      factors.push({
        title: "Document Quality Risk",
        description: `${flaggedRatio.toFixed(0)}% of documents flagged for manual review (${flagged} of ${total})`,
        type: "high",
      });
    } else if (flaggedRatio > 20) {
      factors.push({
        title: "Document Quality Risk",
        description: `${flaggedRatio.toFixed(0)}% of documents flagged (${flagged} of ${total})`,
        type: "medium",
      });
    } else {
      factors.push({
        title: "Document Quality Risk",
        description: `Low flagged rate — ${flaggedRatio.toFixed(0)}% (${flagged} of ${total} documents)`,
        type: "low",
      });
    }

    return factors;
  };

  const generateRecommendedActions = () => {
    if (!riskProfile) return [];
    const actions = [];

    const now         = new Date();
    const expiredDocs = validations.filter(
      (v) => v.metadata?.expiry_date && new Date(v.metadata.expiry_date) < now
    );
    if (expiredDocs.length > 0) {
      actions.push("Request updated carbon certificates for expired documents");
    }

    const rawConfidence = riskProfile.avg_document_confidence;
    if (rawConfidence !== null && rawConfidence !== undefined) {
      const avgConfidence = safeFloat(rawConfidence);
      if (avgConfidence > 0 && avgConfidence < 70) {
        actions.push("Review flagged documents and request higher-quality scans");
      }
    }

    if (["high", "critical"].includes(riskProfile.risk_level)) {
      actions.push("Schedule immediate compliance audit");
      actions.push("Escalate to senior management for review");
    }

    if (riskProfile.exceeds_threshold) {
      actions.push("Request emission reduction plan from vendor");
    }

    const total        = riskProfile.total_documents   || 0;
    const flaggedRatio = total > 0
      ? (riskProfile.flagged_documents / total) * 100 : 0;
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
        <div className="text-gray-500 dark:text-gray-400">Loading risk analysis…</div>
      </div>
    );
  }

  if (!riskProfile) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-500 dark:text-gray-400">
        No risk data available for this vendor
      </div>
    );
  }

  const complianceStats = {
    documents_valid:   riskProfile.validated_documents,
    flagged_documents: riskProfile.flagged_documents,
    total_documents:   riskProfile.total_documents,
    ai_confidence_avg: riskProfile.avg_document_confidence,
  };

  const riskFactors        = calculateRiskFactors();
  const recommendedActions = generateRecommendedActions();
  const displayScore       = (safeFloat(riskProfile.risk_score) / RISK_SCORE_DISPLAY_DIVISOR).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400
          hover:text-gray-800 dark:hover:text-gray-200"
      >
        ← Back to Risk Analysis
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Vendor Risk Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Explainable risk profile after AI &amp; human review
        </p>
      </div>

      {/* Vendor header */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {riskProfile.vendor_name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {riskProfile.vendor_industry || "Industry Not Specified"}
            </p>
          </div>
          <RiskBadge level={riskProfile.risk_level} />
        </div>
      </div>

      {/* Score + compliance grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RiskScoreCard
          score={displayScore}
          maxScore={5}
          subtitle={`Based on ${riskProfile.total_documents} document(s)`}
        />
        <ComplianceStats stats={complianceStats} />
      </div>

      {/* Risk factor breakdown */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Risk Factors Breakdown
        </h3>
        <div className="space-y-4">
          {riskFactors.map((factor, index) => (
            <RiskFactorCard key={index} {...factor} />
          ))}
        </div>
      </div>

      {/* Decision trace */}
      {latestReview && (
        <DecisionTrace
          aiRecommendation={latestReview.reason || "Flagged for human review"}
          humanDecision={latestReview.resolution_decision || "Pending review"}
          reviewedBy={latestReview.assigned_to_name || "Not assigned"}
          reviewedAt={latestReview.resolved_at || latestReview.created_at}
        />
      )}

      {/* Recommended actions */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recommended Actions
        </h3>
        <ul className="space-y-2">
          {recommendedActions.map((action, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">•</span>
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VendorRiskAnalysis;