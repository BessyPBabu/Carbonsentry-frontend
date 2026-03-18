import api from './api';
import axios from 'axios';

const PUBLIC_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const WS_BASE = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws')
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

    // public endpoint — no auth header, uses plain axios
    validateToken: async (token) => {
        const res = await axios.get(`${PUBLIC_BASE}/api/communication/validate/${token}/`);
        return res.data;
    },

    // public endpoint — vendor submits the OTP from their email
    verifyOtp: async (token, otpCode) => {
        const res = await axios.post(`${PUBLIC_BASE}/api/communication/verify-otp/`, {
            token,
            otp_code: otpCode,
        });
        return res.data;
    },

    // officer connects with their JWT
    openOfficerSocket: (vendorId, { onMessage, onOpen, onClose, onError }) => {
        const token = localStorage.getItem("access");
        if (!token) {
            console.error('communicationService.openOfficerSocket: no JWT in localStorage');
            return null;
        }

        const url = `${WS_BASE}/ws/chat/${vendorId}/?token=${token}`;
        const ws  = new WebSocket(url);

        ws.onopen    = () => { console.log(`[WS] Officer connected | vendor=${vendorId}`); onOpen?.(); };
        ws.onmessage = (event) => {
            try { onMessage?.(JSON.parse(event.data)); }
            catch (err) { console.error('[WS] parse error:', err); }
        };
        ws.onclose = (event) => { console.log(`[WS] Officer closed | code=${event.code}`); onClose?.(event); };
        ws.onerror = (err)   => { console.error('[WS] Officer error:', err); onError?.(err); };

        return ws;
    },

    // vendor connects with the chat token (from email link)
    openVendorSocket: (vendorId, chatToken, { onMessage, onOpen, onClose, onError }) => {
        const url = `${WS_BASE}/ws/chat/${vendorId}/?chat_token=${chatToken}`;
        const ws  = new WebSocket(url);

        ws.onopen    = () => { console.log(`[WS] Vendor connected | vendor=${vendorId}`); onOpen?.(); };
        ws.onmessage = (event) => {
            try { onMessage?.(JSON.parse(event.data)); }
            catch (err) { console.error('[WS] parse error:', err); }
        };
        ws.onclose = (event) => { console.log(`[WS] Vendor closed | code=${event.code}`); onClose?.(event); };
        ws.onerror = (err)   => { console.error('[WS] Vendor error:', err); onError?.(err); };

        return ws;
    },

    sendMessage: (ws, content, messageType = 'vendor_message') => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.error('communicationService.sendMessage: socket not open');
            return false;
        }
        ws.send(JSON.stringify({ content, message_type: messageType }));
        return true;
    },
};

export default communicationService;