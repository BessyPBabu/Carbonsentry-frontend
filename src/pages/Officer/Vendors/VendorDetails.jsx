import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { getDocumentBadgeClass } from "../../../services/constants";
import { formatDate } from "../../../utils/formatters";

export default function VendorDetails() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [vendor,          setVendor]          = useState(null);
  const [documents,       setDocuments]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => { fetchVendorDetails(); }, [id]);   // eslint-disable-line

  const fetchVendorDetails = async () => {
    try {
      const [vendorRes, docsRes] = await Promise.all([
        api.get(`/vendors/${id}/`),
        api.get(`/vendors/${id}/documents/`),
      ]);
      setVendor(vendorRes.data);
      setDocuments(Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data.results || []));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vendor details");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_MAP = {
    pending:  "Pending Upload",
    uploaded: "Uploaded",
    valid:    "Valid",
    invalid:  "Invalid",
    expired:  "Expired",
    flagged:  "Flagged for Review",
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-600 dark:text-gray-400">
        Loading vendor details…
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center text-gray-600 dark:text-gray-400">
        Vendor not found
      </div>
    );
  }

  const pendingDocs = documents.filter((d) => d.status === "pending");

  return (
    <div className="p-8 space-y-6">
      {/* Back + title */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800
            dark:hover:text-gray-200 mb-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{vendor.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {vendor.industry} • {vendor.country}
        </p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard title="Compliance Status" value={vendor.compliance_status}
          color={vendor.compliance_status === "compliant" ? "green"
               : vendor.compliance_status === "pending"   ? "yellow" : "red"} />
        <InfoCard title="Risk Level" value={vendor.risk_level}
          color={vendor.risk_level === "low" ? "green" : vendor.risk_level === "medium" ? "yellow"
               : vendor.risk_level === "high" ? "orange" : "red"} />
        <InfoCard title="Total Documents" value={documents.length} />
        <InfoCard title="Pending Documents" value={pendingDocs.length}
          color={pendingDocs.length > 0 ? "yellow" : "gray"} />
      </div>

      {/* Vendor info */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Vendor Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailRow label="Contact Email" value={vendor.contact_email} />
          <DetailRow label="Country"       value={vendor.country} />
          <DetailRow label="Industry"      value={vendor.industry} />
          <DetailRow label="Last Updated"  value={formatDate(vendor.last_updated)} />
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Document Status
        </h2>
        {documents.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No documents found for this vendor
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {["Document Type", "Status", "Expiry", "Uploaded", "File"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {doc.document_type || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${getDocumentBadgeClass(doc.status)}`}>
                        {STATUS_MAP[doc.status] || doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {doc.expiry_date ? formatDate(doc.expiry_date) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {doc.uploaded_at ? formatDate(doc.uploaded_at) : "Not uploaded"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.file ? (
                        <button
                          onClick={() => setPreviewDocument(doc)}
                          className="text-[#1a8f70] hover:underline font-medium"
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Document Details</h3>
              <button
                onClick={() => setPreviewDocument(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <DetailRow label="Document Type" value={previewDocument.document_type} />
                <DetailRow label="Status"        value={STATUS_MAP[previewDocument.status]} />
                <DetailRow label="Uploaded"
                  value={previewDocument.uploaded_at ? formatDate(previewDocument.uploaded_at) : "Not uploaded"} />
                <DetailRow label="Expiry Date"
                  value={previewDocument.expiry_date ? formatDate(previewDocument.expiry_date) : "—"} />
              </div>

              {/* FIX: use optional chaining before .toLowerCase() to avoid crash on null */}
              {(previewDocument.file_url || previewDocument.file) ? (
                <div className="border-t dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File Preview
                  </p>
                  {previewDocument.file_url?.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={previewDocument.file_url}
                      className="w-full h-96 border dark:border-gray-600 rounded"
                      title="Document Preview"
                    />
                  ) : previewDocument.file_url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={previewDocument.file_url}
                      alt="Document"
                      className="max-w-full max-h-96 mx-auto"
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Preview not available for this file type
                    </div>
                  )}
                  <div className="mt-4 flex gap-3">
                    {previewDocument.file_url && (
                      <a
                        href={previewDocument.file_url}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center bg-[#1a8f70] text-white px-4 py-2 rounded-md hover:bg-[#12654e]"
                      >
                        Open in New Tab
                      </a>
                    )}
                    {previewDocument.download_url && (
                      <a
                        href={previewDocument.download_url}
                        className="flex-1 text-center border border-[#1a8f70] text-[#1a8f70]
                          px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No file uploaded yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, value, color = "gray" }) {
  const colors = {
    green:  "text-green-600  dark:text-green-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    orange: "text-orange-600 dark:text-orange-400",
    red:    "text-red-600    dark:text-red-400",
    gray:   "text-gray-900   dark:text-white",
  };
  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className={`text-2xl font-bold capitalize ${colors[color] || colors.gray}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="font-medium text-gray-900 dark:text-white">{value || "—"}</div>
    </div>
  );
}