import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    country: "",
    admin_email: "",
    password: "",
  });

  /* ================= HANDLE INPUT CHANGE ================= */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /* ================= ERROR PARSER ================= */
  const getErrorMessage = (err) => {
    const data = err?.response?.data;

    if (!data) {
      return "Registration failed. Please try again.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object") {
      const errors = Object.entries(data)
        .map(([field, messages]) => {
          const msgArray = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgArray.join(", ")}`;
        })
        .filter(Boolean);

      if (errors.length > 0) {
        return errors.join("; ");
      }
    }

    return "Registration failed. Please check your inputs.";
  };

  /* ================= VALIDATE PASSWORD ================= */
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

    const email = formData.admin_email.toLowerCase();
    if (email && password.toLowerCase().includes(email.split("@")[0])) {
      errors.push("Password is too similar to your email");
    }

    if (/^\d+$/.test(password)) {
      errors.push("Password cannot be numeric only");
    }

    return errors;
  };

  /* ================= HANDLE SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      toast.error(passwordErrors.join(". "));
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      industry: formData.industry.trim(),
      country: formData.country.trim(),
      admin_email: formData.admin_email.trim().toLowerCase(),
      password: formData.password,
    };

    try {
      await api.post("/accounts/organizations/register/", payload);


      toast.success(
        "Organization registered successfully! Please login with your credentials.",
        { autoClose: 5000 }
      );

      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err), { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div
        className="w-1/2 flex flex-col justify-center px-16 text-white"
        style={{
          background: "linear-gradient(to bottom right, #1a8f70, #12654e)",
        }}
      >
        <h1 className="text-5xl font-bold mb-4">CarbonSentry</h1>
        <p className="text-xl mb-12">
          Automating Scope 3 Carbon Compliance with AI
        </p>

        <div className="space-y-5">
          {[
            "AI-powered document validation",
            "Automated vendor follow-ups",
            "Explainable risk assessment",
            "Audit-ready compliance reports",
          ].map((text) => (
            <div key={text} className="flex items-start gap-4">
              <div className="mt-1 bg-white/20 rounded-full p-1">
                <Check size={18} strokeWidth={3} />
              </div>
              <span className="text-lg">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex items-center justify-center px-12 bg-gray-50">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">
            Register Organization
          </h2>
          <p className="text-gray-600 mb-8">
            Create your admin account to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Your company name"
                required
                disabled={loading}
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="industry"
                placeholder="e.g., Manufacturing, Logistics, Technology"
                required
                disabled={loading}
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                placeholder="e.g., United States, Germany, India"
                required
                disabled={loading}
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="admin_email"
                placeholder="your.email@company.com"
                required
                disabled={loading}
                value={formData.admin_email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your login email
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Create a strong password (min 8 characters)"
                required
                disabled={loading}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8f70] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a8f70] text-white py-3 rounded-lg hover:bg-[#12654e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating Organization..." : "Create Organization"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#1a8f70] font-medium hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
