import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const { isAuthenticated, logout } = useAuth();

  // Determine which mode we're in
  const isForgotPasswordMode = !!(uid && token);
  const isForceChangeMode = isAuthenticated && !isForgotPasswordMode;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      if (isForgotPasswordMode) {
        // Forgot password flow (with uid/token from email)
        await api.post("/accounts/auth/password/reset/", {
          uid,
          token,
          password: newPassword,
        });

        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);

      } else if (isForceChangeMode) {
        // Force change password flow (logged in user)
        await api.post("/accounts/auth/password/change/", {
          current_password: currentPassword,
          new_password: newPassword,
        });

        setSuccess(true);
        
        // Logout after 2 seconds
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 2000);
      }

    } catch (err) {
      console.error(err);
      if (isForceChangeMode) {
        setError(err?.response?.data?.error || "Current password is incorrect");
      } else {
        setError("Reset link invalid or expired");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="w-1/2 bg-gradient-to-br from-[#1a8f70] to-[#12654e] flex flex-col justify-center px-16 text-white">
        <h1 className="text-5xl font-bold mb-6">CarbonSentry</h1>
        <p className="text-xl text-white/90">
          Centralized control for carbon compliance, vendor oversight, and organization-wide reporting.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex items-center justify-center px-12 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isForceChangeMode ? "Change Password" : "Reset Password"}
          </h2>
          <p className="text-gray-600 mb-8">
            {isForceChangeMode 
              ? "Change your temporary password" 
              : "Set a new password"}
          </p>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {isForceChangeMode 
                ? "Password changed successfully! Redirecting to login..." 
                : "Password reset successful! Redirecting to login..."}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Show current password field only when user is logged in */}
              {isForceChangeMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
                    placeholder="Enter your temporary password"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a8f70] text-white py-3.5 rounded-lg hover:bg-[#12654e] font-medium"
              >
                {isForceChangeMode ? "Change Password" : "Reset Password"}
              </button>

              {/* Show cancel/logout button for force change mode */}
              {isForceChangeMode && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="w-full border border-gray-300 text-gray-700 py-3.5 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel & Logout
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}