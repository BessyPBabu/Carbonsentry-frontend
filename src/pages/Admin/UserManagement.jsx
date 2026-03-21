import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy,       setSortBy]       = useState("name");

  // FIX: useCallback so fetchUsers identity is stable across renders
  // and useEffect can safely depend on it without infinite loops
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm)              params.search   = searchTerm;
      if (roleFilter   !== "all")  params.role     = roleFilter;
      if (statusFilter !== "all")  params.status   = statusFilter;
      if (sortBy === "name")       params.ordering = "full_name";
      if (sortBy === "email")      params.ordering = "email";
      if (sortBy === "role")       params.ordering = "role";

      const res = await api.get("/accounts/users/", { params });
      setUsers(res.data.results || res.data);
    } catch {
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, sortBy]);

  // Run on mount only — explicit search button triggers manual re-fetch
  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/accounts/users/${userId}/`);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      await api.post(`/accounts/users/${userId}/reset-password/`);
      toast.success("Password reset email sent");
    } catch {
      toast.error("Failed to reset password");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        User Management
      </h1>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/user-management/add")}
          className="bg-[#1a8f70] hover:bg-[#12654e] text-white px-4 py-2 rounded-md transition-colors font-medium"
        >
          + Add User
        </button>

        <input
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md flex-1 min-w-50 max-w-md
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Roles</option>
          <option value="officer">Officer</option>
          <option value="viewer">Viewer</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={fetchUsers}
          className="bg-[#1a8f70] hover:bg-[#12654e] text-white px-6 py-2 rounded-md transition-colors font-medium"
        >
          Search
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-10 text-center text-gray-600 dark:text-gray-400">
          Loading users…
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    {u.full_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 capitalize">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === "active"
                          ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/admin/user-management/edit/${u.id}`)}
                        className="text-[#1a8f70] hover:text-[#12654e] font-medium hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                      >
                        Reset&nbsp;PW
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.full_name)}
                        className="text-red-500 dark:text-red-400 hover:underline text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}