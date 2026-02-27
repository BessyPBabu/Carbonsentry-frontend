import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalVendors: 0,
    compliantVendors: 0,
    pendingDocuments: 0,
    highRiskVendors: 0,
  });

  const [riskSummary, setRiskSummary] = useState({
    complianceRate: 0,
    vendorsWithExpiredDocs: 0,
    aiReviewQueueItems: 0,
    avgRiskScore: "0.0",
  });

  const [aiHealth, setAiHealth] = useState({
    documentsValidated: 0,
    aiAccuracy: 0,
    flaggedForReview: 0,
  });

  const [userOverview, setUserOverview] = useState({
    totalUsers: 0,
    officers: 0,
    viewers: 0,
  });

  const [reportsStats, setReportsStats] = useState({
    generated: 0,
    pendingApprovals: 0,
  });

  const [highRiskVendorsList, setHighRiskVendorsList] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [vendorsRes, docsRes, riskRes, reviewsRes, reportsRes, auditRes] =
        await Promise.allSettled([
          api.get("/vendors/"),
          api.get("/vendors/documents/"),
          api.get("/ai-validation/risk-profiles/"),
          api.get("/ai-validation/manual-reviews/", {
            params: { status: "pending" },
          }),
          api.get("/reports/"),
          api.get("/audit_logs/"),
        ]);

      const vendors =
        vendorsRes.status === "fulfilled"
          ? vendorsRes.value.data.results || vendorsRes.value.data || []
          : [];

      const documents =
        docsRes.status === "fulfilled"
          ? docsRes.value.data.results || docsRes.value.data || []
          : [];

      const riskProfiles =
        riskRes.status === "fulfilled"
          ? riskRes.value.data.results || riskRes.value.data || []
          : [];

      const reviews =
        reviewsRes.status === "fulfilled"
          ? reviewsRes.value.data.results || reviewsRes.value.data || []
          : [];

      const reports =
        reportsRes.status === "fulfilled"
          ? reportsRes.value.data.results || reportsRes.value.data || []
          : [];

      const auditLogs =
        auditRes.status === "fulfilled"
          ? auditRes.value.data.results || auditRes.value.data || []
          : [];

      // ── Top Stats ──
      const compliantVendors = vendors.filter(
        (v) => v.compliance_status === "compliant"
      ).length;
      const pendingDocuments = documents.filter(
        (d) => d.status === "pending"
      ).length;
      const highRiskCount = vendors.filter(
        (v) => v.risk_level === "high" || v.risk_level === "critical"
      ).length;

      setStats({
        totalVendors: vendors.length,
        compliantVendors,
        pendingDocuments,
        highRiskVendors: highRiskCount,
      });

      // ── Risk Summary ──
      const complianceRate =
        vendors.length > 0
          ? Math.round((compliantVendors / vendors.length) * 100)
          : 0;

      const vendorsWithExpiredDocs = [
        ...new Set(
          documents
            .filter((d) => d.status === "expired")
            .map((d) => d.vendor_id)
            .filter(Boolean)
        ),
      ].length;

      const avgRiskScore =
        riskProfiles.length > 0
          ? (
              riskProfiles.reduce(
                (sum, p) => sum + (parseFloat(p.risk_score) || 0),
                0
              ) /
              riskProfiles.length /
              20
            ).toFixed(1)
          : "0.0";

      setRiskSummary({
        complianceRate,
        vendorsWithExpiredDocs,
        aiReviewQueueItems: reviews.length,
        avgRiskScore,
      });

      // ── AI Health ──
      const validatedDocs = documents.filter((d) => d.status === "valid").length;
      const flaggedDocs = documents.filter((d) => d.status === "flagged").length;
      const totalProcessed = validatedDocs + flaggedDocs;
      const aiAccuracy =
        totalProcessed > 0
          ? Math.round((validatedDocs / totalProcessed) * 100)
          : 0;

      setAiHealth({
        documentsValidated: validatedDocs,
        aiAccuracy,
        flaggedForReview: flaggedDocs,
      });

      // ── Reports ──
      const pendingApprovals = reports.filter(
        (r) => r.status === "generated"
      ).length;
      setReportsStats({ generated: reports.length, pendingApprovals });

      // ── High-Risk Vendors Table ──
      const highRisk = riskProfiles
        .filter((p) => p.risk_level === "high" || p.risk_level === "critical")
        .slice(0, 5)
        .map((p) => ({
          vendor: p.vendor_name,
          country: p.vendor_country || "—",
          riskLevel: p.risk_level,
          reason: p.flagged_documents > 0
            ? "Flagged documents"
            : p.exceeds_threshold
            ? "Exceeds emission threshold"
            : "High risk score",
        }));
      setHighRiskVendorsList(highRisk);

      // ── Recent Activity ──
      const activity = auditLogs.slice(0, 5).map((log) => {
        const details =
          typeof log.details === "object" && log.details !== null
            ? Object.values(log.details)[0] || log.entity_type
            : log.details || log.entity_type;
        return {
          label: `${(log.action || "").replace(/_/g, " ")} — ${details}`,
        };
      });
      setRecentActivity(activity);

      // ── User Overview (non-critical) ──
      try {
        const usersRes = await api.get("/accounts/users/");
        const users = usersRes.data.results || usersRes.data || [];
        setUserOverview({
          totalUsers: users.length,
          officers: users.filter((u) => u.role === "officer").length,
          viewers: users.filter((u) => u.role === "viewer").length,
        });
      } catch {
        /* non-critical */
      }
    } catch (error) {
      console.error("Failed to load admin dashboard", error);
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
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Organization Risk & Compliance Overview</p>
      </div>

      {/* ── Top Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Vendors" value={stats.totalVendors} />
        <StatCard
          title="Compliant Vendors"
          value={stats.compliantVendors}
          color="green"
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

      {/* ── Global Risk Map + Risk Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Global Vendor Risk Distribution
          </h3>
          <div className="h-44 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            🌍 Global Map Placeholder
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Color-coded by average vendor risk score per region
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Risk Summary
          </h3>
          <div className="space-y-4">
            <SummaryRow
              label="Overall Compliance Rate:"
              value={`${riskSummary.complianceRate}%`}
              valueClass="text-green-600 font-semibold"
            />
            <SummaryRow
              label="Vendors with Expired Docs:"
              value={riskSummary.vendorsWithExpiredDocs}
            />
            <SummaryRow
              label="AI Review Queue Items:"
              value={riskSummary.aiReviewQueueItems}
              valueClass="text-orange-600 font-semibold"
              onClick={() => navigate("/admin/risk-analysis")}
            />
            <SummaryRow
              label="Average Risk Score:"
              value={riskSummary.avgRiskScore}
            />
          </div>
        </div>
      </div>

      {/* ── AI Health + User Overview + Reports ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <InfoCard title="AI System Health">
          <SummaryRow label="Documents Validated:" value={aiHealth.documentsValidated} />
          <SummaryRow
            label="AI Accuracy:"
            value={`${aiHealth.aiAccuracy}%`}
            valueClass="text-green-600 font-semibold"
          />
          <SummaryRow
            label="Flagged for Review:"
            value={aiHealth.flaggedForReview}
            valueClass="text-orange-600 font-semibold"
          />
        </InfoCard>

        <InfoCard title="User Overview">
          <SummaryRow label="Total Users:" value={userOverview.totalUsers} />
          <SummaryRow label="Compliance Officers:" value={userOverview.officers} />
          <SummaryRow label="Viewers:" value={userOverview.viewers} />
        </InfoCard>

        <InfoCard title="Reports">
          <SummaryRow label="Reports Generated:" value={reportsStats.generated} />
          <SummaryRow
            label="Pending Approvals:"
            value={reportsStats.pendingApprovals}
            valueClass="text-yellow-600 font-semibold"
          />
        </InfoCard>
      </div>

      {/* ── High-Risk Vendors Table ── */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          High-Risk Vendors
        </h3>
        {highRiskVendorsList.length === 0 ? (
          <p className="text-sm text-gray-400">No high-risk vendors found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="pb-3 font-medium">Vendor</th>
                <th className="pb-3 font-medium">Country</th>
                <th className="pb-3 font-medium">Risk Level</th>
                <th className="pb-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {highRiskVendorsList.map((v, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{v.vendor}</td>
                  <td className="py-3 text-gray-600">{v.country}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        v.riskLevel === "critical"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {v.riskLevel.charAt(0).toUpperCase() + v.riskLevel.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{v.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Recent Activity ── */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400">No recent activity</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((a, i) => (
              <li key={i} className="text-sm text-gray-700 capitalize">
                • {a.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Shared helpers ── */

function StatCard({ title, value, color = "gray" }) {
  const colors = {
    gray: "text-gray-900",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, valueClass = "font-semibold text-gray-900", onClick }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">{label}</span>
      <span
        className={valueClass + (onClick ? " cursor-pointer hover:underline" : "")}
        onClick={onClick}
      >
        {value}
      </span>
    </div>
  );
}