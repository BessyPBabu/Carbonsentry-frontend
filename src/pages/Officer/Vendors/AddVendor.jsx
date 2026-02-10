import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";

export default function AddVendor() {
  const navigate = useNavigate();

  /* -------------------- State -------------------- */
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    country: "",
    contact_email: "",
  });

  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [createdVendorId, setCreatedVendorId] = useState(null);

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    fetchIndustries();
  }, []);

  /* -------------------- API Calls -------------------- */
  const fetchIndustries = async () => {
    try {
      const res = await api.get("/vendors/config/industries/");
      setIndustries(res.data || []);
    } catch (error) {
      console.error("Failed to fetch industries", error);
      toast.error("Failed to load industries");
    } finally {
      setLoadingIndustries(false);
    }
  };

  /* -------------------- Handlers -------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Vendor name is required");
      return false;
    }
    if (!formData.industry) {
      toast.error("Please select an industry");
      return false;
    }
    if (!formData.country.trim()) {
      toast.error("Country is required");
      return false;
    }
    if (!formData.contact_email.trim()) {
      toast.error("Contact email is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await api.post("/vendors/", formData);
      setCreatedVendorId(res.data.id);
      setShowEmailConfirmation(true);
      toast.success("Vendor created successfully");
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!createdVendorId) return;

    try {
      await api.post("/vendors/send-emails/", {
        vendor_ids: [createdVendorId],
      });
      toast.success("Document request email sent");
      navigate("/officer/vendors");
    } catch (error) {
      console.error("Email send failed", error);
      toast.error("Failed to send email");
    }
  };

  const handleSkipEmail = () => {
    navigate("/officer/vendors");
  };

  /* -------------------- Utils -------------------- */
  const handleApiError = (error) => {
    console.error("API error:", error);

    let message = "Something went wrong";

    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "object") {
        message = Object.entries(data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join(" | ");
      } else {
        message = data;
      }
    }

    toast.error(message);
  };

  /* -------------------- Render -------------------- */
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/officer/vendors")}
          className="text-gray-600 hover:text-gray-800 mb-4"
        >
          ← Back to Vendors
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add Vendor</h1>
        <p className="text-gray-600 mt-1">Add a new compliance vendor</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl bg-white rounded-xl shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>

            {loadingIndustries ? (
              <p className="text-sm text-gray-500">Loading industries...</p>
            ) : (
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2 border rounded-md"
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/officer/vendors")}
              className="border px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingIndustries}
              className="bg-[#1a8f70] text-white px-4 py-2 rounded-md"
            >
              {loading ? "Creating..." : "Save Vendor"}
            </button>
          </div>
        </form>
      </div>

      {/* Email Confirmation Modal */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              Send Document Request Email?
            </h3>
            <p className="text-gray-600 mb-6">
              Send compliance document instructions to{" "}
              <strong>{formData.contact_email}</strong>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSkipEmail}
                className="flex-1 border px-4 py-2 rounded-md"
              >
                Skip
              </button>
              <button
                onClick={handleSendEmail}
                className="flex-1 bg-[#1a8f70] text-white px-4 py-2 rounded-md"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
