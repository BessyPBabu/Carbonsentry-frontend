import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      if (sortBy === "name") params.ordering = "full_name";
      if (sortBy === "email") params.ordering = "email";
      if (sortBy === "role") params.ordering = "role";

      const res = await api.get("/accounts/users/", { params });
      setUsers(res.data.results || res.data);
    } catch {
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="flex gap-4 mb-6">
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
          className="px-4 py-2 border border-gray-300 rounded-md flex-1 max-w-md"
        />

        <button
          onClick={fetchUsers}
          className="bg-[#1a8f70] hover:bg-[#12654e] text-white px-6 py-2 rounded-md transition-colors font-medium"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-600">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{u.full_name}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        navigate(`/admin/user-management/edit/${u.id}`)
                      }
                      className="text-[#1a8f70] hover:text-[#12654e] font-medium hover:underline"
                    >
                      Edit
                    </button>
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