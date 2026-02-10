import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";
import {
  getDocumentBadgeClass,
  formatDate,
} from "../../../services/constants";

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    fetchVendorDetails();
  }, [id]);

  const fetchVendorDetails = async () => {
    try {
      const vendorRes = await api.get(`/vendors/${id}/`);
      setVendor(vendorRes.data);

      const docsRes = await api.get(`/vendors/${id}/documents/`);
      setDocuments(docsRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vendor details");
      navigate("/officer/vendors");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    const map = {
      pending: "Pending Upload",
      uploaded: "Uploaded",
      valid: "Valid",
      invalid: "Invalid",
      expired: "Expired",
      flagged: "Flagged for Review",
    };
    return map[status] || status;
  };

  const getComplianceDisplay = (status) => {
    const map = {
      pending: "Pending",
      compliant: "Compliant",
      non_compliant: "Non-Compliant",
      expired: "Expired",
    };
    return map[status] || status;
  };

  const getRiskDisplay = (risk) => {
    const map = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    };
    return map[risk] || risk;
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-600">
        Loading vendor details...
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center text-gray-600">
        Vendor not found
      </div>
    );
  }

  const pendingDocs = documents.filter((d) => d.status === "pending");

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/officer/vendors")}
          className="text-sm text-gray-600 hover:text-gray-800 mb-2"
        >
          ← Back to Vendors
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {vendor.name}
        </h1>
        <p className="text-gray-600 mt-1">
          {vendor.industry} • {vendor.country}
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard
          title="Compliance Status"
          value={getComplianceDisplay(vendor.compliance_status)}
          color={
            vendor.compliance_status === "compliant"
              ? "green"
              : vendor.compliance_status === "pending"
              ? "yellow"
              : "red"
          }
        />
        <InfoCard
          title="Risk Level"
          value={getRiskDisplay(vendor.risk_level)}
          color={
            vendor.risk_level === "low"
              ? "green"
              : vendor.risk_level === "medium"
              ? "yellow"
              : vendor.risk_level === "high"
              ? "orange"
              : "red"
          }
        />
        <InfoCard title="Total Documents" value={documents.length} />
        <InfoCard
          title="Pending Documents"
          value={pendingDocs.length}
          color={pendingDocs.length > 0 ? "yellow" : "gray"}
        />
      </div>

      {/* Vendor Information */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Vendor Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailRow label="Contact Email" value={vendor.contact_email} />
          <DetailRow label="Country" value={vendor.country} />
          <DetailRow label="Industry" value={vendor.industry} />
          <DetailRow
            label="Last Updated"
            value={formatDate(vendor.last_updated)}
          />
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Document Status
        </h2>

        {documents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No documents found for this vendor
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Document Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                  <th className="px-4 py-3 text-left">Uploaded</th>
                  <th className="px-4 py-3 text-center">File</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {doc.document_type || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentBadgeClass(
                          doc.status
                        )}`}
                      >
                        {getStatusDisplay(doc.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.expiry_date
                        ? formatDate(doc.expiry_date)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {doc.uploaded_at
                        ? formatDate(doc.uploaded_at)
                        : "Not uploaded"}
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

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Document Details</h3>
              <button
                onClick={() => setPreviewDocument(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <DetailRow
                  label="Document Type"
                  value={previewDocument.document_type}
                />
                <DetailRow
                  label="Status"
                  value={getStatusDisplay(previewDocument.status)}
                />
                <DetailRow
                  label="Uploaded"
                  value={
                    previewDocument.uploaded_at
                      ? formatDate(previewDocument.uploaded_at)
                      : "Not uploaded"
                  }
                />
                <DetailRow
                  label="Expiry Date"
                  value={
                    previewDocument.expiry_date
                      ? formatDate(previewDocument.expiry_date)
                      : "—"
                  }
                />
              </div>

              {previewDocument.file && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    File Preview
                  </p>

                  {previewDocument.file
                    .toLowerCase()
                    .endsWith(".pdf") ? (
                    <iframe
                      src={previewDocument.file}
                      className="w-full h-96 border rounded"
                      title="Document Preview"
                    />
                  ) : (
                    <img
                      src={previewDocument.file}
                      alt="Document"
                      className="max-w-full max-h-96 mx-auto"
                    />
                  )}

                  <div className="mt-4 flex gap-3">
                    <a
                      href={previewDocument.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-[#1a8f70] text-white px-4 py-2 rounded-md"
                    >
                      Open in New Tab
                    </a>
                    <a
                      href={previewDocument.file}
                      download
                      className="flex-1 text-center border px-4 py-2 rounded-md"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========= HELPERS ========= */

function InfoCard({ title, value, color = "gray" }) {
  const colors = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    red: "text-red-600",
    gray: "text-gray-900",
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}
