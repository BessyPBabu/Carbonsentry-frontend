import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function VendorUpload() {
  const { token } = useParams();

  /* -------------------- State -------------------- */
  const [file, setFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState("");

  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState(null);

  const [vendorInfo, setVendorInfo] = useState(null);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");

  const [allUploadsComplete, setAllUploadsComplete] = useState(false);
  const [lastUploadedDoc, setLastUploadedDoc] = useState(null);

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    validateTokenAndFetchDocuments();
  }, [token]);

  /* -------------------- API -------------------- */
  const validateTokenAndFetchDocuments = async () => {
    setValidating(true);
    setError(null);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/vendors/upload/${token}/`
      );

      setVendorInfo({ name: res.data.vendor_name });
      setPendingDocuments(res.data.pending_documents || []);

      if (res.data.pending_documents?.length > 0) {
        setSelectedDocumentId(res.data.pending_documents[0].id);
      } else {
        setAllUploadsComplete(true);
      }
    } catch (err) {
      console.error(err);

      let message = "Failed to load upload form";
      if (err.response?.status === 404) {
        message = "Invalid upload link";
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail;
      }

      setError(message);
      toast.error(message);
    } finally {
      setValidating(false);
    }
  };

  /* -------------------- Handlers -------------------- */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only PDF, JPG, PNG, DOC, DOCX allowed");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !selectedDocumentId) {
      toast.error("Please select document and file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_id", selectedDocumentId);

      if (expiryDate) {
        formData.append("expiry_date", expiryDate);
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/vendors/upload/${token}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Document uploaded successfully");

      const uploadedDoc = pendingDocuments.find(
        (d) => d.id === selectedDocumentId
      );
      setLastUploadedDoc(uploadedDoc);

      const remaining = pendingDocuments.filter(
        (d) => d.id !== selectedDocumentId
      );
      setPendingDocuments(remaining);

      setFile(null);
      setExpiryDate("");

      if (res.data.all_complete || remaining.length === 0) {
        setAllUploadsComplete(true);
      } else {
        setSelectedDocumentId(remaining[0].id);
      }
    } catch (err) {
      console.error(err);

      let message = "Upload failed";
      if (err.response?.data?.detail) {
        message = err.response.data.detail;
      }

      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  /* -------------------- States -------------------- */
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Validating upload link...</p>
      </div>
    );
  }

  if (error && !vendorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (allUploadsComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-700 font-medium">
          All documents uploaded successfully. Thank you.
        </p>
      </div>
    );
  }

  /* -------------------- Render -------------------- */
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          Document Upload
        </h1>
        {vendorInfo && (
          <p className="text-center text-gray-600 mb-6">
            for <strong>{vendorInfo.name}</strong>
          </p>
        )}

        {/* Document Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Document Type
          </label>
          <select
            value={selectedDocumentId}
            onChange={(e) => setSelectedDocumentId(e.target.value)}
            disabled={uploading}
            className="w-full border px-4 py-2 rounded-md"
          >
            {pendingDocuments.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.document_type}
              </option>
            ))}
          </select>
        </div>

        {/* Expiry Date */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Document Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            disabled={uploading}
            className="w-full border px-4 py-2 rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide expiry date if applicable
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <p className="text-sm text-green-700 mt-2">
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full bg-[#1a8f70] text-white py-3 rounded-md"
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>
    </div>
  );
}
