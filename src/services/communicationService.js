import api from './api';

const communicationService = {

    getChatList: async () => {
        const res = await api.get('/communication/chats/');
        return res.data;
    },

    getMessages: async (vendorId) => {
        const res = await api.get(`/communication/vendors/${vendorId}/messages/`);
        return res.data;
    },

    sendMessage: async (vendorId, message, direction) => {
        const res = await api.post(`/communication/vendors/${vendorId}/messages/`, { message, direction });
        return res.data;
    },

};

export default communicationService;