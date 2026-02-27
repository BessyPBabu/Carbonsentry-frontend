import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { getDocumentBadgeClass, formatDate } from "../../../services/constants";
import Pagination from '../../../components/Common/Pagination';
import ValidationStatusBadge from "../../../components/Validation/ValidationStatusBadge";
import { validationService } from "../../../services/validationService";

const PAGE_SIZE = 10;

export default function DocumentsList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [documents, setDocuments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // track which docs have had validation triggered this session
  const [validatingIds, setValidatingIds] = useState(new Set());

  const [filters, setFilters] = useState({
    status: "",
    vendor: "",
    search: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    if (status) {
      setFilters((prev) => ({ ...prev, status }));
    }
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [page, filters]);

  const fetchVendors = async () => {
    try {
      const res = await api.get("/vendors/");
      setVendors(res.data.results || res.data);
    } catch (error) {
      console.error("Failed to fetch vendors", error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("page_size", PAGE_SIZE);

      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      if (filters.vendor) params.append("vendor", filters.vendor);

      const res = await api.get(`/vendors/documents/?${params}`);

      if (res.data.results !== undefined) {
        setDocuments(res.data.results);
        setTotalCount(res.data.count);
        // FIX: use PAGE_SIZE not 50
        setTotalPages(Math.ceil(res.data.count / PAGE_SIZE));
      } else {
        setDocuments(res.data);
        setTotalCount(res.data.length);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error("Failed to load documents");
      console.error("Failed to load documents", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerValidation = async (documentId) => {
    // mark as validating immediately so button disappears
    setValidatingIds(prev => new Set(prev).add(documentId));
    try {
      await validationService.triggerValidation(documentId);
      toast.success("Validation started successfully");
      // refresh so the validation column updates
      fetchDocuments();
    } catch (error) {
      // on failure, remove from set so they can retry
      setValidatingIds(prev => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
      console.error("Validation trigger failed", error);
      toast.error("Failed to start validation");
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

  const handleClearFilters = () => {
    setFilters({ status: "", vendor: "", search: "" });
    setPage(1);
  };

  const handleView = async (doc) => {
    try {
      const response = await api.get(
        `/vendors/documents/${doc.id}/file/`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("View failed", error);
      toast.error("Failed to open document");
    }
  };

  // FIX: force application/pdf so it doesn't download as .txt
  const handleDownload = async (doc) => {
    try {
      const response = await api.get(
        `/vendors/documents/${doc.id}/download/`,
        { responseType: "blob" }
      );

      // force pdf mime regardless of what the server content-type header says
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      // ensure .pdf extension on the downloaded file
      const rawName = doc.document_type || "document";
      link.download = rawName.endsWith(".pdf") ? rawName : `${rawName}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Failed to download document");
    }
  };

  // FIX: stats should reflect total across all pages, not just current page slice
  // we keep pending/valid/flagged from current page as indicative counts
  // total comes from the paginated count field which is accurate
  const stats = {
    total: totalCount,
    pending: documents.filter((d) => d.status === "pending").length,
    valid: documents.filter((d) => d.status === "valid").length,
    flagged: documents.filter((d) => d.status === "flagged").length,
  };

  // a doc should show the validate button only if:
  // - it has no validation record yet
  // - its status is 'uploaded' (has a file)
  // - we haven't already triggered validation this session
  const canValidate = (doc) =>
    !doc.validation &&
    doc.status === "uploaded" &&
    !validatingIds.has(doc.id);

  const isValidating = (doc) =>
    validatingIds.has(doc.id) && !doc.validation;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">
          Manage vendor compliance documents
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by vendor..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          />

          <select
            value={filters.vendor}
            onChange={(e) => {
              setFilters({ ...filters, vendor: e.target.value });
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Upload</option>
            <option value="uploaded">Uploaded</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
            <option value="expired">Expired</option>
            <option value="flagged">Flagged for Review</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Documents" value={stats.total} />
        <StatCard title="Pending Upload" value={stats.pending} color="yellow" />
        <StatCard title="Valid" value={stats.valid} color="green" />
        <StatCard title="Flagged" value={stats.flagged} color="red" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg shadow">
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow">
          No documents found
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                  <th className="px-4 py-3 text-left font-semibold">Document Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Validation</th>
                  <th className="px-4 py-3 text-left font-semibold">Confidence</th>
                  <th className="px-4 py-3 text-left font-semibold">Expiry Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Uploaded</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {doc.vendor_name || "—"}
                    </td>

                    <td className="px-4 py-3">
                      {doc.document_type || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentBadgeClass(doc.status)}`}
                      >
                        {getStatusDisplay(doc.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {doc.validation ? (
                        <ValidationStatusBadge
                          status={doc.validation.status}
                          currentStep={doc.validation.current_step}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Not validated
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {doc.validation?.overall_confidence ? (
                        <ConfidenceBadge
                          confidence={doc.validation.overall_confidence}
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {doc.expiry_date ? formatDate(doc.expiry_date) : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {doc.uploaded_at ? formatDate(doc.uploaded_at) : "Not uploaded"}
                    </td>

                    <td className="px-4 py-3 text-center text-sm">
                      <div className="flex gap-3 justify-center flex-wrap">

                        {doc.file_url && (
                          <button
                            onClick={() => handleView(doc)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View
                          </button>
                        )}

                        {doc.download_url && (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="text-green-600 hover:text-green-700 font-medium"
                          >
                            Download
                          </button>
                        )}

                        {/* FIX: show validate button only if not yet validated and not currently validating */}
                        {canValidate(doc) && (
                          <button
                            onClick={() => handleTriggerValidation(doc.id)}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Validate
                          </button>
                        )}

                        {/* show a non-clickable pill while validation is in progress */}
                        {isValidating(doc) && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                            Validating...
                          </span>
                        )}

                        {/* show validated pill if validation exists and completed */}
                        {doc.validation?.status === "completed" && !doc.validation?.requires_manual_review && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
                            Validated ✓
                          </span>
                        )}

                        {/* {doc.validation && (
                          <Link
                            to={`/officer/validation/${doc.validation.id}`}
                            className="text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Details
                          </Link>
                        )} */}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FIX: pagination with correct page count */}
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} documents
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>

        </div>
      )}
    </div>
  );
}

/* ===== Helper Components ===== */

function StatCard({ title, value, color = "gray" }) {
  const colors = {
    gray: "text-gray-900",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${colors[color]}`}>
        {value}
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }) {
  let color = "text-gray-600";
  if (confidence >= 80) color = "text-green-600";
  else if (confidence >= 50) color = "text-yellow-600";
  else color = "text-red-600";

  return (
    <span className={`font-medium ${color}`}>
      {confidence}%
    </span>
  );
}