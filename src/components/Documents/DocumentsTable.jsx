import { useState } from 'react';
import { RefreshCw, Eye, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import DocumentStatusBadge, { RESENDABLE_STATUSES } from './DocumentStatusBadge';
import { api } from '../../services/api';

export default function DocumentsTable({ documents, onRefresh }) {
  const [resending, setResending] = useState({});   // { docId: 'loading' | 'done' | 'error' }

  const handleResend = async (doc) => {
    setResending(prev => ({ ...prev, [doc.id]: 'loading' }));
    try {
      await api.post(`/vendors/documents/${doc.id}/resend-link/`);
      setResending(prev => ({ ...prev, [doc.id]: 'done' }));
      // Reset to idle after 3s
      setTimeout(() => setResending(prev => ({ ...prev, [doc.id]: null })), 3000);
      onRefresh?.();
    } catch (err) {
      console.error('Resend failed:', err);
      setResending(prev => ({ ...prev, [doc.id]: 'error' }));
      setTimeout(() => setResending(prev => ({ ...prev, [doc.id]: null })), 3000);
    }
  };

  if (!documents?.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No documents found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Vendor', 'Document Type', 'Status', 'Validation', 'Confidence',
              'Expiry Date', 'Uploads', 'Uploaded', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {documents.map(doc => {
            const canResend  = RESENDABLE_STATUSES.includes(doc.status);
            const resendState = resending[doc.id];

            return (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{doc.vendor_name}</td>
                <td className="px-4 py-3 text-gray-700">{doc.document_type}</td>
                <td className="px-4 py-3">
                  <DocumentStatusBadge status={doc.status} />
                </td>
                <td className="px-4 py-3">
                  {doc.validation ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${doc.validation.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : doc.validation.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'}`}>
                      {doc.validation.status}
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {doc.validation?.overall_confidence != null ? (
                    <span className={`font-semibold ${
                      doc.validation.overall_confidence >= 75 ? 'text-green-600'
                      : doc.validation.overall_confidence >= 50 ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}>
                      {doc.validation.overall_confidence.toFixed(0)}%
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {doc.expiry_date
                    ? new Date(doc.expiry_date).toLocaleDateString()
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{doc.upload_attempts ?? 0}</td>
                <td className="px-4 py-3 text-gray-600">
                  {doc.uploaded_at
                    ? new Date(doc.uploaded_at).toLocaleDateString()
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* View */}
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    {/* Download */}
                    {doc.download_url && (
                      <a href={doc.download_url} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {/* Resend — shows for pending, invalid, expired */}
                    {canResend && (
                      <button
                        onClick={() => handleResend(doc)}
                        disabled={!!resendState}
                        title={
                          doc.status === 'pending'
                            ? 'Send upload link to vendor'
                            : 'Resend upload link (document will reset to pending)'
                        }
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                          transition-colors disabled:opacity-60
                          ${resendState === 'done'
                            ? 'bg-green-100 text-green-700'
                            : resendState === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          }`}
                      >
                        {resendState === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {resendState === 'done'    && <CheckCircle className="w-3 h-3" />}
                        {resendState === 'error'   && <AlertCircle className="w-3 h-3" />}
                        {!resendState             && <RefreshCw className="w-3 h-3" />}
                        {resendState === 'done' ? 'Sent!'
                          : resendState === 'error' ? 'Failed'
                          : 'Resend'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}