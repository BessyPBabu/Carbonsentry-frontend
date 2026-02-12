import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { riskService } from '../../services/riskService';
import RiskBadge from '../../components/Validation/RiskBadge';
import Button from '../../components/Common/Button';

const VendorRiskList = () => {
  const navigate = useNavigate();
  const [riskProfiles, setRiskProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, high, medium, low

  useEffect(() => {
    fetchRiskProfiles();
  }, []);

  const fetchRiskProfiles = async () => {
    try {
      setLoading(true);
      const data = await riskService.getAllRiskProfiles();
      setRiskProfiles(data);
    } catch (error) {
      console.error('Error fetching risk profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = riskProfiles.filter(profile => {
    if (filter === 'all') return true;
    if (filter === 'high') return profile.risk_level === 'high' || profile.risk_level === 'critical';
    return profile.risk_level === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Risk Analysis</h1>
        <p className="text-gray-600 mt-2">Comprehensive risk overview for all vendors</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {['all', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} Risk
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Vendor
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
                Documents
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProfiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{profile.vendor_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RiskBadge level={profile.risk_level} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {profile.risk_score ? `${parseFloat(profile.risk_score).toFixed(1)} / 5` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {profile.total_co2_emissions 
                    ? `${parseFloat(profile.total_co2_emissions).toLocaleString()} tonnes`
                    : 'Pending'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {profile.validated_documents} / {profile.total_documents}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/validation/vendor-risk/${profile.vendor}`)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorRiskList;