import api from './api';


const reportService = {

    getReports: async (filters = {}) => {
        const params = {};
        if (filters.report_type) params.report_type = filters.report_type;
        if (filters.status)      params.status = filters.status;
        if (filters.vendor)      params.vendor = filters.vendor;
        if (filters.page)        params.page = filters.page;

        const res = await api.get('/reports/', { params });
        
        return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },

    getReportById: async (id) => {
        const res = await api.get(`/reports/${id}/`);
        return res.data;
    },

    generateReport: async (payload) => {
        const res = await api.post('/reports/generate/', payload);
        return res.data;
    },

    approveReport: async (id, approval_notes = '') => {
        const res = await api.patch(`/reports/${id}/approve/`, { approval_notes });
        return res.data;
    },

    deleteReport: async (id) => {
        await api.delete(`/reports/${id}/`);
    },

    downloadPdf: async (id, filename = 'report.pdf') => {
        try {
            const res = await api.get(`/reports/${id}/download_pdf/`, {
                responseType: 'blob',
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('reportService.downloadPdf failed:', err);
            throw err;
        }
    },

    downloadJson: (report) => {
        try {
            const dataStr = JSON.stringify(report.data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `report_${report.id}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('reportService.downloadJson failed:', err);
            throw err;
        }
    },
};

export default reportService;