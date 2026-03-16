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

    exportCsv: async (filters = {}) => {
    const params = {};
    if (filters.action)     params.action      = filters.action;
    if (filters.actor)      params.actor       = filters.actor;
    if (filters.entityType) params.entity_type = filters.entityType;
    if (filters.dateFrom)   params.date_from   = filters.dateFrom;
    if (filters.dateTo)     params.date_to     = filters.dateTo;
 
    const res = await api.get('/audit_logs/export_csv/', {
        params,
        responseType: 'blob',
    });
 
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `audit_logs_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    },

};

export default auditLogService;