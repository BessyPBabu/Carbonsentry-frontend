import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setSubmitting(true);

      const result = await login(email, password);

      if (result.must_change_password) {
        toast.info("Please change your password to continue");
        navigate("/force-change-password", { replace: true });
        return; 
      }

      toast.success("Logged in successfully");

      if (result.role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (result.role === "officer") navigate("/officer/dashboard", { replace: true });
      else if (result.role === "viewer") navigate("/viewer/dashboard", { replace: true });
      else  {
      toast.error("Unknown user role. Please contact support.");
      }
    } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.error === "Organization not verified") {
      toast.error(
        "Please verify your organization email before logging in. Check your inbox for the verification link.",
        { autoClose: 7000 }
      );
      return;
    }

    if (error.response?.status === 401) {
        toast.error("Invalid email or password");
        return;
    }

    toast.error(
        error.response?.data?.detail || 
        error.response?.data?.error || 
        "Login failed. Please try again."
    );
      
  } finally {
    setSubmitting(false);
  }
};

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Preparing login…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div
        className="w-1/2 flex items-center px-16 text-white"
        style={{
          background: "linear-gradient(to bottom right, #1a8f70, #12654e)",
        }}
      >
        <div>
          <h1 className="text-5xl font-bold mb-4">CarbonSentry</h1>
          <p className="text-xl">
            Centralized control for carbon compliance and vendor oversight.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex items-center justify-center px-12 bg-gray-50">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-8">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="email@company.com"
                value={email}
                disabled={submitting}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                disabled={submitting}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1a8f70] text-white py-3 rounded-lg hover:bg-[#12654e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Logging in…" : "Login"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm">
            <Link
              to="/forgot-password"
              className="text-[#1a8f70] font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="text-center mt-2 text-sm">
            No account?{" "}
            <Link
              to="/register"
              className="text-[#1a8f70] font-medium hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
