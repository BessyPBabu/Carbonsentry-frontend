
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/user-management/add")}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
        >
          + Add User
        </button>

        <input
          placeholder="Search User"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        />

        <button
          onClick={fetchUsers}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md"
        >
          Apply Filters
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="px-6 py-4">{u.full_name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">{u.role}</td>
                  <td className="px-6 py-4">{u.status}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        navigate(`/admin/user-management/edit/${u.id}`)
                      }
                      className="text-primary-600 hover:underline"
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
