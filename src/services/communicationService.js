import api from './api';
import axios from 'axios';

const PUBLIC_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// base WebSocket URL — swap http/https for ws/wss automatically
const WS_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws')
    : 'ws://localhost:8000';

const communicationService = {

    // officer sidebar — list of vendors with at least one message
    getChatList: async () => {
        const res = await api.get('/communication/chats/');
        return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },

    // message history for a vendor — fetched once on page load
    getMessages: async (vendorId) => {
        const res = await api.get(`/communication/chats/${vendorId}/messages/`);
        return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },

    // send a chat invitation email to a vendor
    sendChatInvite: async (vendorId, email = '') => {
        const payload = { vendor_id: vendorId };
        if (email) payload.email = email;
        const res = await api.post('/communication/invite/', payload);
        return res.data;
    },

    // revoke a token so the vendor link stops working
    revokeToken: async (tokenId) => {
        const res = await api.post(`/communication/tokens/${tokenId}/revoke/`);
        return res.data;
    },

    // public — validate a vendor chat token before opening WebSocket
    validateToken: async (token) => {
        const res = await axios.get(
            `${PUBLIC_BASE}/api/communication/validate/${token}/`
        );
        return res.data;
    },

    // ---------------------------------------------------------------
    // WebSocket helpers
    // ---------------------------------------------------------------

    // officer WebSocket — uses JWT from localStorage for auth
    openOfficerSocket: (vendorId, { onMessage, onOpen, onClose, onError }) => {
        const token = localStorage.getItem('access');
        if (!token) {
            console.error('communicationService.openOfficerSocket: no JWT in localStorage');
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

    // vendor WebSocket — uses chat token from URL for auth
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

    // send a message through an open WebSocket
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