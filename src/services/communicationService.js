import api from './api';

const WS_BASE = (import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000').replace(/\/$/, '');

const communicationService = {

    // ── REST ──────────────────────────────────────────────────────────────────

    getChatList: async () => {
        const res = await api.get('/communication/chats/');
        const data = res.data;
        // handle both paginated { results: [] } and plain array
        return Array.isArray(data) ? data : (data.results || []);
    },

    getMessages: async (vendorId) => {
        const res = await api.get(`/communication/chats/${vendorId}/messages/`);
        const data = res.data;
        return Array.isArray(data) ? data : (data.results || []);
    },

    sendChatInvite: async (vendorId, email = '') => {
        const payload = { vendor_id: vendorId };
        if (email && email.trim()) payload.email = email.trim();
        const res = await api.post('/communication/invite/', payload);
        return res.data;
    },

    revokeToken: async (tokenId) => {
        const res = await api.post(`/communication/tokens/${tokenId}/revoke/`);
        return res.data;
    },

    // ── Public (no auth) ──────────────────────────────────────────────────────

    validateToken: async (token) => {
        const res = await api.get(`/communication/validate/${token}/`);
        return res.data;
    },

    verifyOtp: async (token, otpCode) => {
        const res = await api.post('/communication/verify-otp/', {
            token,
            otp_code: otpCode,
        });
        return res.data;
    },

    // ── WebSockets ────────────────────────────────────────────────────────────

    /**
     * Opens a WebSocket as an officer (authenticated with JWT).
     * Passes the access token as ?token= query param because the browser
     * WebSocket API does not support custom headers.
     */
    openOfficerSocket: (vendorId, { onOpen, onClose, onError, onMessage }) => {
        const jwtToken = localStorage.getItem('access');
        if (!jwtToken) {
            console.error('communicationService.openOfficerSocket: no JWT found');
            return null;
        }

        const url = `${WS_BASE}/ws/chat/${vendorId}/?token=${jwtToken}`;
        let ws;

        try {
            ws = new WebSocket(url);
        } catch (err) {
            console.error('communicationService.openOfficerSocket: WebSocket init failed', err);
            return null;
        }

        ws.onopen    = () => { onOpen?.(); };
        ws.onclose   = (event) => { onClose?.(event); };
        ws.onerror   = (event) => { onError?.(event); };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch (err) {
                console.error('communicationService: failed to parse WS message', err);
            }
        };

        return ws;
    },

    /**
     * Opens a WebSocket as a vendor (authenticated with chat token).
     * The chat token must already be OTP-verified on the server side.
     */
    openVendorSocket: (vendorId, chatToken, { onOpen, onClose, onError, onMessage }) => {
        if (!chatToken) {
            console.error('communicationService.openVendorSocket: no chat token provided');
            return null;
        }

        const url = `${WS_BASE}/ws/chat/${vendorId}/?chat_token=${chatToken}`;
        let ws;

        try {
            ws = new WebSocket(url);
        } catch (err) {
            console.error('communicationService.openVendorSocket: WebSocket init failed', err);
            return null;
        }

        ws.onopen    = () => { onOpen?.(); };
        ws.onclose   = (event) => { onClose?.(event); };
        ws.onerror   = (event) => { onError?.(event); };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch (err) {
                console.error('communicationService: failed to parse WS message', err);
            }
        };

        return ws;
    },

    /**
     * Sends a message over an open WebSocket.
     * Returns false if the socket is not open.
     */
    sendMessage: (ws, content, messageType = 'vendor_message') => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        try {
            ws.send(JSON.stringify({ content, message_type: messageType }));
            return true;
        } catch (err) {
            console.error('communicationService.sendMessage: failed to send', err);
            return false;
        }
    },
};

export default communicationService;