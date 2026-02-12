import api from './api';

export const riskService = {
  // Get all vendor risk profiles
  getAllRiskProfiles: async (params = {}) => {
    const response = await api.get('/ai-validation/risk-profiles/', { params });
    return response.data;
  },

  // Get single vendor risk profile
  getVendorRiskProfile: async (vendorId) => {
    const response = await api.get(`/ai-validation/risk-profiles/${vendorId}/`);
    return response.data;
  },

  // Get risk dashboard stats
  getRiskStats: async () => {
    const response = await api.get('/ai-validation/risk-profiles/dashboard_stats/');
    return response.data;
  },

  // Get high-risk vendors
  getHighRiskVendors: async () => {
    const response = await api.get('/ai-validation/risk-profiles/high_risk/');
    return response.data;
  },

  // Manually recalculate risk for a vendor
  recalculateRisk: async (vendorId) => {
    const response = await api.post(`/ai-validation/risk-profiles/${vendorId}/recalculate/`);
    return response.data;
  }
};