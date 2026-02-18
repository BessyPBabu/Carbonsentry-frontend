// riskService.js
import api from './api';

export const riskService = {
  getAllRiskProfiles: async (params = {}) => {
    const response = await api.get('/ai-validation/risk-profiles/', { params });
    return response.data;
  },

  getVendorRiskProfile: async (vendorId) => {
    const response = await api.get('/ai-validation/risk-profiles/', {
      params: { vendor: vendorId }
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
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