// src/pages/Officer/Vendors/VendorsList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

export default function VendorsList() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const isReadOnly = role === "viewer";
  const basePath   = role === "admin" ? "/admin" : "/officer";

  const [vendors,    setVendors]    = useState([]);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,    setLoading]    = useState(true);

  // FIX: always initialise as an array so industries.map() never throws
  const [industries, setIndustries] = useState([]);

  const [filters, setFilters] = useState({
    search:            "",
    industry:          "",
    compliance_status: "",
    risk_level:        "",
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  // re-fetch whenever page or any filter changes
  useEffect(() => {
    fetchVendors();
  }, [page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIndustries = async () => {
    try {
      const res = await api.get("/vendors/config/industries/");
      // FIX: the API can return either a plain array  OR  a paginated object
      // { results: [...], count: N }.  Without this guard, setIndustries()
      // stores a plain object and React crashes with
      //   "industries.map is not a function"
      // when it tries to render the <option> list.
      const data = res.data;
      if (Array.isArray(data)) {
        setIndustries(data);
      } else if (data && Array.isArray(data.results)) {
        setIndustries(data.results);
      } else {
        setIndustries([]);
      }
    } catch (err) {
      console.error("Failed to fetch industries", err);
      setIndustries([]);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.search)            params.search            = filters.search;
      if (filters.industry)          params.industry          = filters.industry;
      if (filters.compliance_status) params.compliance_status = filters.compliance_status;
      if (filters.risk_level)        params.risk_level        = filters.risk_level;

      const res = await api.get("/vendors/", { params });

      if (res.data && res.data.results !== undefined) {
        setVendors(res.data.results);
        setTotalCount(res.data.count || 0);
        setTotalPages(res.data.total_pages || Math.ceil((res.data.count || 0) / 10));
      } else {
        const list = Array.isArray(res.data) ? res.data : [];
        setVendors(list);
        setTotalCount(list.length);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error("Failed to load vendors");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({ search: "", industry: "", compliance_status: "", risk_level: "" });
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const b = {
      pending:       "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
      compliant:     "bg-green-100  dark:bg-green-900/40  text-green-800  dark:text-green-300",
      non_compliant: "bg-red-100    dark:bg-red-900/40    text-red-800    dark:text-red-300",
      expired:       "bg-gray-100   dark:bg-gray-700      text-gray-800   dark:text-gray-300",
    };
    return b[status] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
  };

  const getRiskBadge = (risk) => {
    const b = {
      low:      "bg-green-100  dark:bg-green-900/40   text-green-800  dark:text-green-300",
      medium:   "bg-yellow-100 dark:bg-yellow-900/40  text-yellow-800 dark:text-yellow-300",
      high:     "bg-orange-100 dark:bg-orange-900/40  text-orange-800 dark:text-orange-300",
      critical: "bg-red-100    dark:bg-red-900/40     text-red-800    dark:text-red-300",
    };
    return b[risk] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-400">
        Loading vendors…
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage compliance vendors and their documents
          </p>
        </div>

        {role === "officer" && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/officer/vendors/add")}
              className="bg-[#1a8f70] hover:bg-[#12654e] text-white px-4 py-2 rounded-lg transition-colors"
            >
              + Add Vendor
            </button>
            <button
              onClick={() => navigate("/officer/vendors/bulk-upload")}
              className="bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Bulk Upload CSV
            </button>
          </div>
        )}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 border dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search vendors…"
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            className="border dark:border-gray-600 rounded-lg px-4 py-2
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />

          <select
            value={filters.industry}
            onChange={(e) => {
              setFilters({ ...filters, industry: e.target.value });
              setPage(1);
            }}
            className="border dark:border-gray-600 rounded-lg px-4 py-2
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id}>{ind.name}</option>
            ))}
          </select>

          <select
            value={filters.compliance_status}
            onChange={(e) => {
              setFilters({ ...filters, compliance_status: e.target.value });
              setPage(1);
            }}
            className="border dark:border-gray-600 rounded-lg px-4 py-2
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Compliance</option>
            <option value="pending">Pending</option>
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={filters.risk_level}
            onChange={(e) => {
              setFilters({ ...filters, risk_level: e.target.value });
              setPage(1);
            }}
            className="border dark:border-gray-600 rounded-lg px-4 py-2
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Risk</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2
              hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {vendors.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">No vendors found</p>
          {role === "officer" && (
            <button
              onClick={() => navigate("/officer/vendors/add")}
              className="mt-4 text-[#1a8f70] hover:underline"
            >
              Add your first vendor
            </button>
          )}
        </div>
      ) : (
        /* ── Table ──────────────────────────────────────────────────── */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Name", "Industry", "Country", "Compliance", "Risk", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {vendor.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {vendor.industry}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {vendor.country}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.compliance_status)}`}
                    >
                      {vendor.compliance_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(vendor.risk_level)}`}
                    >
                      {vendor.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!isReadOnly ? (
                      <Link
                        to={`${basePath}/vendors/${vendor.id}`}
                        className="text-[#1a8f70] hover:underline text-sm font-medium"
                      >
                        View Details
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages} ({totalCount} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border dark:border-gray-600 rounded
                    hover:bg-white dark:hover:bg-gray-600
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border dark:border-gray-600 rounded
                    hover:bg-white dark:hover:bg-gray-600
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}