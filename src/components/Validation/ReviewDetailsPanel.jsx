import React, { useState } from 'react';
import Button from '../Common/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ReviewDetailsPanel = ({ review, onResolve }) => {
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleResolve = async (decision) => {
    if (decision === 'rejected' && !notes.trim()) {
      alert('Please add a comment for rejection');
      return;
    }

    setLoading(true);
    try {
      await onResolve(decision, notes);
      setNotes('');
    } catch (error) {
      console.error('Error resolving review:', error);
      alert('Failed to resolve review');
    } finally {
      setLoading(false);
    }
  };

  if (!review) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        Select a review to see details
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="font-medium">Vendor:</span> {review.validation?.vendor_name}
            </p>
            <p className="text-sm">
              <span className="font-medium">Document:</span> {review.validation?.document_name}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const vendorId = review?.validation?.vendor_id;
            if (vendorId) {
              navigate(`/${role}/communication/${vendorId}`);
            }
          }}
        >
          Communicate with Vendor
        </Button>
      </div>

      {/* Why AI Flagged */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-2">Why AI flagged this</h4>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-gray-800">{review.reason || review.validation?.flagged_reason}</p>
        </div>
      </div>

      {/* Comment Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Comment (required for rejection)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add review notes..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => handleResolve('rejected')}
          disabled={loading}
          className="flex-1"
        >
          Reject
        </Button>
        <Button
          variant="primary"
          onClick={() => handleResolve('approved')}
          disabled={loading}
          className="flex-1"
        >
          Approve
        </Button>
      </div>
    </div>
  );
};

export default ReviewDetailsPanel;