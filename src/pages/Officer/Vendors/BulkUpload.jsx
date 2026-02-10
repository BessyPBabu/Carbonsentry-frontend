import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";

export default function BulkUpload() {
  const navigate = useNavigate();

  /* -------------------- State -------------------- */
  const [file, setFile] = useState(null);
  const [sendEmails, setSendEmails] = useState(false);
  const [loading, setLoading] = useState(false);

  const [uploadResult, setUploadResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [uploadedVendorIds, setUploadedVendorIds] = useState([]);

  /* -------------------- Handlers -------------------- */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    setErrors([]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }

    setLoading(true);
    setUploadResult(null);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append("csv_file", file);
      // IMPORTANT: do NOT send send_emails here

      const res = await api.post("/vendors/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadResult(res.data);

      if (res.data.success_count > 0) {
        toast.success(`Successfully created ${res.data.success_count} vendors`);

        if (sendEmails && res.data.vendor_ids?.length > 0) {
          setUploadedVendorIds(res.data.vendor_ids);
          setShowEmailConfirmation(true);
        }
      }

      if (res.data.failure_count > 0) {
        setErrors(res.data.error_summary || []);
        toast.warning(`${res.data.failure_count} vendors failed to create`);
      }
    } catch (err) {
      console.error("Upload failed", err);

      let errorMessage = "Upload failed";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.error) errorMessage = data.error;
        else if (typeof data === "string") errorMessage = data;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkEmails = async () => {
    try {
      await api.post("/vendors/send-emails/", {
        vendor_ids: uploadedVendorIds,
      });

      toast.success(
        `Document request emails sent to ${uploadedVendorIds.length} vendors`
      );
      setShowEmailConfirmation(false);
      navigate("/officer/vendors");
    } catch (err) {
      console.error("Failed to send emails", err);
      toast.error("Failed to send emails");
    }
  };

  const handleSkipBulkEmails = () => {
    setShowEmailConfirmation(false);
    navigate("/officer/vendors");
  };

  /* -------------------- Render -------------------- */
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/officer/vendors")}
          className="text-gray-600 hover:text-gray-800 mb-2"
        >
          ← Back to Vendors
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Bulk Vendor Upload
        </h1>
        <p className="text-gray-600 mt-1">
          Upload a CSV file to add multiple vendors at once
        </p>
      </div>

      <div className="max-w-3xl">
        {/* Upload Card */}
        <div className="bg-white border rounded-lg p-8 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File <span className="text-red-500">*</span>
            </label>

            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <label className="cursor-pointer text-[#1a8f70] font-medium">
                Upload a CSV file
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="sr-only"
                />
              </label>

              <p className="text-xs text-gray-500 mt-2">
                CSV only, up to 10MB
              </p>

              {file && (
                <p className="text-sm text-gray-900 mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                disabled={loading}
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                Send document request emails after upload
              </span>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full bg-[#1a8f70] text-white px-6 py-3 rounded-md disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>

        {/* Results */}
        {uploadResult && (
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Upload Results</h3>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {uploadResult.total_rows}
                </div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.success_count}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.failure_count}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {uploadResult.total_rows > 0
                    ? Math.round(
                        (uploadResult.success_count /
                          uploadResult.total_rows) *
                          100
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-white border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Validation Errors ({errors.length})
            </h3>

            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {errors.slice(0, 20).map((err, index) => (
                <li
                  key={index}
                  className="p-3 bg-red-50 border border-red-100 rounded"
                >
                  <div className="font-medium text-red-800">
                    Row {err.row}: {err.error}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Email Confirmation Modal */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              Send Document Request Emails?
            </h3>

            <p className="text-gray-600 mb-4">
              You created {uploadedVendorIds.length} vendor(s). Do you want to
              send document request emails now?
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6 text-sm text-blue-800">
              Emails will include upload links valid for 72 hours.
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipBulkEmails}
                className="flex-1 border px-4 py-2 rounded-md"
              >
                Skip
              </button>
              <button
                onClick={handleSendBulkEmails}
                className="flex-1 bg-[#1a8f70] text-white px-4 py-2 rounded-md"
              >
                Send Emails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
