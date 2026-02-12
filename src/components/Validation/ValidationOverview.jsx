import React, { useState, useEffect } from 'react';
import { validationService } from '../../services/validationService';

const ValidationOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await validationService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error fetching validation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!stats) return null;

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Validation Status</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total_validations}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.requires_review}</div>
          <div className="text-sm text-gray-600">Needs Review</div>
        </div>
      </div>

      {stats.avg_confidence && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Average Confidence</span>
            <span className="text-lg font-semibold text-gray-900">
              {parseFloat(stats.avg_confidence).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationOverview;