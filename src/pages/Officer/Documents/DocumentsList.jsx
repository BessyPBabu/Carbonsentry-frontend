import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { getDocumentBadgeClass, formatDate } from "../../../services/constants";
import Pagination from "../../../components/Common/Pagination";
import ValidationStatusBadge from "../../../components/Validation/ValidationStatusBadge";
import { validationService } from "../../../services/validationService";

const PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 4000;

// mirrors backend DocumentResendLinkView resendable guard
const RESENDABLE_STATUSES = ["pending", "invalid", "expired"];

export default function DocumentsList() {
  const location = useLocation();

  const [documents,    setDocuments]    = useState([]);
  const [vendors,      setVendors]      = useState([]);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [validatingIds, setValidatingIds] = useState(new Set());
  const [filters,      setFilters]      = useState({ status: "", vendor: "", search: "" });

  // polling refs
  const pollRef       = useRef(null);
  const isFetchingRef = useRef(false);

  // always holds the latest fetchDocuments — avoids stale closure in setInterval
  const fetchRef = useRef(null);

  useEffect(() => () => stopPolling(), []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    if (status) setFilters(prev => ({ ...prev, status }));
    fetchVendors();
  }, []); // eslint-disable-line

  useEffect(() => { fetchDocuments(); }, [page, filters]); // eslint-disable-line

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      if (!isFetchingRef.current && fetchRef.current) {
        fetchRef.current(true); // silent fetch — no loading overlay
      }
    }, POLL_INTERVAL_MS);
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get("/vendors/");
      setVendors(res.data.results || res.data);
    } catch (err) {
      console.error("fetchVendors:", err);
    }
  };

  const fetchDocuments = async (silent = false) => {
    // skip overlapping silent polls
    if (isFetchingRef.current && silent) return;
    isFetchingRef.current = true;
    if (!silent) setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("page",      page);
      params.append("page_size", PAGE_SIZE);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      if (filters.vendor) params.append("vendor", filters.vendor);

      const res   = await api.get(`/vendors/documents/?${params}`);
      const docs  = res.data.results ?? res.data;
      const count = res.data.count   ?? docs.length;

      setDocuments(docs);
      setTotalCount(count);
      setTotalPages(Math.ceil(count / PAGE_SIZE) || 1);

      // remove doc IDs whose validation has resolved so polling stops cleanly
      setValidatingIds(prev => {
        if (prev.size === 0) return prev;
        const next    = new Set(prev);
        let   changed = false;
        docs.forEach(doc => {
          if (next.has(doc.id)) {
            const vs = doc.validation?.status;
            if (vs === "completed" || vs === "failed") {
              next.delete(doc.id);
              changed = true;
            }
          }
        });
        if (!changed) return prev;
        if (next.size === 0) stopPolling();
        return next;
      });

    } catch (err) {
      if (!silent) toast.error("Failed to load documents");
      console.error("fetchDocuments:", err);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  // keep ref fresh every render so setInterval never sees a stale closure
  fetchRef.current = fetchDocuments;

  const handleTriggerValidation = async (documentId) => {
    setValidatingIds(prev => new Set(prev).add(documentId));
    try {
      await validationService.triggerValidation(documentId);
      toast.success("Validation started");
      await fetchDocuments();
      startPolling();
    } catch (err) {
      setValidatingIds(prev => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
      console.error("handleTriggerValidation:", err);
      toast.error(err?.response?.data?.error || "Failed to start validation");
    }
  };

  const handleResendLink = async (doc) => {
    try {
      await api.post(`/vendors/documents/${doc.id}/resend-link/`);
      toast.success("Upload link resent to vendor");
      fetchDocuments();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to resend link");
      console.error("handleResendLink:", err);
    }
  };

  const handleClearFilters = () => {
    setFilters({ status: "", vendor: "", search: "" });
    setPage(1);
    stopPolling();
  };

  const handleView = async (doc) => {
    try {
      const res  = await api.get(`/vendors/documents/${doc.id}/file/`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      window.open(window.URL.createObjectURL(blob), "_blank");
    } catch (err) {
      console.error("handleView:", err);
      toast.error("Failed to open document");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res  = await api.get(`/vendors/documents/${doc.id}/download/`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      const raw  = doc.document_type || "document";
      link.download = raw.endsWith(".pdf") ? raw : `${raw}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("handleDownload:", err);
      toast.error("Failed to download document");
    }
  };

  const STATUS_DISPLAY = {
    pending:  "Pending Upload",
    uploaded: "Uploaded",
    valid:    "Valid",
    invalid:  "Invalid",
    expired:  "Expired",
    flagged:  "Flagged for Review",
  };

  const canValidate  = doc =>
    !doc.validation && doc.status === "uploaded" && !validatingIds.has(doc.id);

  const isValidating = doc =>
    validatingIds.has(doc.id) || doc.validation?.status === "processing";

  const stats = {
    total:   totalCount,
    pending: documents.filter(d => d.status === "pending").length,
    valid:   documents.filter(d => d.status === "valid").length,
    flagged: documents.filter(d => d.status === "flagged").length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">Manage vendor compliance documents</p>
        {pollRef.current && (
          <span className="text-xs text-blue-500 mt-1 inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Live updating validation status…
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by vendor..."
            value={filters.search}
            onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
            className="border rounded-lg px-4 py-2"
          />
          <select
            value={filters.vendor}
            onChange={e => { setFilters({ ...filters, vendor: e.target.value }); setPage(1); }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
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
          <button onClick={handleClearFilters} className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats — total from server, others from current page as indicative */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Documents" value={stats.total} />
        <StatCard title="Pending Upload"  value={stats.pending} color="yellow" />
        <StatCard title="Valid"           value={stats.valid}   color="green" />
        <StatCard title="Flagged"         value={stats.flagged} color="red" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg shadow text-gray-500">
          Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow text-gray-500">
          No documents found
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Vendor","Document Type","Status","Validation","Confidence","Expiry","Uploads","Uploaded","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{doc.vendor_name || "—"}</td>

                    <td className="px-4 py-3">{doc.document_type || "—"}</td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentBadgeClass(doc.status)}`}>
                        {STATUS_DISPLAY[doc.status] || doc.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {doc.validation
                        ? <ValidationStatusBadge status={doc.validation.status} currentStep={doc.validation.current_step} />
                        : <span className="text-gray-400 text-sm">Not validated</span>}
                    </td>

                    <td className="px-4 py-3">
                      {doc.validation?.overall_confidence != null
                        ? <ConfidenceBadge confidence={doc.validation.overall_confidence} />
                        : <span className="text-gray-400">—</span>}
                    </td>

                    <td className="px-4 py-3">
                      {doc.expiry_date ? formatDate(doc.expiry_date) : "—"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold">
                        {doc.upload_attempts ?? 0}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {doc.uploaded_at ? formatDate(doc.uploaded_at) : "Not uploaded"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {doc.file_url && (
                          <button onClick={() => handleView(doc)} className="text-blue-600 hover:text-blue-700 font-medium">
                            View
                          </button>
                        )}
                        {doc.download_url && (
                          <button onClick={() => handleDownload(doc)} className="text-green-600 hover:text-green-700 font-medium">
                            Download
                          </button>
                        )}
                        {canValidate(doc) && (
                          <button onClick={() => handleTriggerValidation(doc.id)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                            Validate
                          </button>
                        )}
                        {isValidating(doc) && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full animate-pulse">
                            Validating…
                          </span>
                        )}
                        {doc.validation?.status === "completed" && !doc.validation?.requires_manual_review && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
                            Validated ✓
                          </span>
                        )}
                        {/* pending, invalid, expired all get resend — mirrors backend guard */}
                        {RESENDABLE_STATUSES.includes(doc.status) && (
                          <button
                            onClick={() => handleResendLink(doc)}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                            title={doc.status === "pending" ? "Send upload link" : "Reset and resend upload link"}
                          >
                            Resend Link
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={newPage => {
                setPage(newPage);
                stopPolling(); // user navigated away — stop until they trigger again
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color = "gray" }) {
  const colors = { gray: "text-gray-900", green: "text-green-600", yellow: "text-yellow-600", red: "text-red-600" };
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
    </div>
  );
}

function ConfidenceBadge({ confidence }) {
  const color =
    confidence >= 80 ? "text-green-600" :
    confidence >= 50 ? "text-yellow-600" : "text-red-600";
  return <span className={`font-medium ${color}`}>{confidence}%</span>;
}