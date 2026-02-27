import React, { useState, useEffect } from 'react';
import { validationService } from '../../services/validationService';
import Pagination from '../../components/Common/Pagination';
import ConfidenceBadge from '../../components/Validation/ConfidenceBadge';
import RiskBadge from '../../components/Validation/RiskBadge';
import ReviewDetailsPanel from '../../components/Validation/ReviewDetailsPanel';

const PAGE_SIZE = 10;

const AIReviewQueue = () => {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // server-side pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [page]); 

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await validationService.getReviewQueue({ page, page_size: PAGE_SIZE ,status: 'pending'});
      let list = [];
      let count = 0;

      if (res && typeof res === 'object' && 'results' in res) {
        list = res.results;
        count = res.count;
      } else if (Array.isArray(res)) {
        list = res;
        count = res.length;
      }
      
      setReviews(list);
      setTotalCount(count);
      setTotalPages(Math.ceil(count / PAGE_SIZE));

      // auto-select first row on first load
      if (pending.length > 0 && !selectedReview) {
        setSelectedReview(pending[0]);
      }
    } catch (error) {
      console.error('AIReviewQueue: error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (decision, notes) => {
    try {
      await validationService.resolveReview(selectedReview.id, decision, notes);
      // after resolve, clear selection and refresh current page
      setSelectedReview(null);
      await fetchReviews();
    } catch (error) {
      throw error;
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSelectedReview(null); // clear selection on page turn
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRiskImpact = (review) => {
    if (review.priority === 'high') return 'high';
    if (review.priority === 'medium') return 'medium';
    return 'low';
  };

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
        {totalCount > 0 && (
          <p className="text-sm text-gray-400 mt-1">{totalCount} item{totalCount !== 1 ? 's' : ''} awaiting review</p>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border rounded-lg p-16 text-center text-gray-400">
          No documents pending review
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white border rounded-lg overflow-hidden mb-4">
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
                {reviews.map((review) => (
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
                        {review.reason?.replace(/_/g, ' ')}
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
                      {/* FIX: plain button instead of missing Button component */}
                      <button
                        className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReview(review);
                          // scroll down to the review panel
                          setTimeout(() => {
                            document.getElementById('review-panel')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — FIX: use 'page' prop not 'currentPage' */}
          <div className="flex items-center justify-between mb-8 text-sm text-gray-500">
            <span>
              Page {page} of {totalPages} — {totalCount} total
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      {/* Review Details Panel */}
      <div id="review-panel">
        <ReviewDetailsPanel review={selectedReview} onResolve={handleResolve} />
      </div>
    </div>
  );
};

export default AIReviewQueue;