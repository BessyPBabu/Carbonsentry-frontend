import api from './api';

export const validationService = {
  // Get all manual reviews (AI Review Queue)
  getReviewQueue: async (params = {}) => {
    const response = await api.get('/ai-validation/manual-reviews/', { params });
    return response.data;
  },

  // Get validation statistics
  getStatistics: async () => {
    const response = await api.get('/ai-validation/validations/statistics/');
    return response.data;
  },

  // Get recent validations
  getRecentValidations: async () => {
    const response = await api.get('/ai-validation/validations/recent/');
    return response.data;
  },

  // Get single review details
  getReviewDetails: async (reviewId) => {
    const response = await api.get(`/ai-validation/manual-reviews/${reviewId}/`);
    return response.data;
  },

  // Assign review to current user
  assignReview: async (reviewId) => {
    const response = await api.post(`/ai-validation/manual-reviews/${reviewId}/assign/`);
    return response.data;
  },

  // Resolve review (approve/reject)
  resolveReview: async (reviewId, decision, notes) => {
    const response = await api.post(`/ai-validation/manual-reviews/${reviewId}/resolve/`, {
      decision,
      notes
    });
    return response.data;
  },

  // Get validation details with audit logs
  getValidationDetails: async (validationId) => {
    const response = await api.get(`/ai-validation/validations/${validationId}/`);
    return response.data;
  },

  // Get audit logs for a validation
  getAuditLogs: async (validationId) => {
    const response = await api.get(`/ai-validation/validations/${validationId}/audit_logs/`);
    return response.data;
  },

  // Trigger manual validation for a document
  triggerValidation: async (documentId) => {
    const response = await api.post('/ai-validation/validations/trigger_validation/', {
      document_id: documentId
    });
    return response.data;
  }
};