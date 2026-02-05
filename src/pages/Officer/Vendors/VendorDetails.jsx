import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";
import {
  getComplianceBadgeClass,
  getRiskBadgeClass,
  getDocumentBadgeClass,
  formatDate,
} from "../../../services/constants";

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);

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
      toast.error("Failed to load vendor details");
      console.error(error);
      navigate("/officer/vendors");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    const displayMap = {
      pending: "Pending Upload",
      uploaded: "Uploaded",
      valid: "Valid",
      invalid: "Invalid",
      expired: "Expired",
      flagged: "Flagged for Review",
    };
    return displayMap[status] || status;
  };

  const getComplianceDisplay = (status) => {
    const displayMap = {
      pending: "Pending",
      compliant: "Compliant",
      non_compliant: "Non-Compliant",
      expired: "Expired",
    };
    return displayMap[status] || status;
  };

  const getRiskDisplay = (risk) => {
    const displayMap = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    };
    return displayMap[risk] || risk;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading vendor details...</div>
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
          className="text-gray-600 hover:text-gray-800 mb-2 text-sm"
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
        <InfoCard
          title="Total Documents"
          value={documents.length}
        />
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
          <div className="text-center py-8 text-gray-500">
            No documents found for this vendor
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left w-1/5">
                    Document Type
                  </th>
                  <th className="px-4 py-3 text-left w-1/5">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left w-1/5">
                    Expiry Date
                  </th>
                  <th className="px-4 py-3 text-left w-1/5">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-center w-1/5">
                    File
                  </th>
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
                      {doc.expiry_date ? (
                        <span
                          className={
                            new Date(doc.expiry_date) < new Date()
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {formatDate(doc.expiry_date)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {doc.uploaded_at
                        ? formatDate(doc.uploaded_at)
                        : "Not uploaded"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.file ? (
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1a8f70] hover:underline font-medium"
                        >
                          View
                        </a>
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
    </div>
  );
}

/* ========= HELPERS ========= */

function InfoCard({ title, value, color = "gray" }) {
  const colorClasses = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    red: "text-red-600",
    gray: "text-gray-900",
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>
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
