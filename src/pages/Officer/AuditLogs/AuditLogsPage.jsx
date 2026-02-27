import React, { useState, useEffect, useCallback } from 'react';
import auditLogService from '../../../services/auditLogService';
import Pagination from '../../../components/Common/Pagination';

const PAGE_SIZE = 10;

const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

const ACTION_COLORS = {
    vendor_created:       'bg-green-100 text-green-700',
    vendor_updated:       'bg-blue-100 text-blue-700',
    document_uploaded:    'bg-purple-100 text-purple-700',
    validation_triggered: 'bg-yellow-100 text-yellow-700',
    validation_completed: 'bg-green-100 text-green-700',
    review_resolved:      'bg-indigo-100 text-indigo-700',
    message_sent:         'bg-teal-100 text-teal-700',
    user_login:           'bg-gray-100 text-gray-600',
    user_logout:          'bg-gray-100 text-gray-600',
    report_generated:     'bg-orange-100 text-orange-700',
    report_approved:      'bg-green-100 text-green-700',
};

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [actionChoices, setActionChoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [filters, setFilters] = useState({
        action: '',
        dateFrom: '',
        dateTo: '',
    });

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
        
            const data = await auditLogService.getLogs({ ...filters, page, page_size: PAGE_SIZE });

            if (data && typeof data === 'object' && 'results' in data) {
                
                setLogs(data.results);
                setTotalCount(data.count);
                setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            } else {
               
                const list = Array.isArray(data) ? data : [];
                setLogs(list);
                setTotalCount(list.length);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('AuditLogsPage.fetchLogs:', err);
            setError('Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        auditLogService.getActionChoices()
            .then(setActionChoices)
            .catch((err) => console.error('AuditLogsPage: failed to load action choices:', err));
    }, []);

    const handleFilterChange = (key, value) => {
        // reset to page 1 whenever a filter changes
        setPage(1);
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExport = () => {
        try {
            auditLogService.exportCsv(filters);
        } catch (err) {
            console.error('AuditLogsPage.handleExport:', err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                    <p className="text-gray-500 mt-1 text-sm">Full activity trail for your organization</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                    Export CSV
                </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">All Actions</option>
                    {actionChoices.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {(filters.action || filters.dateFrom || filters.dateTo) && (
                    <button
                        onClick={() => {
                            setPage(1);
                            setFilters({ action: '', dateFrom: '', dateTo: '' });
                        }}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="bg-white border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                        Loading audit logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                        No audit logs found for the selected filters.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actor</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="font-medium text-gray-800">{log.actor_name}</div>
                                        <div className="text-xs text-gray-400">{log.actor_email}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-600">
                                        <span className="font-medium">{log.entity_type}</span>
                                        {log.entity_id && (
                                            <span className="text-xs text-gray-400 ml-1">
                                                #{log.entity_id.slice(0, 8)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                                        {log.details && Object.keys(log.details).length > 0
                                            ? Object.entries(log.details)
                                                .map(([k, v]) => `${k}: ${v}`)
                                                .join(', ')
                                            : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-gray-400 text-xs">
                                        {log.ip_address || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination row */}
            {!loading && totalCount > 0 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <span>
                        Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} entries
                    </span>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;