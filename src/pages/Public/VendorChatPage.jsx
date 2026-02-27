import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import communicationService from '../../services/communicationService';

const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
    });
};

const formatDay = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

// possible page states
const STATE = {
    VALIDATING: 'validating',
    INVALID: 'invalid',
    EXPIRED: 'expired',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
};

export default function VendorChatPage() {
    const { token } = useParams();

    const [pageState, setPageState] = useState(STATE.VALIDATING);
    const [vendorName, setVendorName] = useState('');
    const [vendorId, setVendorId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [invalidReason, setInvalidReason] = useState('');

    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);

    // step 1 — validate the token via REST before opening WebSocket
    useEffect(() => {
        if (!token) {
            setInvalidReason('No token provided in URL.');
            setPageState(STATE.INVALID);
            return;
        }
        validateAndConnect();
    }, [token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const validateAndConnect = async () => {
        try {
            setPageState(STATE.VALIDATING);
            const result = await communicationService.validateToken(token);

            if (!result.valid) {
                if (result.reason === 'expired') {
                    setInvalidReason('This chat link has expired. Please ask your officer to send a new one.');
                    setPageState(STATE.EXPIRED);
                } else {
                    setInvalidReason('This chat link is invalid or has already been revoked.');
                    setPageState(STATE.INVALID);
                }
                return;
            }

            setVendorName(result.vendor_name);
            setVendorId(result.vendor_id);
            setPageState(STATE.CONNECTING);

            // open WebSocket using the chat token
            openSocket(result.vendor_id);

        } catch (err) {
            console.error('VendorChatPage.validateAndConnect:', err);
            setInvalidReason('Failed to connect. Please try again or contact your officer.');
            setPageState(STATE.INVALID);
        }
    };

    const openSocket = (vid) => {
        const ws = communicationService.openVendorSocket(vid, token, {
            onOpen: () => {
                setPageState(STATE.CONNECTED);
            },
            onClose: (event) => {
                // close codes set by the server consumer
                if (event.code === 4002) {
                    setInvalidReason('Your session token is invalid or has expired.');
                    setPageState(STATE.EXPIRED);
                } else {
                    setPageState(STATE.DISCONNECTED);
                }
            },
            onError: () => {
                setPageState(STATE.DISCONNECTED);
            },
            onMessage: (data) => {
                if (data.type === 'chat_message') {
                    // vendors don't see internal notes at all — the server already filters
                    // but double-check on client side too
                    if (data.message_type === 'internal_note') return;

                    setMessages(prev => {
                        const exists = prev.some(m => m.id === data.id);
                        if (exists) return prev;
                        return [...prev, data];
                    });
                }
            },
        });

        wsRef.current = ws;
    };

    const handleSend = () => {
        const content = input.trim();
        if (!content || !wsRef.current) return;

        const sent = communicationService.sendMessage(wsRef.current, content, 'vendor_message');
        if (sent) {
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ---------------------------------------------------------------
    // Render states
    // ---------------------------------------------------------------

    if (pageState === STATE.VALIDATING || pageState === STATE.CONNECTING) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">
                        {pageState === STATE.VALIDATING ? 'Verifying your session...' : 'Connecting to chat...'}
                    </p>
                </div>
            </div>
        );
    }

    if (pageState === STATE.INVALID || pageState === STATE.EXPIRED) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md w-full text-center">
                    <div className={`text-5xl mb-4 ${pageState === STATE.EXPIRED ? '⏰' : '🔒'}`}>
                        {pageState === STATE.EXPIRED ? '⏰' : '🔒'}
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        {pageState === STATE.EXPIRED ? 'Link Expired' : 'Invalid Link'}
                    </h1>
                    <p className="text-gray-600 text-sm">{invalidReason}</p>
                    <p className="text-gray-400 text-xs mt-4">
                        If you believe this is a mistake, please contact your compliance officer directly.
                    </p>
                </div>
            </div>
        );
    }

    if (pageState === STATE.DISCONNECTED) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">📡</div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Lost</h1>
                    <p className="text-gray-600 text-sm mb-4">
                        Your chat session was disconnected. Click below to reconnect.
                    </p>
                    <button
                        onClick={validateAndConnect}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm transition-colors"
                    >
                        Reconnect
                    </button>
                </div>
            </div>
        );
    }

    // STATE.CONNECTED — main chat UI
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold">
                    {vendorName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">{vendorName}</p>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-xs text-gray-400">Secure session active</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        🔒 Encrypted
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-w-2xl w-full mx-auto">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-12">
                        <p className="mb-1">You're connected.</p>
                        <p>Send a message to start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isVendor = msg.sender_type === 'vendor';
                        const showDay = idx === 0 || formatDay(messages[idx - 1]?.created_at) !== formatDay(msg.created_at);

                        return (
                            <React.Fragment key={msg.id || idx}>
                                {showDay && (
                                    <div className="text-center text-xs text-gray-400 my-2">
                                        {formatDay(msg.created_at)}
                                    </div>
                                )}
                                <div className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex flex-col max-w-xs ${isVendor ? 'items-end' : 'items-start'}`}>
                                        <span className="text-xs text-gray-400 mb-1 px-1">
                                            {isVendor ? 'You' : 'Compliance Officer'}
                                        </span>
                                        <div className={`px-4 py-2 rounded-2xl text-sm ${
                                            isVendor
                                                ? 'bg-emerald-600 text-white rounded-br-sm'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-xs text-gray-300 mt-1 px-1">
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t px-4 py-3">
                <div className="max-w-2xl mx-auto flex gap-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={2}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
                    >
                        Send
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                    Enter to send · Shift+Enter for new line · This session expires in 72 hours
                </p>
            </div>
        </div>
    );
}