import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PUBLIC_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const STATUS_LABEL = {
    pending: { label: 'Awaiting Upload', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    invalid: { label: 'Rejected',        color: 'text-red-600 bg-red-50 border-red-200' },
    expired: { label: 'Expired',         color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_LABEL[status] || STATUS_LABEL.pending;
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}

function DocumentRow({ doc, token, onUploaded }) {
    const [file, setFile]           = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded]   = useState(false);  // ← per-row success flag
    const inputRef = useRef(null);

    // If the document was already uploaded before this render cycle, show success immediately
    useEffect(() => {
        if (doc.status === 'uploaded' || doc.status === 'valid') {
            setUploaded(true);
        }
    }, [doc.status]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('document_id', doc.id);
            form.append('file', file);

            await axios.post(
                `${PUBLIC_BASE}/api/vendors/upload/${token}/`,
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setUploaded(true);
            setFile(null);
            if (inputRef.current) inputRef.current.value = '';
            onUploaded(doc.id);   // notify parent which doc just finished
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                'Upload failed. Please try again.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    // ── Uploaded success state ────────────────────────────────────────────────
    if (uploaded) {
        return (
            <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-emerald-800 truncate">{doc.document_type}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Uploaded successfully — AI validation in progress</p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-300 bg-white text-emerald-700 shrink-0">
                    Uploaded
                </span>
            </div>
        );
    }

    // ── Default upload state ──────────────────────────────────────────────────
    return (
        <div className="border rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-gray-900 truncate">{doc.document_type}</p>
                <StatusBadge status={doc.status || 'pending'} />
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
                <label className="flex-1 min-w-0 cursor-pointer">
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files[0] || null)}
                    />
                    <span className={`block w-full px-3 py-2 text-sm border rounded-lg truncate transition-colors
                        ${file
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}>
                        {file ? file.name : 'Choose file — PDF, JPG, PNG, DOCX'}
                    </span>
                </label>

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="px-4 py-2 bg-[#1a8f70] text-white text-sm rounded-lg
                        hover:bg-[#157a5f] disabled:opacity-40 disabled:cursor-not-allowed
                        transition-colors shrink-0"
                >
                    {uploading ? (
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Uploading…
                        </span>
                    ) : 'Upload'}
                </button>
            </div>

            {doc.status === 'invalid' && (
                <p className="mt-2 text-xs text-red-600">
                    Rejected — please upload the correct document
                </p>
            )}
        </div>
    );
}

function SuccessScreen({ vendorName, uploadedDocs }) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">All Documents Submitted</h2>
                <p className="text-gray-600 mb-6">
                    Thank you, <strong>{vendorName}</strong>. All your compliance documents have been
                    received and are being reviewed by CarbonSentry AI.
                </p>

                {/* List every uploaded document */}
                <div className="bg-gray-50 border rounded-xl p-4 text-left space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Documents submitted
                    </p>
                    {uploadedDocs.map((name, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{name}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2 mb-6">
                    {[
                        'Documents securely received',
                        'AI validation in progress',
                        'Your compliance officer will be notified',
                    ].map((line) => (
                        <div key={line} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-blue-500">→</span> {line}
                        </div>
                    ))}
                </div>

                <p className="text-xs text-gray-400">Powered by CarbonSentry · Secure Carbon Compliance Platform</p>
            </div>
        </div>
    );
}

export default function VendorUpload() {
    const { token } = useParams();

    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [vendorInfo, setVendorInfo] = useState(null);
    const [documents, setDocuments]   = useState([]);

    // Track which doc IDs have been uploaded in this session
    const [uploadedIds, setUploadedIds]     = useState(new Set());
    const [uploadedNames, setUploadedNames] = useState([]);

    const fetchData = async () => {
        try {
            const res  = await axios.get(`${PUBLIC_BASE}/api/vendors/upload/${token}/`);
            const data = res.data;

            setVendorInfo({
                name:         data.vendor_name || data.name,
                organization: data.organization_name,
            });

            const docs = (data.pending_documents || []).map((d) => ({
                ...d,
                status: d.status || 'pending',
            }));

            setDocuments(docs);
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.error;
            if (err?.response?.status === 404 || msg?.toLowerCase().includes('expired')) {
                setError(
                    'This upload link has expired or is no longer valid. ' +
                    'Please contact your compliance officer for a new link.'
                );
            } else {
                setError('Unable to load your upload page. Please check the link or contact support.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    // Called by DocumentRow when a specific doc finishes uploading
    const handleDocUploaded = (docId) => {
        const doc = documents.find((d) => d.id === docId);

        setUploadedIds((prev) => new Set([...prev, docId]));
        if (doc) {
            setUploadedNames((prev) => [...prev, doc.document_type]);
        }
    };

    // All documents done = every document in the list has been uploaded this session
    const allUploaded =
        documents.length > 0 &&
        documents.every((d) => uploadedIds.has(d.id));

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading your upload page…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Link Unavailable</h2>
                    <p className="text-gray-600 text-sm">{error}</p>
                    <p className="text-xs text-gray-400 mt-6">CarbonSentry · Carbon Compliance Platform</p>
                </div>
            </div>
        );
    }

    // Show success screen only once EVERY document has been uploaded
    if (allUploaded) {
        return <SuccessScreen vendorName={vendorInfo?.name} uploadedDocs={uploadedNames} />;
    }

    const pendingCount = documents.filter((d) => !uploadedIds.has(d.id)).length;

    return (
        <div className="min-h-screen bg-gray-50">

            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#1a8f70] rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 text-lg">CarbonSentry</span>
                            <p className="text-xs text-gray-400 leading-none">Carbon Compliance Platform</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Secure Upload
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8">

                <div className="bg-white rounded-2xl border p-6 mb-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-2xl font-bold text-emerald-700">
                                {(vendorInfo?.name || '?').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{vendorInfo?.name}</h1>
                            {vendorInfo?.organization && (
                                <p className="text-sm text-gray-500">
                                    Compliance portal for {vendorInfo.organization}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm">
                        {uploadedIds.size > 0 && (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                {uploadedIds.size} uploaded
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-orange-400" />
                            {pendingCount} remaining
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800 font-medium mb-1">How it works</p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Click "Choose file" next to each document type</li>
                        <li>Select your file — accepted: PDF, JPG, PNG, DOCX</li>
                        <li>Click Upload — CarbonSentry AI will verify it automatically</li>
                    </ol>
                </div>

                <div className="space-y-3">
                    <h2 className="font-semibold text-gray-800">Required Documents</h2>
                    {documents.length === 0 ? (
                        <div className="bg-white border rounded-xl p-8 text-center text-gray-400 text-sm">
                            No pending documents found for this link.
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <DocumentRow
                                key={doc.id}
                                doc={doc}
                                token={token}
                                onUploaded={handleDocUploaded}
                            />
                        ))
                    )}
                </div>

                <div className="mt-10 pt-6 border-t text-center space-y-2">
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            256-bit encrypted
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            GDPR compliant
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI verified
                        </span>
                    </div>
                    <p className="text-xs text-gray-300">
                        © {new Date().getFullYear()} CarbonSentry · Secure Carbon Compliance Platform
                    </p>
                </div>
            </div>
        </div>
    );
}