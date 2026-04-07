import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { riskService } from '../../services/riskService';
import RiskBadge from '../../components/Validation/RiskBadge';
import Button from '../../components/Common/Button';
import { useAuth } from '../../context/AuthContext';

// Matches backend RISK_SCORE_DISPLAY_DIVISOR = 20
const toDisplayScore = (score) => {
  if (score === null || score === undefined) return 'N/A';
  const n = parseFloat(score);
  if (isNaN(n)) return 'N/A';
  return (n / 20).toFixed(1);
};
// Derive badge level from numerical score — matches backend risk_score bands:
//   0–25 → low | 26–50 → medium | 51–75 → high | 76–100 → critical
const levelFromScore = (score) => {
  if (score === null || score === undefined) return 'unknown';
  const n = parseFloat(score);
  if (isNaN(n)) return 'unknown';
  if (n <= 25) return 'low';
  if (n <= 50) return 'medium';
  if (n <= 75) return 'high';
  return 'critical';
};

const RISK_BAND_LABEL = {
  low:      'Low risk (0.0–1.2 / 5)',
  medium:   'Medium risk (1.3–2.5 / 5)',
  high:     'High risk (2.6–3.7 / 5)',
  critical: 'Critical risk (3.8–5.0 / 5)',
  unknown:  'Unknown',
};

const FILTERS = [
  { key: 'all',      label: 'All Risk' },
  { key: 'high',     label: 'High + Critical' },
  { key: 'medium',   label: 'Medium Risk' },
  { key: 'low',      label: 'Low Risk' },
];

const VendorRiskList = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [riskProfiles, setRiskProfiles] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');

  const basePath = role === 'admin' ? '/admin' : '/officer';

  useEffect(() => {
    fetchRiskProfiles();
  }, [filter]);

  const fetchRiskProfiles = async () => {
    try {
      setLoading(true);
      let data = await riskService.getAllRiskProfiles();

      if (filter === 'high') {
      data = data.filter(p => {
        const lvl = levelFromScore(p.risk_score);
        return lvl === 'high' || lvl === 'critical';
      });
    } else if (filter !== 'all') {
      data = data.filter(p => levelFromScore(p.risk_score) === filter);
    }

    const ORDER = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };
    data.sort((a, b) => {
      const la = levelFromScore(a.risk_score);
      const lb = levelFromScore(b.risk_score);
      return (ORDER[la] ?? 5) - (ORDER[lb] ?? 5);
    })

      setRiskProfiles(data);
    } catch (error) {
      console.error('VendorRiskList.fetchRiskProfiles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading risk profiles...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Risk Analysis</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive risk overview for all vendors
        </p>
        {/* Risk score legend */}
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(RISK_BAND_LABEL).filter(([k]) => k !== 'unknown').map(([level, label]) => (
            <span key={level} className="flex items-center gap-1.5 text-xs text-gray-500">
              <RiskBadge level={level} />
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {riskProfiles.length === 0 && (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
          No risk profiles found for this filter. Validate documents to generate risk data.
        </div>
      )}

      {/* Table */}
      {riskProfiles.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Risk Score
                  <span className="ml-1 text-gray-400 font-normal normal-case">(out of 5)</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total CO₂</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docs Validated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {riskProfiles.map((profile) => {
                const displayScore = toDisplayScore(profile.risk_score);
                // Derive level from score — same logic as detail page and backend bands
                const derivedLevel = levelFromScore(profile.risk_score);
                const scoreColour  =
                  derivedLevel === 'critical' ? 'text-red-700 font-bold' :
                  derivedLevel === 'high'     ? 'text-orange-600 font-semibold' :
                  derivedLevel === 'medium'   ? 'text-yellow-600' :
                                               'text-green-700';
                return (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{profile.vendor_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{profile.vendor_industry || '—'}</td>
                    <td className="px-6 py-4">
                      <RiskBadge level={derivedLevel} />
                    </td>
                    <td className={`px-6 py-4 text-sm ${scoreColour}`}>
                      {displayScore} / 5
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {profile.total_co2_emissions
                        ? `${parseFloat(profile.total_co2_emissions).toLocaleString()} t`
                        : 'Pending'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {profile.validated_documents} / {profile.total_documents}
                      {profile.flagged_documents > 0 && (
                        <span className="ml-1 text-xs text-yellow-600">
                          ({profile.flagged_documents} flagged)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {profile.avg_document_confidence
                        ? `${parseFloat(profile.avg_document_confidence).toFixed(0)}%`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`${basePath}/risk-analysis/${profile.vendor_id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorRiskList;