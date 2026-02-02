import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVendors: 65,
    compliantVendors: 40,
    pendingDocuments: 20,
    highRiskVendors: 5,
  });

  useEffect(() => {
    // Placeholder for future API call
    try {
      // fetchDashboardStats()
    } catch {
      toast.error("Failed to load dashboard data");
    }
  }, []);

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Organization Risk & Compliance Overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Total Vendors</p>
          <p className="text-3xl font-bold">{stats.totalVendors}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Compliant Vendors</p>
          <p className="text-3xl font-bold text-green-600">
            {stats.compliantVendors}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Pending Documents</p>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.pendingDocuments}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">High-Risk Vendors</p>
          <p className="text-3xl font-bold text-red-600">
            {stats.highRiskVendors}
          </p>
        </div>
      </div>
    </div>
  );
}
