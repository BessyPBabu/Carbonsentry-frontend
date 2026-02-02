import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../services/api";


export default function OfficerDashboard() {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingDocuments: 0,
    validDocuments: 0,
    flaggedDocuments: 0
  });

  const [loading, setLoading] = useState(true);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [highRiskVendors, setHighRiskVendors] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch vendors
      const vendorsRes = await api.get('/vendors/vendors/');
      const vendors = vendorsRes.data.results || vendorsRes.data;
      
      // Fetch documents
      const docsRes = await api.get('/vendors/documents/');
      const documents = docsRes.data.results || docsRes.data;

      // Calculate stats
      setStats({
        totalVendors: vendors.length,
        pendingDocuments: documents.filter(d => d.status === 'pending').length,
        validDocuments: documents.filter(d => d.status === 'valid').length,
        flaggedDocuments: documents.filter(d => d.status === 'flagged').length,
      });

      // Get recent documents (last 5)
      setRecentDocuments(documents.slice(0, 5));

      // Get high-risk vendors
      const highRisk = vendors.filter(
        v => v.risk_level === 'high' || v.risk_level === 'critical'
      ).slice(0, 5);
      setHighRiskVendors(highRisk);

    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
        <p className="text-gray-600 mt-1">Operational Overview</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Vendors"
          value={stats.totalVendors}
          color="gray"
          onClick={() => navigate('/vendors')}
        />
        <StatCard
          title="Pending Documents"
          value={stats.pendingDocuments}
          color="yellow"
          onClick={() => navigate('/documents?status=pending')}
        />
        <StatCard
          title="Valid Documents"
          value={stats.validDocuments}
          color="green"
          onClick={() => navigate('/documents?status=valid')}
        />
        <StatCard
          title="Flagged for Review"
          value={stats.flaggedDocuments}
          color="red"
          onClick={() => navigate('/documents?status=flagged')}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Documents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Documents</h3>
          {recentDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents yet
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <div className="font-medium">{doc.vendor_name}</div>
                      <div className="text-sm text-gray-600">
                        {doc.document_type_name}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'valid'
                          ? 'bg-green-100 text-green-800'
                          : doc.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : doc.status === 'flagged'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {doc.status_display}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/documents')}
                className="w-full px-4 py-2 bg-[#1a8f70] text-white rounded-md hover:bg-[#12654e]"
              >
                View All Documents
              </button>
            </>
          )}
        </div>

        {/* High-Risk Vendors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">High-Risk Vendors</h3>
          {highRiskVendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No high-risk vendors
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {highRiskVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-gray-600">
                        {vendor.industry_name}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vendor.risk_level === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {vendor.risk_level_display}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/vendors?risk_level=high')}
                className="w-full px-4 py-2 border border-[#1a8f70] text-[#1a8f70] rounded-md hover:bg-[#1a8f70] hover:text-white"
              >
                View All High-Risk
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionButton
            icon="📤"
            title="Upload Vendors"
            description="Bulk upload via CSV"
            onClick={() => navigate('/vendors/bulk-upload')}
          />
          <ActionButton
            icon="➕"
            title="Add Vendor"
            description="Add single vendor manually"
            onClick={() => navigate('/vendors/add')}
          />
          <ActionButton
            icon="📊"
            title="View Reports"
            description="Compliance reports"
            onClick={() => navigate('/reports')}
          />
        </div>
      </div>
    </div>
  );
}

/* ========== HELPER COMPONENTS ========== */

function StatCard({ title, value, color, onClick }) {
  const colorClasses = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
    >
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

function ActionButton({ icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#1a8f70] hover:bg-gray-50 text-left transition"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </button>
  );
}