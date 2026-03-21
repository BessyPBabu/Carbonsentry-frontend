import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import Button from "../Common/Button";

const ReviewDetailsPanel = ({ review, onResolve }) => {
  const navigate  = useNavigate();
  // FIX: useAuth was referenced but never imported in the original file
  const { role }  = useAuth();
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleResolve = async (decision) => {
    // FIX: replaced browser alert() with toast — alert blocks the main thread
    // and cannot be tested with RTL
    if (decision === "rejected" && !notes.trim()) {
      toast.error("Please add a comment explaining the rejection");
      return;
    }

    setLoading(true);
    try {
      await onResolve(decision, notes);
      setNotes("");
      toast.success(`Review ${decision === "approved" ? "approved" : "rejected"} successfully`);
    } catch (error) {
      console.error("ReviewDetailsPanel.handleResolve:", error);
      toast.error(
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Failed to resolve review"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!review) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700
        rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
        Select a review item above to see details
      </div>
    );
  }

  const vendorId = review?.validation?.vendor_id;

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Review Details
          </h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Vendor:</span>{" "}
              {review.validation?.vendor_name || "—"}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Document:</span>{" "}
              {review.validation?.document_name || "—"}
            </p>
          </div>
        </div>

        {vendorId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/${role}/communication/${vendorId}`)}
          >
            Communicate with Vendor
          </Button>
        )}
      </div>

      {/* Why AI flagged */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Why AI flagged this
        </h4>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200
          dark:border-yellow-700 rounded-lg p-4">
          <p className="text-sm text-gray-800 dark:text-yellow-200">
            {review.reason ||
              review.validation?.flagged_reason ||
              "Flagged for manual review"}
          </p>
        </div>
      </div>

      {/* Confidence info if available */}
      {review.validation?.overall_confidence != null && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">AI Confidence: </span>
          {review.validation.overall_confidence}%
        </div>
      )}

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reviewer Notes{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal">
            (required for rejection)
          </span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add review notes…"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => handleResolve("rejected")}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Processing…" : "Reject"}
        </Button>
        <Button
          variant="primary"
          onClick={() => handleResolve("approved")}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Processing…" : "Approve"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewDetailsPanel;