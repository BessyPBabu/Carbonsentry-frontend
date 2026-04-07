import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import reportService from '../../services/reportService';
import api from '../../services/api';

const REPORT_TYPES = [
    { value: 'vendor_risk',        label: 'Vendor Risk Report',   requiresVendor: true },
    { value: 'vendor_compliance_report', label: 'Vendor Compliance Report (SEBI/CBAM)', requiresVendor: true },
    { value: 'compliance_summary', label: 'Compliance Summary',   requiresVendor: false },
    { value: 'emissions_overview', label: 'Emissions Overview',   requiresVendor: false },
    { value: 'document_audit',     label: 'Document Audit Report', requiresVendor: false },
];

export default function GenerateReportModal({ onClose, onGenerated }) {
    const [formData, setFormData] = useState({
        report_type: 'vendor_risk',
        title: '',
        vendor_id: '',
        date_from: '',
        date_to: '',
    });

    const [vendors, setVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const selectedType = REPORT_TYPES.find((t) => t.value === formData.report_type);

    // load vendors for the vendor selector
    useEffect(() => {
        const load = async () => {
            try {
                setLoadingVendors(true);
                const res = await api.get('/vendors/');
                const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
                setVendors(list);
            } catch (err) {
                console.error('GenerateReportModal: failed to load vendors:', err);
            } finally {
                setLoadingVendors(false);
            }
        };
        load();
    }, []);

    // auto-fill title when type or vendor changes
    useEffect(() => {
        const typeLabel = selectedType?.label || '';
        if (formData.vendor_id) {
            const vendor = vendors.find((v) => v.id === formData.vendor_id);
            if (vendor) {
                setFormData((prev) => ({ ...prev, title: `${typeLabel} — ${vendor.name}` }));
                return;
            }
        }
        setFormData((prev) => ({ ...prev, title: typeLabel }));
    }, [formData.report_type, formData.vendor_id, vendors]);

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setError('');
        // clear vendor when switching to a type that doesn't need one
        if (key === 'report_type') {
            const newType = REPORT_TYPES.find((t) => t.value === value);
            if (!newType?.requiresVendor) {
                setFormData((prev) => ({ ...prev, [key]: value, vendor_id: '' }));
                return;
            }
        }
    };

    const validate = () => {
        if (!formData.title.trim()) {
            setError('Report title is required');
            return false;
        }
        if (selectedType?.requiresVendor && !formData.vendor_id) {
            setError('Please select a vendor for this report type');
            return false;
        }
        if (formData.date_from && formData.date_to && formData.date_from > formData.date_to) {
            setError('"Date From" cannot be after "Date To"');
            return false;
        }
        return true;
    };

    const handleGenerate = async () => {
        if (!validate()) return;

        try {
            setGenerating(true);
            setError('');

            const payload = {
                report_type: formData.report_type,
                title: formData.title.trim(),
            };
            if (formData.vendor_id) payload.vendor_id = formData.vendor_id;
            if (formData.date_from)  payload.date_from = formData.date_from;
            if (formData.date_to)    payload.date_to = formData.date_to;

            const report = await reportService.generateReport(payload);
            toast.success('Report generated successfully');
            onGenerated(report);
        } catch (err) {
            console.error('GenerateReportModal.handleGenerate:', err);
            const msg = err.response?.data?.error || 'Failed to generate report. Please try again.';
            setError(msg);
        } finally {
            setGenerating(false);
        }
    };

    // close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">

                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Generate Report</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 py-4 flex flex-col gap-4">

                    {/* Report type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                        <select
                            value={formData.report_type}
                            onChange={(e) => handleChange('report_type', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {REPORT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Vendor selector — only for vendor_risk */}
                    {selectedType?.requiresVendor && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vendor <span className="text-red-500">*</span>
                            </label>
                            {loadingVendors ? (
                                <p className="text-sm text-gray-400">Loading vendors...</p>
                            ) : (
                                <select
                                    value={formData.vendor_id}
                                    onChange={(e) => handleChange('vendor_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select a vendor</option>
                                    {vendors.map((v) => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Report Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Enter report title"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Date range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date From <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.date_from}
                                onChange={(e) => handleChange('date_from', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date To <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.date_to}
                                onChange={(e) => handleChange('date_to', e.target.value)}
                                min={formData.date_from || undefined}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {generating ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>
        </div>
    );
}