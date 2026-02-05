import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";


export default function VendorsList() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const { role } = useAuth();

  const isReadOnly = role === "admin" || role === "viewer";


  const [industries, setIndustries] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    industry: "",
    compliance_status: "",
    risk_level: "",
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [page, filters]);

  const fetchIndustries = async () => {
    try {
      const res = await api.get("/vendors/config/industries/");
      setIndustries(res.data);
    } catch (err) {
      console.error("Failed to fetch industries", err);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);

      if (filters.search) params.append("search", filters.search);
      if (filters.industry) params.append("industry", filters.industry);
      if (filters.compliance_status)
        params.append("compliance_status", filters.compliance_status);
      if (filters.risk_level) params.append("risk_level", filters.risk_level);

      const res = await api.get(`/vendors/?${params}`);

      if (res.data.results) {
        setVendors(res.data.results);
        setTotalPages(Math.ceil(res.data.count / 50));
      } else {
        setVendors(res.data);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error("Failed to load vendors");
      console.error("Failed to load vendors", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      compliant: "bg-green-100 text-green-800",
      non_compliant: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getRiskBadge = (risk) => {
    const badges = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return badges[risk] || "bg-gray-100 text-gray-800";
  };

  const getStatusDisplay = (status) => {
    const display = {
      pending: "Pending",
      compliant: "Compliant",
      non_compliant: "Non-Compliant",
      expired: "Expired",
    };
    return display[status] || status;
  };

  const getRiskDisplay = (risk) => {
    const display = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    };
    return display[risk] || risk;
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">
            Manage compliance vendors and their documents
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/officer/vendors/add")}
              className="bg-[#1a8f70] text-white px-4 py-2 rounded-lg hover:bg-[#12654e]"
            >
              + Add Vendor
            </button>
            <button
              onClick={() => navigate("/officer/vendors/bulk-upload")}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Bulk Upload CSV
            </button>
          </div>
        )}

      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search vendors..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          />

          <select
            value={filters.industry}
            onChange={(e) => {
              setFilters({ ...filters, industry: e.target.value });
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name}
              </option>
            ))}
          </select>

          <select
            value={filters.compliance_status}
            onChange={(e) => {
              setFilters({ ...filters, compliance_status: e.target.value });
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Compliance Status</option>
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
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      {vendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No vendors found</p>
          <button
            onClick={() => navigate("/officer/vendors/add")}
            className="mt-4 text-[#1a8f70] hover:underline"
          >
            Add your first vendor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Industry
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Country
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Compliance
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Risk
                </th>
                {!isReadOnly && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                )}

              </tr>
            </thead>
            <tbody className="divide-y">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {vendor.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {vendor.industry}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{vendor.country}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        vendor.compliance_status
                      )}`}
                    >
                      {getStatusDisplay(vendor.compliance_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(
                        vendor.risk_level
                      )}`}
                    >
                      {getRiskDisplay(vendor.risk_level)}
                    </span>
                  </td>
                  {!isReadOnly && (
                    <td className="px-4 py-3">
                      <Link
                        to={`/officer/vendors/${vendor.id}`}
                        className="text-[#1a8f70] hover:underline text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  )}

                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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