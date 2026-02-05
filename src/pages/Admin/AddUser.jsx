import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function AddUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "officer",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
       
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      await api.post("/accounts/users/add/", payload);
      toast.success("User created successfully");
      navigate("/admin/user-management");
    } catch (err) {
      const errorMsg = err?.response?.data?.email?.[0] 
        || err?.response?.data?.detail 
        || "Failed to create user. Please check inputs.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Create and manage system users</p>
      </div>

      <div className="max-w-2xl bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold mb-6">Add User</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 placeholder:text-gray-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="user@company.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 placeholder:text-gray-400"
            />
          </div>

          {/* Password - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave empty to auto-generate"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              If left empty, a temporary password will be sent via email
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
            >
              <option value="officer">Compliance Officer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="pt-4 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/user-management")}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#1a8f70] hover:bg-[#12654e] text-white px-4 py-2 rounded-md disabled:opacity-60 transition-colors font-medium"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}