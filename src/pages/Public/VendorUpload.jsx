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

// one row per document — handles its own file selection and upload state
function DocumentRow({ doc, token, onUploaded }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('document_id', doc.id);
            form.append('file', file);

            // correct URL: token goes in the path, NOT as a query param
            await axios.post(
                `${PUBLIC_BASE}/api/vendors/upload/${token}/`,
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            toast.success(`${doc.document_type} uploaded successfully`);
            setFile(null);
            // reset the hidden file input so the same file can be re-selected if needed
            if (inputRef.current) inputRef.current.value = '';
            onUploaded();
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
                        {file ? file.name : 'Choose file (PDF, JPG, PNG, DOCX)'}
                    </span>
                </label>

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="px-4 py-2 bg-[#1a8f70] text-white text-sm rounded-lg hover:bg-[#157a5f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                    {uploading ? 'Uploading…' : 'Upload'}
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

function SuccessScreen({ vendorName }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents Submitted</h2>
                <p className="text-gray-600 mb-6">
                    Thank you, <strong>{vendorName}</strong>. Your compliance documents have been
                    received and are being reviewed by CarbonSentry AI.
                </p>
                <div className="bg-white border rounded-xl p-4 text-left space-y-2 mb-6">
                    {['Documents securely received', 'AI validation in progress', 'Your compliance officer will be notified'].map((line) => (
                        <div key={line} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-emerald-500">✓</span> {line}
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
    const [allDone, setAllDone]       = useState(false);

    // track whether we successfully loaded at least one document
    // so we can show the success screen when the last one is uploaded
    // (after the last upload, the backend returns an empty pending list,
    //  so we can't use docs.length > 0 alone)
    const hadDocumentsRef = useRef(false);

    const fetchData = async () => {
        try {
            // GET /api/vendors/upload/{token}/ — returns vendor info + pending_documents
            const res = await axios.get(`${PUBLIC_BASE}/api/vendors/upload/${token}/`);
            const data = res.data;

            setVendorInfo({
                name:         data.vendor_name || data.name,
                organization: data.organization_name,
            });

            // backend key is `pending_documents`, NOT `documents`
            const docs = (data.pending_documents || []).map((d) => ({
                ...d,
                // status isn't returned by GET (all are pending by definition),
                // but we set it explicitly so DocumentRow and StatusBadge work correctly
                status: d.status || 'pending',
            }));

            setDocuments(docs);

            if (docs.length > 0) {
                hadDocumentsRef.current = true;
            }

            // show success when there are no more pending docs AND we know
            // the vendor had documents to upload in the first place
            if (docs.length === 0 && hadDocumentsRef.current) {
                setAllDone(true);
            }
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

    useEffect(() => {
        fetchData();
    }, [token]);

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

    if (allDone) return <SuccessScreen vendorName={vendorInfo?.name} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50">

            {/* sticky header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#1a8f70] rounded-lg flex items-center justify-center flex-shrink-0">
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

                {/* vendor welcome card */}
                <div className="bg-white rounded-2xl border p-6 mb-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
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
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-orange-400" />
                            {documents.length} document{documents.length !== 1 ? 's' : ''} awaiting upload
                        </div>
                    </div>
                </div>

                {/* instructions */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800 font-medium mb-1">How it works</p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Click "Choose file" next to each document type</li>
                        <li>Select your file — accepted formats: PDF, JPG, PNG, DOCX</li>
                        <li>Click Upload — CarbonSentry AI will verify it automatically</li>
                    </ol>
                </div>

                {/* document list */}
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
                                onUploaded={fetchData}
                            />
                        ))
                    )}
                </div>

                {/* trust footer */}
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