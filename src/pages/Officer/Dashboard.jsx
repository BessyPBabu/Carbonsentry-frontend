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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const vendorsRes = await api.get('/vendors/');
      const vendors = vendorsRes.data.results || vendorsRes.data;

      const documentsRes = await api.get("/vendors/documents/");
    const documents = documentsRes.data.results || documentsRes.data;

    const uploadedDocs = documents.filter(
      (doc) => doc.status === "uploaded"
    ).length;

    const pendingDocs = documents.filter(
      (doc) => doc.status === "pending"
    ).length;

    const validDocs = documents.filter(
      (doc) => doc.status === "valid"
    ).length;

    const flaggedDocs = documents.filter(
      (doc) => doc.status === "flagged"
    ).length;

    setStats({
      totalVendors: vendors.length,
      pendingDocuments: pendingDocs,
      validDocuments: validDocs,
      flaggedDocuments: flaggedDocs,
      uploadedDocuments: uploadedDocs,
    });

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Vendors"
          value={stats.totalVendors}
          color="gray"
          onClick={() => navigate('/officer/vendors')}
        />
        <StatCard
          title="Pending Documents"
          value={stats.pendingDocuments}
          color="yellow"
          onClick={() => navigate('/officer/documents?status=pending')}
        />
        <StatCard
          title="Uploaded Documents"
          value={stats.uploadedDocuments}
          color="blue"
          onClick={() => navigate("/officer/documents?status=uploaded")}
        />
        <StatCard
          title="Valid Documents"
          value={stats.validDocuments}
          color="green"
          onClick={() => navigate('/officer/documents?status=valid')}
        />
        <StatCard
          title="Flagged for Review"
          value={stats.flaggedDocuments}
          color="red"
          onClick={() => navigate('/officer/documents?status=flagged')}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionButton
            icon="📤"
            title="Upload Vendors"
            description="Bulk upload via CSV"
            onClick={() => navigate('/officer/vendors/bulk-upload')}
          />
          <ActionButton
            icon="➕"
            title="Add Vendor"
            description="Add single vendor manually"
            onClick={() => navigate('/officer/vendors/add')}
          />
          <ActionButton
            icon="📋"
            title="View Vendors"
            description="See all vendors"
            onClick={() => navigate('/officer/vendors')}
          />
        </div>
      </div>
    </div>
  );
}

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