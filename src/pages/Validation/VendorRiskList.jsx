import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { riskService } from '../../services/riskService';
import RiskBadge from '../../components/Validation/RiskBadge';
import Button from '../../components/Common/Button';
import { useAuth } from '../../context/AuthContext';

// Risk score stored as 0-100 in DB, displayed as X.X / 5
const toDisplayScore = (score) => {
  if (score === null || score === undefined) return 'N/A';
  return (parseFloat(score) / 20).toFixed(1);
};

const VendorRiskList = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [riskProfiles, setRiskProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const basePath = role === 'admin' ? '/admin' : '/officer';

  useEffect(() => {
    fetchRiskProfiles();
  }, [filter]);

  const fetchRiskProfiles = async () => {
    try {
      setLoading(true);
      let data = await riskService.getAllRiskProfiles();

      if (filter === 'high') {
        data = data.filter(
          (p) => p.risk_level === 'high' || p.risk_level === 'critical'
        );
      } else if (filter !== 'all') {
        data = data.filter((p) => p.risk_level === filter);
      }

      setRiskProfiles(data);
    } catch (error) {
      console.error('Error fetching risk profiles:', error);
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
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {[
          { key: 'all', label: 'All Risk' },
          { key: 'high', label: 'High + Critical' },
          { key: 'medium', label: 'Medium Risk' },
          { key: 'low', label: 'Low Risk' },
        ].map(({ key, label }) => (
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
          No risk profiles found. Validate documents to generate risk data.
        </div>
      )}

      {/* Table */}
      {riskProfiles.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total CO₂
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Docs Validated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {riskProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {profile.vendor_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {profile.vendor_industry || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={profile.risk_level} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {/* Display as X.X / 5 */}
                    {toDisplayScore(profile.risk_score)} / 5
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {profile.total_co2_emissions
                      ? `${parseFloat(
                          profile.total_co2_emissions
                        ).toLocaleString()} t`
                      : 'Pending'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {profile.validated_documents} / {profile.total_documents}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {profile.avg_document_confidence
                      ? `${parseFloat(
                          profile.avg_document_confidence
                        ).toFixed(0)}%`
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `${basePath}/risk-analysis/${profile.vendor_id}`
                        )
                      }
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorRiskList;