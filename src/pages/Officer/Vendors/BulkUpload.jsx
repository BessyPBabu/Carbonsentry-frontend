import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../services/api";

export default function BulkUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [sendEmails, setSendEmails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
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
    }
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
      formData.append("send_emails", sendEmails);

      const res = await api.post("/vendors/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadResult(res.data);
      
      if (res.data.success_count > 0) {
        toast.success(`Successfully created ${res.data.success_count} vendors`);
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
        if (data.error) {
          errorMessage = data.error;
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
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate("/officer/vendors")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Vendors
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Vendor Upload</h1>
        <p className="text-gray-600 mt-1">
          Upload a CSV file to add multiple vendors at once
        </p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white border rounded-lg p-8 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-[#1a8f70] hover:text-[#12654e] focus-within:outline-none"
                  >
                    <span>Upload a CSV file</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      disabled={loading}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV files only, up to 10MB
                </p>
                {file && (
                  <p className="text-sm text-gray-900 mt-2">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                disabled={loading}
                className="rounded border-gray-300 text-[#1a8f70] focus:ring-[#1a8f70]"
              />
              <span className="ml-2 text-sm text-gray-700">
                Send document request emails to vendors
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Emails will be sent to vendors with upload links for required documents
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full bg-[#1a8f70] text-white px-6 py-3 rounded-md hover:bg-[#12654e] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>

        {uploadResult && (
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Upload Results</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{uploadResult.total_rows}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{uploadResult.success_count}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{uploadResult.failure_count}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {uploadResult.total_rows > 0 
                    ? Math.round((uploadResult.success_count / uploadResult.total_rows) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
            
            {uploadResult.bulk_upload_id && (
              <p className="text-sm text-gray-600">
                Upload ID: <span className="font-mono">{uploadResult.bulk_upload_id}</span>
              </p>
            )}
          </div>
        )}

        {/* CSV Format Guide - keep existing */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">CSV Format Guide</h3>
          {/* Keep your existing table */}
        </div>

        {errors.length > 0 && (
          <div className="mt-6 bg-white border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Validation Errors ({errors.length})
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <ul className="space-y-2">
                {errors.slice(0, 20).map((err, index) => (
                  <li key={index} className="p-3 bg-red-50 rounded border border-red-100">
                    <div className="font-medium text-red-800">
                      Row {err.row}: {err.error}
                    </div>
                    {err.data && (
                      <div className="text-sm text-gray-600 mt-1">
                        Data: {JSON.stringify(err.data)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {errors.length > 20 && (
                <p className="text-sm text-gray-600 mt-3">
                  ... and {errors.length - 20} more errors
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}