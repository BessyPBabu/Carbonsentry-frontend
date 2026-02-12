import React, { useState, useEffect } from 'react';
import { validationService } from '../../services/validationService';
import Pagination from '../../components/Common/Pagination';
import ConfidenceBadge from '../../components/Validation/ConfidenceBadge';
import RiskBadge from '../../components/Validation/RiskBadge';
import ReviewDetailsPanel from '../../components/Validation/ReviewDetailsPanel';
import Button from '../../components/Common/Button';

const AIReviewQueue = () => {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await validationService.getReviewQueue();
      setReviews(data.filter(r => r.status !== 'resolved')); // Only show pending/in_progress
      if (data.length > 0) {
        setSelectedReview(data[0]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (decision, notes) => {
    try {
      await validationService.resolveReview(selectedReview.id, decision, notes);
      await fetchReviews(); // Refresh list
    } catch (error) {
      throw error;
    }
  };

  const getRiskImpact = (review) => {
    if (review.priority === 'high') return 'high';
    if (review.priority === 'medium') return 'medium';
    return 'low';
  };

  // Pagination
  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviews = reviews.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Review Queue</h1>
        <p className="text-gray-600 mt-2">Human validation for AI-flagged documents</p>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AI Issue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedReviews.map((review) => (
              <tr 
                key={review.id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedReview?.id === review.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedReview(review)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {review.validation?.vendor_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {review.validation?.document_name}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="text-yellow-700">
                    {review.reason.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <ConfidenceBadge 
                    confidence={review.validation?.overall_confidence || 0} 
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RiskBadge level={getRiskImpact(review)} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReview(review);
                    }}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mb-8">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Review Details Panel */}
      <ReviewDetailsPanel review={selectedReview} onResolve={handleResolve} />
    </div>
  );
};

export default AIReviewQueue;