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

    const [userOverview, setUserOverview] = useState({
        totalUsers: 0,
        officers: 0,
        viewers: 0,
    });

    const [reportsStats, setReportsStats] = useState({
        generated: 0,
        pendingApprovals: 0,
    });

    const [highRiskList, setHighRiskList] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    const [monitor, setMonitor] = useState(null);
    const [monitorLoading, setMonitorLoading] = useState(true);
    const [grafanaUrl, setGrafanaUrl] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        fetchMonitoringData();
    }, []);

    const fetchMonitoringData = async () => {
        try {
            setMonitorLoading(true);
            const res = await api.get("/ai-validation/monitoring/");
            setMonitor(res.data.metrics);
            setGrafanaUrl(res.data.grafana_url || null);
        } catch (err) {
            console.error("AdminDashboard.fetchMonitoringData:", err);
            setMonitor(null);
        } finally {
            setMonitorLoading(false);
        }
    };

    const fetchDashboardData = async () => {
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

            const profiles =
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

            const compliant = vendors.filter(
                (v) => v.compliance_status === "compliant"
            ).length;

            const pending = documents.filter((d) => d.status === "pending").length;

            const highRisk = vendors.filter((v) =>
                ["high", "critical"].includes(v.risk_level)
            ).length;

            setStats({
                totalVendors: vendors.length,
                compliantVendors: compliant,
                pendingDocuments: pending,
                highRiskVendors: highRisk,
            });

            const rate =
                vendors.length > 0
                    ? Math.round((compliant / vendors.length) * 100)
                    : 0;

            const expiredVendors = [
                ...new Set(
                    documents
                        .filter((d) => d.status === "expired")
                        .map((d) => d.vendor_id)
                        .filter(Boolean)
                ),
            ].length;

            const avgScore =
                profiles.length > 0
                    ? (
                          profiles.reduce(
                              (s, p) => s + (parseFloat(p.risk_score) || 0),
                              0
                          ) /
                          profiles.length /
                          20
                      ).toFixed(1)
                    : "0.0";

            setRiskSummary({
                complianceRate: rate,
                vendorsWithExpiredDocs: expiredVendors,
                aiReviewQueueItems: reviews.length,
                avgRiskScore: avgScore,
            });

            setHighRiskList(
                profiles
                    .filter((p) =>
                        ["high", "critical"].includes(p.risk_level)
                    )
                    .slice(0, 5)
                    .map((p) => ({
                        vendor: p.vendor_name,
                        riskLevel: p.risk_level,
                        reason:
                            p.flagged_documents > 0
                                ? "Flagged documents"
                                : p.exceeds_threshold
                                ? "Exceeds emission threshold"
                                : "High risk score",
                    }))
            );

            setReportsStats({
                generated: reports.length,
                pendingApprovals: reports.filter(
                    (r) => r.status === "generated"
                ).length,
            });

            setRecentActivity(
                auditLogs.slice(0, 5).map((log) => {
                    const detail =
                        typeof log.details === "object" && log.details !== null
                            ? Object.values(log.details)[0] || log.entity_type
                            : log.entity_type;

                    return {
                        label: `${(log.action || "").replace(
                            /_/g,
                            " "
                        )} — ${detail}`,
                    };
                })
            );

            try {
                const usersRes = await api.get("/accounts/users/");
                const users = usersRes.data.results || usersRes.data || [];

                setUserOverview({
                    totalUsers: users.length,
                    officers: users.filter((u) => u.role === "officer").length,
                    viewers: users.filter((u) => u.role === "viewer").length,
                });
            } catch {}

        } catch (err) {
            console.error("AdminDashboard.fetchDashboardData:", err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center min-h-screen text-gray-600">
                Loading dashboard…
            </div>
        );
    }

    return (
        <div className="p-8">

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                    Organization Risk & Compliance Overview
                </p>
            </div>

            {/* Stats */}

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

            {/* AI Monitor + Risk Summary */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                <div className="bg-white rounded-lg border p-6">

                    <div className="flex items-center justify-between mb-4">

                        <h3 className="text-base font-semibold text-gray-900">
                            AI System Monitor
                        </h3>

                        <div className="flex items-center gap-2">

                            {grafanaUrl && (
                                <a
                                    href={grafanaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-600 border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                                >
                                    Open Grafana ↗
                                </a>
                            )}

                            <button
                                onClick={fetchMonitoringData}
                                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50"
                                title="Refresh metrics"
                            >
                                ↻
                            </button>

                        </div>
                    </div>

                    {monitorLoading ? (
                        <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
                            Loading metrics…
                        </div>
                    ) : monitor ? (
                        <AIMonitorPanel metrics={monitor} />
                    ) : (
                        <div className="h-44 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                            <span>Metrics unavailable</span>
                            <span className="text-xs">
                                Set PROMETHEUS_URL in .env to enable live data
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Risk Summary
                    </h3>

                    <div className="space-y-4">
                        <Row
                            label="Overall Compliance Rate:"
                            value={`${riskSummary.complianceRate}%`}
                            valueClass="text-green-600 font-semibold"
                        />

                        <Row
                            label="Vendors with Expired Docs:"
                            value={riskSummary.vendorsWithExpiredDocs}
                        />

                        <Row
                            label="AI Review Queue:"
                            value={riskSummary.aiReviewQueueItems}
                            valueClass="text-orange-600 font-semibold cursor-pointer hover:underline"
                            onClick={() => navigate("/admin/risk-analysis")}
                        />

                        <Row
                            label="Avg Risk Score:"
                            value={`${riskSummary.avgRiskScore} / 5`}
                        />
                    </div>
                </div>
            </div>

            {/* High Risk Vendors */}

            <div className="bg-white rounded-lg border p-6 mb-6">

                <h3 className="text-base font-semibold text-gray-900 mb-4">
                    High-Risk Vendors
                </h3>

                {highRiskList.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        No high-risk vendors found
                    </p>
                ) : (
                    <table className="w-full text-sm">

                        <thead>
                            <tr className="text-left text-xs text-gray-500 uppercase border-b">
                                <th className="pb-3 font-medium">Vendor</th>
                                <th className="pb-3 font-medium">Risk Level</th>
                                <th className="pb-3 font-medium">
                                    Primary Reason
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {highRiskList.map((v, i) => (
                                <tr key={i} className="hover:bg-gray-50">

                                    <td className="py-3 font-medium text-gray-900">
                                        {v.vendor}
                                    </td>

                                    <td className="py-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                v.riskLevel === "critical"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-orange-100 text-orange-700"
                                            }`}
                                        >
                                            {v.riskLevel.charAt(0).toUpperCase() +
                                                v.riskLevel.slice(1)}
                                        </span>
                                    </td>

                                    <td className="py-3 text-gray-600">
                                        {v.reason}
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
}

/* ---------------- AI Monitor Panel ---------------- */

function AIMonitorPanel({ metrics }) {

    const total =
        (metrics?.validations_valid || 0) +
        (metrics?.validations_invalid || 0) +
        (metrics?.validations_review || 0) +
        (metrics?.validations_failed || 0);

    const geminiTotal =
        (metrics?.gemini_success || 0) +
        (metrics?.gemini_failed || 0);

    const geminiSuccessPct =
        geminiTotal > 0
            ? Math.round((metrics.gemini_success / geminiTotal) * 100)
            : null;

    return (
        <div className="space-y-4">

            <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                    Validation pipeline
                </p>

                <div className="grid grid-cols-4 gap-2">

                    <MiniStat
                        label="Valid"
                        value={metrics?.validations_valid ?? "—"}
                        color="green"
                    />

                    <MiniStat
                        label="Invalid"
                        value={metrics?.validations_invalid ?? "—"}
                        color="red"
                    />

                    <MiniStat
                        label="Review"
                        value={metrics?.validations_review ?? "—"}
                        color="yellow"
                    />

                    <MiniStat
                        label="Failed"
                        value={metrics?.validations_failed ?? "—"}
                        color="gray"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">

                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">
                        Median confidence
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                        {metrics?.median_confidence != null
                            ? `${metrics.median_confidence}%`
                            : "—"}
                    </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">
                        P95 pipeline duration
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                        {metrics?.p95_duration_s != null
                            ? `${metrics.p95_duration_s}s`
                            : "—"}
                    </p>
                </div>

            </div>

            {geminiSuccessPct !== null && (
                <div className="flex items-center justify-between text-sm">

                    <span className="text-gray-600 text-xs">
                        Gemini API success rate
                    </span>

                    <div className="flex items-center gap-2">

                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${
                                    geminiSuccessPct >= 90
                                        ? "bg-green-500"
                                        : geminiSuccessPct >= 70
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                }`}
                                style={{ width: `${geminiSuccessPct}%` }}
                            />
                        </div>

                        <span className="text-xs font-medium text-gray-700">
                            {geminiSuccessPct}%
                        </span>

                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------------- Helper Components ---------------- */

function MiniStat({ label, value, color = "gray" }) {

    const colors = {
        green: "text-green-600",
        red: "text-red-600",
        yellow: "text-yellow-600",
        gray: "text-gray-700",
    };

    return (
        <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className={`text-lg font-bold ${colors[color]}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
    );
}

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

function Row({ label, value, valueClass = "font-semibold text-gray-900", onClick }) {
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