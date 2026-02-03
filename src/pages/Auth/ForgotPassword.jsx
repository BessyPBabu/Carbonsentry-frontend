import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= HANDLE SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payloadEmail = email.trim().toLowerCase();

    try {
      await api.post("accounts/auth/password/forgot/", {
        email: payloadEmail,
      });

      // Always success (no user enumeration)
      setSent(true);

      toast.success(
        "If the email exists, a password reset link has been sent.",
        { autoClose: 5000 }
      );
    } catch (err) {
      // Still show success to avoid leaking info
      setSent(true);

      toast.info(
        "If the email exists, a password reset link has been sent.",
        { autoClose: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="w-1/2 bg-gradient-to-br from-[#1a8f70] to-[#12654e] flex flex-col justify-center px-16 text-white">
        <h1 className="text-5xl font-bold mb-6">CarbonSentry</h1>
        <p className="text-xl text-white/90">
          Centralized control for carbon compliance, vendor oversight, and
          organization-wide reporting.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex items-center justify-center px-12 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot Password
          </h2>
          <p className="text-gray-600 mb-8">
            Request password reset
          </p>

          {sent ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              If the email exists, a password reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a8f70] text-white py-3.5 rounded-lg hover:bg-[#12654e] font-medium disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <p className="text-sm text-gray-600 text-center">
                A password reset link will be sent if the email exists.
              </p>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-[#1a8f70] hover:underline text-sm"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
