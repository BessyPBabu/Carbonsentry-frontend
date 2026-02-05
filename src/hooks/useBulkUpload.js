import { useState } from "react";
import { bulkUploadVendors } from "../services/vendors.api";

export function useBulkUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const upload = async ({ file, sendEmails }) => {
    setLoading(true);
    setResult(null);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append("csv_file", file);
      formData.append("send_emails", sendEmails);

      const response = await bulkUploadVendors(formData);
      setResult(response.data);

      if (response.data.error_summary) {
        setErrors(response.data.error_summary);
      }

      return response.data;
    } finally {
      setLoading(false);
    }
  };

  return {
    upload,
    loading,
    result,
    errors,
  };
}
