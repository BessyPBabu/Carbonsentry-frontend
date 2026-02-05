import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalVendors: 0,
    uploadedDocuments: 0,
    pendingDocuments: 0,
    highRiskVendors: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      
      const vendorsRes = await api.get("/vendors/");
      const vendors = vendorsRes.data.results || vendorsRes.data;

      const docsRes = await api.get("/vendors/documents/");
      const documents = docsRes.data.results || docsRes.data;

      const uploadedDocuments = documents.filter((doc) =>
        ["uploaded", "valid"].includes(doc.status)
      ).length;


      const pendingDocuments = documents.filter(
        (doc) => doc.status === "pending"
      ).length;

      const docsByVendor = {};
      documents.forEach((doc) => {
        const vendorId = doc.vendor?.id;
        if (!vendorId) return;

        if (!docsByVendor[vendorId]) {
          docsByVendor[vendorId] = [];
        }
        docsByVendor[vendorId].push(doc);
      });

      let highRiskVendors = 0;

      vendors.forEach((vendor) => {
        const vendorDocs = docsByVendor[vendor.id] || [];

        if (vendorDocs.length === 0) {
          highRiskVendors++;
          return;
        }

        const hasRisk = vendorDocs.some((doc) =>
          ["flagged", "expired", "invalid"].includes(doc.status)
        );

        if (hasRisk) {
          highRiskVendors++;
        }
      });

      setStats({
        totalVendors: vendors.length,
        uploadedDocuments,
        pendingDocuments,
        highRiskVendors,
      });
    } catch (error) {
      console.error("Failed to load admin dashboard stats", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
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
        <StatCard title="Total Vendors" value={stats.totalVendors} />

        <StatCard
          title="Uploaded Documents"
          value={stats.uploadedDocuments}
          color="blue"
        />

        <StatCard
          title="Pending Documents"
          value={stats.pendingDocuments}
          color="yellow"
        />

        <StatCard
          title="High-Risk Vendors"
          value={stats.highRiskVendors}
          color="red"
        />
      </div>
    </div>
  );
}

/* ---------- Helper ---------- */

function StatCard({ title, value, color = "gray" }) {
  const colors = {
    gray: "text-gray-900",
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}
