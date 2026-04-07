// validationService.js
import api from './api';

export const validationService = {
  getReviewQueue: async (params = {}) => {
    const response = await api.get('/ai-validation/manual-reviews/', { params });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/ai-validation/validations/statistics/');
    return response.data;
  },

  getRecentValidations: async () => {
    const response = await api.get('/ai-validation/validations/recent/');
    return response.data;
  },

  getReviewDetails: async (reviewId) => {
    const response = await api.get(`/ai-validation/manual-reviews/${reviewId}/`);
    return response.data;
  },

  assignReview: async (reviewId) => {
    const response = await api.post(`/ai-validation/manual-reviews/${reviewId}/assign/`);
    return response.data;
  },

  resolveReview: async (reviewId, decision, notes) => {
    const response = await api.post(`/ai-validation/manual-reviews/${reviewId}/resolve/`, {
      decision,
      notes
    });
    return response.data;
  },

  getValidationDetails: async (validationId) => {
    const response = await api.get(`/ai-validation/validations/${validationId}/`);
    return response.data;
  },

  getAuditLogs: async (validationId) => {
    const response = await api.get(`/ai-validation/validations/${validationId}/audit_logs/`);
    return response.data;
  },

  triggerValidation: async (documentId) => {
    const response = await api.post('/ai-validation/validations/trigger_validation/', {
      document_id: documentId
    });
    return response.data;
  },

  getValidationsByVendor: async (vendorId) => {
    const response = await api.get('/ai-validation/validations/', {
      params: { vendor: vendorId }
    });
    return response.data.results || response.data;
  },

  getLatestReviewByVendor: async (vendorId) => {
    const response = await api.get('/ai-validation/manual-reviews/', {
      params: { vendor: vendorId, status: 'resolved' }
    });
    const reviews = response.data.results || response.data;
    // sort descending by resolved_at then created_at as fallback
    reviews.sort((a, b) => {
      const da = new Date(a.resolved_at || a.created_at);
      const db = new Date(b.resolved_at || b.created_at);
      return db - da;
    });
    return reviews.length > 0 ? reviews[0] : null;
  }
};