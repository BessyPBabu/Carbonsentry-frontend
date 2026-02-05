import React from "react";
import { useNavigate } from "react-router-dom";

export default function ManualUpload() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => navigate("/officer/documents")}
          className="text-gray-600 hover:text-gray-800 mb-4"
        >
          ← Back to Documents
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Manual Document Upload</h1>
      </div>

      <div className="max-w-2xl bg-white rounded-xl shadow-sm p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Feature Not Available
          </h2>
          <p className="text-gray-600 mb-6">
            Manual document upload is currently not supported. Documents should be uploaded by vendors through email links sent via bulk upload or individual vendor requests.
          </p>
          <button
            onClick={() => navigate("/officer/vendors/bulk-upload")}
            className="bg-[#1a8f70] text-white px-6 py-3 rounded-md hover:bg-[#12654e]"
          >
            Go to Bulk Upload
          </button>
        </div>
      </div>
    </div>
  );
}