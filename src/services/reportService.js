import api from './api';

const reportService = {

    getReports: async (filters = {}) => {
        const params = {};
        if (filters.report_type) params.report_type = filters.report_type;
        if (filters.status)      params.status      = filters.status;
        if (filters.vendor)      params.vendor      = filters.vendor;
        if (filters.page)        params.page        = filters.page;

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
        let res;
        try {
            res = await api.get(`/reports/${id}/download_pdf/`, {
                responseType: 'blob',
            });
        } catch (err) {
            // the interceptor may have already handled a 401, but for other
            // errors we need to extract the message from the blob body
            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    const json = JSON.parse(text);
                    throw new Error(json.error || `Download failed (${err.response.status})`);
                } catch {
                    throw new Error(`Download failed (${err.response?.status || 'unknown'})`);
                }
            }
            throw err;
        }

        // verify we actually got a PDF and not an HTML error page
        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('application/pdf') && !contentType.includes('octet-stream')) {
            // server returned something unexpected — try to show the error text
            const text = await res.data.text();
            try {
                const json = JSON.parse(text);
                throw new Error(json.error || 'Server returned unexpected content type');
            } catch {
                throw new Error('Server returned unexpected content type');
            }
        }

        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    downloadJson: (report) => {
        const blob = new Blob(
            [JSON.stringify(report.data, null, 2)],
            { type: 'application/json' }
        );
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `report_${report.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
};

export default reportService;