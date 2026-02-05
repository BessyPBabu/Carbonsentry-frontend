import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function ViewerDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalVendors: 0,
    uploadedDocuments: 0,
    pendingDocuments: 0,
    highRiskVendors: 0,
  });


  const [aiHealth, setAiHealth] = useState({
    documentsValidated: 0,
    flaggedForReview: 0,
  });

  const [reports] = useState({
    generated: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    fetchViewerDashboardData();
  }, []);

  const fetchViewerDashboardData = async () => {
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
        const hasRisk = vendorDocs.some((doc) =>
          ["flagged", "expired", "invalid"].includes(doc.status)
        );
        if (hasRisk) highRiskVendors++;
      });

      const documentsValidated = documents.filter(
        (doc) => doc.status === "valid"
      ).length;

      const flaggedForReview = documents.filter(
        (doc) => doc.status === "flagged"
      ).length;

      const activity = documents
        .slice(0, 5)
        .map((doc) => ({
          timestamp: doc.uploaded_at || doc.created_at,
          actor: "System",
          action:
            doc.status === "flagged"
              ? "Flagged for Review"
              : "Document Updated",
          entity: doc.vendor?.name || "Vendor",
          details: doc.document_type || "Document",
        }));

      setStats({
        totalVendors: vendors.length,
        uploadedDocuments,
        pendingDocuments,
        highRiskVendors,
      });

      setAiHealth({
        documentsValidated,
        flaggedForReview,
      });

      setRecentActivity(activity);
    } catch (error) {
      console.error("Failed to load viewer dashboard", error);
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
          Viewer Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Read-only compliance overview
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

      

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            AI System Health
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Documents Validated</span>
              <span className="font-bold">
                {aiHealth.documentsValidated}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Flagged for Review</span>
              <span className="font-bold text-yellow-600">
                {aiHealth.flaggedForReview}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Reports</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Reports Generated</span>
              <span className="font-bold">{reports.generated}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Approvals</span>
              <span className="font-bold text-yellow-600">
                {reports.pendingApprovals}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



function StatCard({ title, value, color = "gray" }) {
  const colors = {
    gray: "text-gray-900",
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}
