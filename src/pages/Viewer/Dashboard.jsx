import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function ViewerDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalVendors:      0,
    uploadedDocuments: 0,
    pendingDocuments:  0,
    highRiskVendors:   0,
  });

  const [aiHealth, setAiHealth] = useState({
    documentsValidated: 0,
    flaggedForReview:   0,
  });

  // FIX: actually fetched from the reports API instead of hardcoded zeros
  const [reports, setReports] = useState({
    generated:       0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    fetchViewerDashboardData();
  }, []);

  const fetchViewerDashboardData = async () => {
    try {
      const [vendorsRes, docsRes, reportsRes] = await Promise.allSettled([
        api.get("/vendors/"),
        api.get("/vendors/documents/"),
        api.get("/reports/"),
      ]);

      // ── Vendors ──
      const vendors =
        vendorsRes.status === "fulfilled"
          ? vendorsRes.value.data.results || vendorsRes.value.data || []
          : [];

      // ── Documents ──
      const documents =
        docsRes.status === "fulfilled"
          ? docsRes.value.data.results || docsRes.value.data || []
          : [];

      const uploadedDocuments = documents.filter((d) =>
        ["uploaded", "valid"].includes(d.status)
      ).length;

      const pendingDocuments = documents.filter(
        (d) => d.status === "pending"
      ).length;

      // High-risk: vendors that have at least one flagged/expired/invalid doc
      const riskVendorIds = new Set(
        documents
          .filter((d) => ["flagged", "expired", "invalid"].includes(d.status))
          .map((d) => d.vendor_id)
          .filter(Boolean)
      );
      const highRiskVendors = riskVendorIds.size;

      // ── AI health ──
      const documentsValidated = documents.filter(
        (d) => d.status === "valid"
      ).length;
      const flaggedForReview = documents.filter(
        (d) => d.status === "flagged"
      ).length;

      // ── Reports ──
      const reportList =
        reportsRes.status === "fulfilled"
          ? reportsRes.value.data.results || reportsRes.value.data || []
          : [];

      setStats({ totalVendors: vendors.length, uploadedDocuments, pendingDocuments, highRiskVendors });
      setAiHealth({ documentsValidated, flaggedForReview });
      setReports({
        generated:        reportList.filter((r) => r.status === "approved").length,
        pendingApprovals: reportList.filter((r) => r.status === "generated").length,
      });
    } catch (error) {
      console.error("Viewer dashboard fetch failed:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen
        text-gray-600 dark:text-gray-400">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Viewer Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Read-only compliance overview
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Vendors"       value={stats.totalVendors} />
        <StatCard title="Uploaded Documents"  value={stats.uploadedDocuments}  color="blue" />
        <StatCard title="Pending Documents"   value={stats.pendingDocuments}   color="yellow" />
        <StatCard title="High-Risk Vendors"   value={stats.highRiskVendors}    color="red" />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            AI System Health
          </h3>
          <div className="space-y-3">
            <InfoRow label="Documents Validated" value={aiHealth.documentsValidated} />
            <InfoRow
              label="Flagged for Review"
              value={aiHealth.flaggedForReview}
              valueClass="font-bold text-yellow-600 dark:text-yellow-400"
            />
          </div>
        </div>

        {/* Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Reports
          </h3>
          <div className="space-y-3">
            <InfoRow label="Approved Reports"  value={reports.generated} />
            <InfoRow
              label="Pending Approvals"
              value={reports.pendingApprovals}
              valueClass="font-bold text-yellow-600 dark:text-yellow-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "gray" }) {
  const colors = {
    gray:   "text-gray-900 dark:text-white",
    blue:   "text-blue-600 dark:text-blue-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    red:    "text-red-600 dark:text-red-400",
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, valueClass = "font-bold text-gray-900 dark:text-white" }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}