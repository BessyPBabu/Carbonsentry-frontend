import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "officer",
    is_active: true,
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await api.get(`/accounts/users/${id}/`);
      setFormData({
        full_name: res.data.full_name,
        email: res.data.email,
        role: res.data.role,
        status: res.data.is_active,
      });
    } catch {
      toast.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.patch(`/accounts/users/${id}/`, {
        full_name: formData.full_name,
        role: formData.role,
        status: formData.is_active,
      });
      toast.success("User updated successfully");
      navigate("/admin/user-management");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Edit system user</p>
      </div>

      <div className="max-w-2xl bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold mb-6">Edit User</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700"
          />

          <input
            value={formData.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
          >
            <option value="officer">Compliance Officer</option>
            <option value="viewer">Viewer</option>
          </select>

          <select
            name="is_active"  
            value={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
          >
            <option value="true">Active</option> 
            <option value="false">Inactive</option>
          </select>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/user-management")}
              className="border border-gray-300 rounded-md py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-md py-2"
            >
              {saving ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
