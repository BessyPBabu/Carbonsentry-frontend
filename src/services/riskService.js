import api from './api';

export const riskService = {
  getAllRiskProfiles: async (params = {}) => {
    const response = await api.get('/ai-validation/risk-profiles/', { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results || []);
  },

  getVendorRiskProfile: async (vendorId) => {
    const response = await api.get('/ai-validation/risk-profiles/', {
      params: { vendor: vendorId }
    });
    const data = response.data;
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.length > 0 ? results[0] : null;
  },

  getRiskStats: async () => {
    const response = await api.get('/ai-validation/risk-profiles/dashboard_stats/');
    return response.data;
  },

  getHighRiskVendors: async () => {
    const response = await api.get('/ai-validation/risk-profiles/high_risk/');
    return response.data;
  },

  recalculateRisk: async (profileId) => {
    const response = await api.post(`/ai-validation/risk-profiles/${profileId}/recalculate/`);
    return response.data;
  }
};