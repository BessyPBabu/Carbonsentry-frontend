import api from './api';

const auditLogService = {

    getLogs: async (filters = {}) => {
        const params = {};
        if (filters.action)      params.action = filters.action;
        if (filters.actor)       params.actor = filters.actor;
        if (filters.entityType)  params.entity_type = filters.entityType;
        if (filters.dateFrom)    params.date_from = filters.dateFrom;
        if (filters.dateTo)      params.date_to = filters.dateTo;
        if (filters.page)        params.page = filters.page;

        const res = await api.get('/audit_logs/', { params });
        return res.data;
    },

    getActionChoices: async () => {
        const res = await api.get('/audit_logs/action_choices/');
        return res.data;
    },

    exportCsv: (filters = {}) => {
    const token = localStorage.getItem('access');
    const params = new URLSearchParams({ ...filters, token });
    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
    window.open(`${baseURL}/api/audit_logs/export_csv/?${params.toString()}`);
    },

};

export default auditLogService;