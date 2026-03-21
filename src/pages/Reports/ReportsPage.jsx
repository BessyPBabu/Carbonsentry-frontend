import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import reportService from '../../services/reportService';
import GenerateReportModal from '../../components/Reports/GenerateReportModal';
import { useAuth } from '../../context/AuthContext';

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const STATUS_COLORS = {
    draft:     'bg-gray-100 text-gray-600',
    generated: 'bg-blue-100 text-blue-700',
    approved:  'bg-green-100 text-green-700',
};

const REPORT_TYPE_LABELS = {
    vendor_risk:        'Vendor Risk Report',
    compliance_summary: 'Compliance Summary',
    emissions_overview: 'Emissions Overview',
    document_audit:     'Document Audit Report',
};

export default function ReportsPage() {
    const navigate = useNavigate();
    const { role } = useAuth();

    const [reports, setReports]               = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState('');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [downloadingId, setDownloadingId]   = useState(null);

    const [filters, setFilters] = useState({ report_type: '', status: '' });

    const basePath = role === 'admin' ? '/admin' : '/officer';

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await reportService.getReports(filters);
            setReports(data);
        } catch (err) {
            console.error('ReportsPage.fetchReports:', err);
            setError('Failed to load reports.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleDelete = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await reportService.deleteReport(reportId);
            setReports((prev) => prev.filter((r) => r.id !== reportId));
            toast.success('Report deleted');
        } catch (err) {
            console.error('ReportsPage.handleDelete:', err);
            toast.error('Failed to delete report');
        }
    };

    const handleDownloadPdf = async (report) => {
        setDownloadingId(report.id);
        try {
            const filename = `${report.title.replace(/\s+/g, '_')}.pdf`;
            await reportService.downloadPdf(report.id, filename);
        } catch {
            toast.error('Failed to download PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleReportGenerated = (newReport) => {
        setReports((prev) => [newReport, ...prev]);
        setShowGenerateModal(false);
        navigate(`${basePath}/reports/${newReport.id}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-500 mt-1 text-sm">Generate and manage compliance reports</p>
                </div>
                {role !== 'viewer' && (
                    <button
                        onClick={() => setShowGenerateModal(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        + Generate Report
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select
                    value={filters.report_type}
                    onChange={(e) => handleFilterChange('report_type', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                        focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Report Types</option>
                    <option value="vendor_risk">Vendor Risk Report</option>
                    <option value="compliance_summary">Compliance Summary</option>
                    <option value="emissions_overview">Emissions Overview</option>
                    <option value="document_audit">Document Audit Report</option>
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                        focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="generated">Generated</option>
                    <option value="approved">Approved</option>
                </select>

                {(filters.report_type || filters.status) && (
                    <button
                        onClick={() => setFilters({ report_type: '', status: '' })}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                    <button onClick={fetchReports} className="ml-3 underline hover:no-underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Report list */}
            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                        Loading reports…
                    </div>
                ) : reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-3">
                        <p>No reports found.</p>
                        {role !== 'viewer' && (
                            <button
                                onClick={() => setShowGenerateModal(true)}
                                className="text-emerald-600 hover:underline text-sm"
                            >
                                Generate your first report
                            </button>
                        )}
                    </div>
                ) : (
                    reports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            role={role}
                            basePath={basePath}
                            downloadingId={downloadingId}
                            onView={() => navigate(`${basePath}/reports/${report.id}`)}
                            onDownloadPdf={() => handleDownloadPdf(report)}
                            onDelete={() => handleDelete(report.id)}
                        />
                    ))
                )}
            </div>

            {showGenerateModal && (
                <GenerateReportModal
                    onClose={() => setShowGenerateModal(false)}
                    onGenerated={handleReportGenerated}
                />
            )}
        </div>
    );
}

function ReportCard({ report, role, basePath, downloadingId, onView, onDownloadPdf, onDelete }) {
    return (
        <div className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">

                {/* Left */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                            {report.title}
                        </h3>
                        {/* FIX: replaced flex-shrink-0 with shrink-0 */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0
                            ${STATUS_COLORS[report.status] || 'bg-gray-100 text-gray-600'}`}>
                            {report.status}
                        </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                        <span>{REPORT_TYPE_LABELS[report.report_type] || report.report_type}</span>
                        {report.vendor_name && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span>{report.vendor_name}</span>
                            </>
                        )}
                        <span className="text-gray-300">•</span>
                        <span>By {report.generated_by_name || '—'}</span>
                        <span className="text-gray-300">•</span>
                        <span>{formatDate(report.generated_at)}</span>
                    </div>

                    {report.status === 'approved' && report.approved_by_name && (
                        <p className="text-xs text-green-600 mt-2">
                            ✓ Approved by {report.approved_by_name} on {formatDate(report.approved_at)}
                        </p>
                    )}
                </div>

                {/* Right — FIX: replaced flex-shrink-0 with shrink-0 */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onView}
                        className="px-3 py-1.5 text-sm text-emerald-600 border border-emerald-200
                            rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                        View
                    </button>

                    {report.status !== 'draft' && (
                        <button
                            onClick={onDownloadPdf}
                            disabled={downloadingId === report.id}
                            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200
                                rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {downloadingId === report.id ? 'Downloading…' : 'PDF'}
                        </button>
                    )}

                    {role !== 'viewer' && report.status !== 'approved' && (
                        <button
                            onClick={onDelete}
                            className="px-3 py-1.5 text-sm text-red-600 border border-red-200
                                rounded-lg hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}