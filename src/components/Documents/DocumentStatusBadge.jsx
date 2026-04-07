// DocumentStatusBadge.jsx
// Determines which statuses show the Resend Link button.
// FIXED: 'pending' is now included — vendors who never uploaded also need a fresh link.

export const RESENDABLE_STATUSES = ['pending', 'invalid', 'expired'];

export const STATUS_CONFIG = {
  pending:  { label: 'Pending Upload',     color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  uploaded: { label: 'Uploaded',           color: 'bg-blue-100 text-blue-800 border-blue-200' },
  valid:    { label: 'Valid',              color: 'bg-green-100 text-green-800 border-green-200' },
  flagged:  { label: 'Flagged for Review', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  invalid:  { label: 'Invalid',           color: 'bg-red-100 text-red-800 border-red-200' },
  expired:  { label: 'Expired',           color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function DocumentStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}