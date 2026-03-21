import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const { isAuthenticated, logout } = useAuth();

  const isForgotPasswordMode = !!(uid && token);
  // FIX: also redirect admin users who must change password
  const isForceChangeMode = isAuthenticated && !isForgotPasswordMode;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]      = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [error,           setError]            = useState("");
  const [success,         setSuccess]          = useState(false);
  const [loading,         setLoading]          = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      if (isForgotPasswordMode) {
        await api.post("/accounts/auth/password/reset/", {
          uid,
          token,
          password: newPassword,
        });
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else if (isForceChangeMode) {
        await api.post("/accounts/auth/password/change/", {
          current_password: currentPassword,
          new_password:     newPassword,
        });
        setSuccess(true);
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 2000);
      } else {
        setError("Invalid reset context. Please use the link from your email.");
      }
    } catch (err) {
      const data = err?.response?.data;
      if (isForceChangeMode) {
        setError(
          data?.current_password?.[0] ||
          data?.new_password?.[0]     ||
          data?.error                 ||
          data?.detail                ||
          "Current password is incorrect"
        );
      } else {
        setError(
          data?.detail ||
          data?.error  ||
          "Reset link is invalid or expired"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-gray-900">
      {/* ── LEFT PANEL ──────────────────────────────────────────────────────────
          FIX: bg-gradient-to-br with Tailwind arbitrary values gets purged in
          production builds when the class string is never seen statically.
          Using a plain inline style is the safe, reliable approach.             */}
      <div
        className="w-1/2 hidden md:flex flex-col justify-center px-16 text-white"
        style={{ background: "linear-gradient(to bottom right, #1a8f70, #12654e)" }}
      >
        <h1 className="text-5xl font-bold mb-6">CarbonSentry</h1>
        <p className="text-xl" style={{ color: "rgba(255,255,255,0.9)" }}>
          Centralized control for carbon compliance, vendor oversight, and
          organization-wide reporting.
        </p>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12 bg-white dark:bg-gray-800">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isForceChangeMode ? "Change Password" : "Reset Password"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {isForceChangeMode
              ? "Change your temporary password to continue"
              : "Set a new password for your account"}
          </p>

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
              {isForceChangeMode
                ? "Password changed successfully! Redirecting to login…"
                : "Password reset successful! Redirecting to login…"}
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {isForceChangeMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current / temporary password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      focus:ring-2 focus:ring-[#1a8f70] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    focus:ring-2 focus:ring-[#1a8f70] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    focus:ring-2 focus:ring-[#1a8f70] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a8f70] text-white py-3.5 rounded-lg hover:bg-[#12654e]
                  font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? "Processing…"
                  : isForceChangeMode
                  ? "Change Password"
                  : "Reset Password"}
              </button>

              {isForceChangeMode && (
                <button
                  type="button"
                  onClick={() => { logout(); navigate("/login"); }}
                  className="w-full border border-gray-300 dark:border-gray-600
                    text-gray-700 dark:text-gray-300 py-3.5 rounded-lg
                    hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel &amp; Logout
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}