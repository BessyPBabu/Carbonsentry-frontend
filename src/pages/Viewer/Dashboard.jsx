import React, { useState } from 'react';

export default function ViewerDashboard() {
  const [stats] = useState({
    totalVendors: 42,
    highRiskVendors: 6,
    complianceStatus: 82,
    latestReport: 'Approved'
  });

  const [recentActivity] = useState([
    { timestamp: '2025-01-12 16:40', actor: 'Admin', action: 'Approved Compliance Report', entity: 'Q4 Scope 3 Report', details: 'Final approval granted' },
    { timestamp: '2025-01-12 15:10', actor: 'Compliance Officer', action: 'Approved AI-Flagged Document', entity: 'Carbon Certificate', details: 'Conditionally accepted' },
    { timestamp: '2025-01-12 14:32', actor: 'AI System', action: 'Flagged for Human Review', entity: 'ABC Manufacturing', details: 'Low confidence extraction (62%)' },
    { timestamp: '2025-01-11 10:05', actor: 'Admin', action: 'Generated Compliance Report', entity: 'Vendor Risk Summary', details: 'Monthly risk overview' },
    { timestamp: '2025-01-10 16:48', actor: 'AI System', action: 'Risk Score Updated', entity: 'Global Metals Ltd', details: 'Risk increased due to expiry' },
  ]);

  const [aiHealth] = useState({
    documentsValidated: 120,
    aiAccuracy: 96,
    flaggedForReview: 4
  });

  const [reports] = useState({
    generated: 6,
    pendingApprovals: 2
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Viewer Dashboard</h1>
        <p className="text-gray-600 mt-1">Read-only compliance overview</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-600 mb-1">Total Vendors</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalVendors}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-600 mb-1">High-Risk Vendors</p>
          <p className="text-3xl font-bold text-red-600">{stats.highRiskVendors}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-600 mb-1">Compliance Status</p>
          <p className="text-3xl font-bold text-green-600">{stats.complianceStatus}%</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-600 mb-1">Latest Report</p>
          <p className="text-3xl font-bold text-green-600">{stats.latestReport}</p>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Timestamp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Entity</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-600">{activity.timestamp}</td>
                  <td className="py-3 px-4 text-sm">{activity.actor}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={
                      activity.action.includes('Approved') ? 'text-green-600' :
                      activity.action.includes('Flagged') ? 'text-yellow-600' :
                      activity.action.includes('Generated') ? 'text-green-600' :
                      'text-yellow-600'
                    }>
                      {activity.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{activity.entity}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{activity.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">AI System Health</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Documents Validated:</span>
              <span className="font-bold">{aiHealth.documentsValidated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">AI Accuracy:</span>
              <span className="font-bold text-green-600">{aiHealth.aiAccuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Flagged for Review:</span>
              <span className="font-bold text-yellow-600">{aiHealth.flaggedForReview}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Reports</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Reports Generated (Q4):</span>
              <span className="font-bold">{reports.generated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pending Approvals:</span>
              <span className="font-bold text-yellow-600">{reports.pendingApprovals}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}