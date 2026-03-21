import React from "react";
import { formatDateTime } from "../../utils/formatters";

const DecisionTrace = ({
  aiRecommendation,
  humanDecision,
  reviewedBy,
  reviewedAt,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Decision Trace
      </h3>

      <div className="space-y-4">
        <TraceRow label="AI Recommendation" value={aiRecommendation} />
        <TraceRow label="Human Decision"    value={humanDecision} />
        <TraceRow label="Reviewed By"       value={reviewedBy} />
        {reviewedAt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Reviewed on {formatDateTime(reviewedAt)}
          </p>
        )}
      </div>
    </div>
  );
};

function TraceRow({ label, value }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}:{" "}
      </span>
      <span className="text-sm text-gray-900 dark:text-white">{value || "—"}</span>
    </div>
  );
}

export default DecisionTrace;