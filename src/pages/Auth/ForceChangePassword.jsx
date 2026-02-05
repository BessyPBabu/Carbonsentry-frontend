import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function ForceChangePassword() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (
      /(123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
        password
      )
    ) {
      errors.push("Password contains sequential characters");
    }

    const commonPatterns = [
      "password",
      "123456",
      "qwerty",
      "admin",
      "welcome",
      "letmein",
      "monkey",
      "dragon",
      "baseball",
      "football",
      "mustang",
      "master",
      "hello",
      "secret",
      "login",
    ];

    if (
      commonPatterns.some((pattern) =>
        password.toLowerCase().includes(pattern)
      )
    ) {
      errors.push("Password contains common weak patterns");
    }

    const email = user?.email?.toLowerCase() || "";
    if (email && password.toLowerCase().includes(email.split("@")[0])) {
      errors.push("Password is too similar to your email");
    }

    if (/^\d+$/.test(password)) {
      errors.push("Password cannot be numeric only");
    }

    return errors;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordErrors = validatePassword(formData.new_password);
    if (passwordErrors.length > 0) {
      toast.error(passwordErrors.join(". "));
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/accounts/auth/password/change/", {
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      toast.success("Password changed successfully! Please login again.");
      setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      const errorMsg =
        err?.response?.data?.current_password?.[0] ||
        err?.response?.data?.new_password?.[0] ||
        err?.response?.data?.detail ||
        "Failed to change password";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Change Your Password
            </h2>
            <p className="text-gray-600 mt-2">
              For security reasons, you must change your password before
              continuing.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="current_password"
                required
                value={formData.current_password}
                onChange={handleChange}
                placeholder="Enter your current password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="new_password"
                required
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Create a strong password (min 8 characters)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirm_password"
                required
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter your new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Password Requirements:
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• No sequential characters (abc, 123)</li>
                <li>• No common weak patterns</li>
                <li>• Cannot be similar to your email</li>
                <li>• Cannot be all numbers</li>
              </ul>
            </div>

            {/* Buttons */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a8f70] text-white py-3 rounded-lg hover:bg-[#12654e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? "Changing Password..." : "Change Password"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel & Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}