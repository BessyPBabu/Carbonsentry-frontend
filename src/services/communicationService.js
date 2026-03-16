import api from './api';
import axios from 'axios';

const PUBLIC_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


const WS_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws')
    : 'ws://localhost:8000';

const communicationService = {

   
    getChatList: async () => {
        const res = await api.get('/communication/chats/');
        return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },

    
    getMessages: async (vendorId) => {
        const res = await api.get(`/communication/chats/${vendorId}/messages/`);
        return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },

    
    sendChatInvite: async (vendorId, email = '') => {
        const payload = { vendor_id: vendorId };
        if (email) payload.email = email;
        const res = await api.post('/communication/invite/', payload);
        return res.data;
    },

    
    revokeToken: async (tokenId) => {
        const res = await api.post(`/communication/tokens/${tokenId}/revoke/`);
        return res.data;
    },

    
    validateToken: async (token) => {
        const res = await axios.get(
            `${PUBLIC_BASE}/api/communication/validate/${token}/`
        );
        return res.data;
    },

   
    openOfficerSocket: (vendorId, { onMessage, onOpen, onClose, onError }) => {
        const token = localStorage.getItem("access");
        if (!token) {
            console.error('communicationService.openOfficerSocket: no JWT in sessionStorage');
            return null;
        }

        const url = `${WS_BASE}/ws/chat/${vendorId}/?token=${token}`;
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log(`[WS] Officer connected to vendor chat ${vendorId}`);
            onOpen?.();
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch (err) {
                console.error('[WS] Failed to parse message:', err);
            }
        };
        ws.onclose = (event) => {
            console.log(`[WS] Officer disconnected from vendor chat ${vendorId} | code=${event.code}`);
            onClose?.(event);
        };
        ws.onerror = (err) => {
            console.error('[WS] Officer WebSocket error:', err);
            onError?.(err);
        };

        return ws;
    },

   
    openVendorSocket: (vendorId, chatToken, { onMessage, onOpen, onClose, onError }) => {
        const url = `${WS_BASE}/ws/chat/${vendorId}/?chat_token=${chatToken}`;
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log(`[WS] Vendor connected to chat ${vendorId}`);
            onOpen?.();
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch (err) {
                console.error('[WS] Failed to parse message:', err);
            }
        };
        ws.onclose = (event) => {
            console.log(`[WS] Vendor disconnected from chat | code=${event.code}`);
            onClose?.(event);
        };
        ws.onerror = (err) => {
            console.error('[WS] Vendor WebSocket error:', err);
            onError?.(err);
        };

        return ws;
    },


    sendMessage: (ws, content, messageType = 'vendor_message') => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error('communicationService.sendMessage: WebSocket not open');
            return false;
        }
        ws.send(JSON.stringify({ content, message_type: messageType }));
        return true;
    },
};

export default communicationService;