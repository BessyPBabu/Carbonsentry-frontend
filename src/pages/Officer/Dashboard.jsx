import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

const STATUS_COLORS = {
  valid:    "text-green-600",
  pending:  "text-yellow-600",
  expired:  "text-red-600",
  flagged:  "text-orange-600",
  uploaded: "text-blue-600",
  invalid:  "text-red-600",
};

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalVendors:        0,
    pendingUploads:      0,
    aiValidationRunning: 0,
    reviewQueue:         0,
  });

  const [reviewQueueItems, setReviewQueueItems] = useState([]);
  const [highRiskVendors,  setHighRiskVendors]  = useState([]);
  const [recentDocuments,  setRecentDocuments]  = useState([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      // use dedicated stats/count endpoints so numbers are accurate across all pages
      const [
        vendorsRes,
        validationStatsRes,
        reviewsRes,
        riskStatsRes,
        highRiskRes,
        recentDocsRes,
      ] = await Promise.allSettled([
        api.get("/vendors/", { params: { page: 1, page_size: 1 } }),
        api.get("/ai-validation/validations/statistics/"),
        api.get("/ai-validation/manual-reviews/", { params: { status: "pending", page_size: 5 } }),
        api.get("/ai-validation/risk-profiles/dashboard_stats/"),
        api.get("/ai-validation/risk-profiles/high_risk/"),
        api.get("/vendors/documents/", { params: { page: 1, page_size: 5 } }),
      ]);

      // total vendor count from paginated response
      const totalVendors =
        vendorsRes.status === "fulfilled"
          ? vendorsRes.value.data.count || 0
          : 0;

      // validation stats from the dedicated /statistics/ endpoint
      const valStats =
        validationStatsRes.status === "fulfilled"
          ? validationStatsRes.value.data
          : {};

      // pending upload count — documents with status=pending
      let pendingUploads = 0;
      try {
        const pRes = await api.get("/vendors/documents/", {
          params: { status: "pending", page: 1, page_size: 1 },
        });
        pendingUploads = pRes.data.count || 0;
      } catch (err) {
        console.error("OfficerDashboard: pending count failed", err);
      }

      const reviews =
        reviewsRes.status === "fulfilled"
          ? reviewsRes.value.data.results || reviewsRes.value.data || []
          : [];

      const reviewCount =
        reviewsRes.status === "fulfilled"
          ? reviewsRes.value.data.count || reviews.length
          : 0;

      setStats({
        totalVendors,
        pendingUploads,
        aiValidationRunning: valStats.processing || 0,
        reviewQueue:         reviewCount,
      });

      setReviewQueueItems(reviews.slice(0, 5));

      // high risk from dedicated endpoint — already filtered server-side
      const highRisk =
        highRiskRes.status === "fulfilled"
          ? highRiskRes.value.data.results || highRiskRes.value.data || []
          : [];
      setHighRiskVendors(highRisk.slice(0, 5));

      // 5 most recent documents
      const docs =
        recentDocsRes.status === "fulfilled"
          ? recentDocsRes.value.data.results || recentDocsRes.value.data || []
          : [];
      setRecentDocuments(docs);

    } catch (err) {
      console.error("OfficerDashboard.fetchDashboardData:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
        <p className="text-gray-600 mt-1">Operational Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Vendors"         value={stats.totalVendors} />
        <StatCard title="Pending Uploads"       value={stats.pendingUploads}       color="yellow" />
        <StatCard title="AI Validation Running" value={stats.aiValidationRunning} />
        <StatCard title="Review Queue"          value={stats.reviewQueue}          color="red" />
      </div>

      {/* AI Review Queue + High-Risk side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">AI Review Queue</h3>
          {reviewQueueItems.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No items pending review</p>
          ) : (
            <div className="space-y-3 mb-4">
              {reviewQueueItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800 truncate max-w-[60%]">
                    {item.validation?.vendor_name || "—"}
                  </span>
                  <span className="text-yellow-600 text-xs capitalize ml-2">
                    {(item.reason || "").replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate("/officer/ai-review-queue")}
            className="px-4 py-2 bg-[#1a8f70] text-white text-sm rounded-lg hover:bg-[#157a5f] transition-colors"
          >
            Go to Review Queue
          </button>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">High-Risk Vendors</h3>
          {highRiskVendors.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No high-risk vendors</p>
          ) : (
            <div className="space-y-3 mb-4">
              {highRiskVendors.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800 truncate max-w-[60%]">
                    {p.vendor_name}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      p.risk_level === "critical" ? "text-red-600" : "text-orange-600"
                    }`}
                  >
                    {p.risk_level.charAt(0).toUpperCase() + p.risk_level.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate("/officer/risk-analysis")}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Risk Analysis
          </button>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Documents</h3>
        {recentDocuments.length === 0 ? (
          <p className="text-sm text-gray-400">No documents found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="pb-3 font-medium">Vendor</th>
                <th className="pb-3 font-medium">Document</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{doc.vendor_name || "—"}</td>
                  <td className="py-3 text-gray-600">{doc.document_type || "—"}</td>
                  <td className="py-3">
                    <span className={`font-medium capitalize ${STATUS_COLORS[doc.status] || "text-gray-600"}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{doc.expiry_date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "gray" }) {
  const colors = {
    gray:   "text-gray-900",
    yellow: "text-yellow-600",
    red:    "text-red-600",
    green:  "text-green-600",
  };
  return (
    <div className="bg-white rounded-lg border p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}