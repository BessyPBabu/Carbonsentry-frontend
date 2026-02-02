import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function ForceChangePassword() {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error("Both fields are required");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/accounts/auth/password/change/", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success("Password changed successfully!");

      // ← REDIRECT TO DASHBOARD BASED ON ROLE
      if (role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (role === "officer") navigate("/officer/dashboard", { replace: true });
      else if (role === "viewer") navigate("/viewer/dashboard", { replace: true });

    } catch (err) {
      const msg = err?.response?.data?.error || "Password change failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-2">Change Password</h2>
        <p className="text-gray-600 mb-6">
          You must change your temporary password before continuing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              placeholder="Enter temporary password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              placeholder="Enter new password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1a8f70] text-white py-3 rounded-lg hover:bg-[#12654e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Changing..." : "Change Password"}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}