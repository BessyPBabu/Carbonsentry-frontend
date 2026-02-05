import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";

export default function AddVendor() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    country: "",
    contact_email: "",
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      const res = await api.get("/vendors/config/industries/");
      console.log("Industries loaded:", res.data);
      setIndustries(res.data);
    } catch (err) {
      toast.error("Failed to load industries");
      console.error(err);
    } finally {
      setLoadingIndustries(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.name.trim()) {
      toast.error("Vendor name is required");
      return;
    }

    if (!formData.industry) {
      toast.error("Please select an industry");
      return;
    }

    if (!formData.country.trim()) {
      toast.error("Country is required");
      return;
    }

    if (!formData.contact_email.trim()) {
      toast.error("Contact email is required");
      return;
    }

    console.log("Submitting data:", formData);

    setLoading(true);

    try {
      const response = await api.post("/vendors/", formData);
      console.log("Success:", response.data);
      
      toast.success("Vendor created successfully!");
      navigate("/officer/vendors");
    } catch (err) {
      console.error("Full error:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);

      let errorMessage = "Failed to create vendor";

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          const errors = Object.entries(data)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgArray.join(", ")}`;
            })
            .join("; ");
          errorMessage = errors || errorMessage;
        } else if (typeof data === "string") {
          errorMessage = data;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
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
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter vendor name"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1a8f70] outline-none disabled:opacity-50"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            {loadingIndustries ? (
              <div className="text-sm text-gray-500">Loading industries...</div>
            ) : industries.length === 0 ? (
              <div className="text-sm text-red-500">
                No industries available. Please create industries first.
              </div>
            ) : (
              <>
                <select
                  name="industry"
                  required
                  value={formData.industry}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1a8f70] outline-none disabled:opacity-50"
                >
                  <option value="">Select Industry</option>
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.industry
                    ? `Selected: ${industries.find((i) => i.id === formData.industry)?.name}`
                    : `Available industries: ${industries.length}`}
                </p>
              </>
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
              required
              value={formData.country}
              onChange={handleChange}
              placeholder="e.g., India, United States"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1a8f70] outline-none disabled:opacity-50"
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
              required
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="vendor@company.com"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1a8f70] outline-none disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              This email will receive document upload requests
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-4 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate("/officer/vendors")}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || loadingIndustries || industries.length === 0}
              className="bg-[#1a8f70] text-white px-4 py-2 rounded-md hover:bg-[#12654e] disabled:opacity-60"
            >
              {loading ? "Creating..." : "Save Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}