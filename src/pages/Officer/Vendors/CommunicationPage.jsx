import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import communicationService from '../../../services/communicationService';
import { useAuth } from '../../../context/AuthContext';

const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDay = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const MAX_RECONNECT_ATTEMPTS = 5;

export default function CommunicationPage() {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [chatList, setChatList] = useState([]);
    const [activeVendorId, setActiveVendorId] = useState(vendorId || null);
    const [activeVendorName, setActiveVendorName] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [messageType, setMessageType] = useState('vendor_message');
    const [connected, setConnected] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    // Tracks the active vendor synchronously — updated before setState so WS callbacks
    // that fire after a vendor switch don't schedule a reconnect for the old vendor.
    const activeVendorIdRef = useRef(activeVendorId);

    // Holds the latest openSocket function reference so reconnect closures never
    // call a stale version of the function.
    const openSocketRef = useRef(null);

    // mount / unmount — load list once and clean up everything on exit
    useEffect(() => {
        loadChatList();
        return () => {
            _clearReconnect();
            _closeSocket();
        };
    }, []);

    // open a fresh socket whenever the active vendor changes
    useEffect(() => {
        if (!activeVendorId) return;
        loadMessages(activeVendorId);
        openSocket(activeVendorId);
        return () => {
            _closeSocket();
        };
    }, [activeVendorId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── helpers ──────────────────────────────────────────────────────────────

    const _clearReconnect = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    };

    const _closeSocket = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
            setConnected(false);
        }
    };

    // ── socket ───────────────────────────────────────────────────────────────

    const openSocket = (vid) => {
        // close any existing socket before opening a new one
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        // tracks whether this specific connection ever reached OPEN state,
        // so we only attempt reconnection for drops after a successful connect
        let wasConnected = false;

        const ws = communicationService.openOfficerSocket(vid, {
            onOpen: () => {
                wasConnected = true;
                reconnectAttemptsRef.current = 0;
                setConnected(true);
            },

            onClose: () => {
                setConnected(false);

                // skip reconnect if:
                //  • socket never successfully connected (auth failure etc.)
                //  • user has already switched to a different vendor
                //  • we've hit the retry ceiling
                const stillSameVendor = activeVendorIdRef.current === vid;
                if (
                    !wasConnected ||
                    !stillSameVendor ||
                    reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS
                ) {
                    return;
                }

                const attempt = reconnectAttemptsRef.current;
                // exponential back-off capped at 30 s
                const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);
                reconnectAttemptsRef.current += 1;

                console.info(
                    `CommunicationPage: reconnect vendor=${vid} in ${delay}ms (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`
                );

                reconnectTimeoutRef.current = setTimeout(() => {
                    // one last check — vendor may have changed while timer was pending
                    if (activeVendorIdRef.current === vid) {
                        openSocketRef.current?.(vid);
                    }
                }, delay);
            },

            onError: () => {
                setConnected(false);
                if (wasConnected) {
                    toast.error('Connection lost. Trying to reconnect...');
                }
            },

            onMessage: (data) => {
                if (data.type !== 'chat_message') return;
                setMessages((prev) => {
                    // deduplicate: the same message can arrive via REST load and WS push
                    if (prev.some((m) => m.id === data.id)) return prev;
                    return [
                        ...prev,
                        {
                            id: data.id,
                            content: data.content,
                            message_type: data.message_type,
                            sender_type: data.sender_type,
                            sender_name: data.sender_name,
                            created_at: data.created_at,
                        },
                    ];
                });
            },
        });

        wsRef.current = ws;
    };

    // keep the ref current on every render so the reconnect timeout always
    // invokes the latest closure (important after React state updates)
    openSocketRef.current = openSocket;

    // ── vendor selection ──────────────────────────────────────────────────────

    const selectVendor = (vid, name) => {
        // 1. kill any pending reconnect timer for the previous vendor
        _clearReconnect();
        reconnectAttemptsRef.current = 0;

        // 2. update the ref synchronously BEFORE closing the socket
        //    so the onClose callback that fires next sees the new vendor ID
        //    and skips scheduling a reconnect for the old one
        activeVendorIdRef.current = vid;

        // 3. close old socket (its onClose will now see activeVendorIdRef !== old vid)
        _closeSocket();

        setActiveVendorId(vid);
        setActiveVendorName(name);
        setMessages([]);
        navigate(`/officer/communication/${vid}`, { replace: true });
    };

    // ── data loaders ──────────────────────────────────────────────────────────

    const loadChatList = async () => {
        try {
            setLoadingList(true);
            const list = await communicationService.getChatList();
            setChatList(list);

            if (!activeVendorId && list.length > 0) {
                selectVendor(list[0].vendor_id, list[0].vendor_name);
            }
        } catch (err) {
            console.error('CommunicationPage.loadChatList:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const loadMessages = async (vid) => {
        try {
            setLoadingMessages(true);
            const msgs = await communicationService.getMessages(vid);
            setMessages(msgs);
        } catch (err) {
            console.error('CommunicationPage.loadMessages:', err);
            toast.error('Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    // ── send ──────────────────────────────────────────────────────────────────

    const handleSend = () => {
        const content = input.trim();
        if (!content || !wsRef.current) return;

        const sent = communicationService.sendMessage(wsRef.current, content, messageType);
        if (sent) {
            setInput('');
        } else {
            toast.error('Not connected. Please wait...');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSendInvite = async () => {
        if (!activeVendorId) return;
        try {
            setInviting(true);
            const res = await communicationService.sendChatInvite(activeVendorId, inviteEmail);
            toast.success(res.message || 'Invitation sent');
            setShowInviteModal(false);
            setInviteEmail('');
            loadChatList();
        } catch (err) {
            console.error('CommunicationPage.handleSendInvite:', err);
            toast.error(err.response?.data?.error || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    const myName = user?.full_name || user?.email || 'You';

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">

            {/* Sidebar */}
            <div className="w-72 border-r bg-white flex flex-col shrink-0">
                <div className="px-4 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Vendor Chats</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Real-time secure messaging</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingList ? (
                        <div className="p-4 text-sm text-gray-400">Loading chats...</div>
                    ) : chatList.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400">
                            No active chats yet. Send an invite from a vendor's page.
                        </div>
                    ) : (
                        chatList.map((chat) => (
                            <button
                                key={chat.vendor_id}
                                onClick={() => selectVendor(chat.vendor_id, chat.vendor_name)}
                                className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
                                    activeVendorId === chat.vendor_id
                                        ? 'bg-emerald-50 border-l-2 border-l-emerald-500'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-800 text-sm truncate">
                                        {chat.vendor_name}
                                    </span>
                                    {chat.unread_count > 0 && (
                                        <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 shrink-0">
                                            {chat.unread_count}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">
                                    {chat.last_message || 'No messages yet'}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            chat.has_active_token ? 'bg-green-400' : 'bg-gray-300'
                                        }`}
                                    />
                                    <span className="text-xs text-gray-400">
                                        {chat.has_active_token ? 'Link active' : 'No active link'}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main chat area */}
            {activeVendorId ? (
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Chat header */}
                    <div className="px-6 py-3 border-b bg-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                                {activeVendorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{activeVendorName}</h3>
                                <div className="flex items-center gap-1">
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            connected ? 'bg-green-400' : 'bg-gray-300'
                                        }`}
                                    />
                                    <span className="text-xs text-gray-400">
                                        {connected ? 'Connected' : 'Connecting...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="px-3 py-1.5 text-sm border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                            Send Chat Link
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 bg-gray-50">
                        {loadingMessages ? (
                            <div className="text-center text-gray-400 text-sm mt-8">Loading messages...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm mt-8">
                                No messages yet. Send a chat link to the vendor to get started.
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isOfficer = msg.sender_type === 'officer';
                                const isInternal = msg.message_type === 'internal_note';
                                const showDay =
                                    idx === 0 ||
                                    formatDay(messages[idx - 1]?.created_at) !== formatDay(msg.created_at);

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDay && (
                                            <div className="text-center text-xs text-gray-400 my-2">
                                                {formatDay(msg.created_at)}
                                            </div>
                                        )}
                                        <div className={`flex ${isOfficer ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-sm flex flex-col ${
                                                    isOfficer ? 'items-end' : 'items-start'
                                                }`}
                                            >
                                                <span className="text-xs text-gray-400 mb-1 px-1">
                                                    {msg.sender_name || (isOfficer ? myName : activeVendorName)}
                                                </span>
                                                <div
                                                    className={`px-4 py-2 rounded-2xl text-sm ${
                                                        isInternal
                                                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-tr-sm'
                                                            : isOfficer
                                                            ? 'bg-emerald-600 text-white rounded-br-sm'
                                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                                                    }`}
                                                >
                                                    {isInternal && (
                                                        <span className="text-xs font-medium text-yellow-600 block mb-1">
                                                            🔒 Internal Note
                                                        </span>
                                                    )}
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

                    {/* Input area */}
                    <div className="px-6 py-4 bg-white border-t shrink-0">
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setMessageType('vendor_message')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    messageType === 'vendor_message'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Vendor Message
                            </button>
                            <button
                                onClick={() => setMessageType('internal_note')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    messageType === 'internal_note'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                🔒 Internal Note
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    messageType === 'internal_note'
                                        ? 'Write an internal note (only officers see this)...'
                                        : 'Type a message to the vendor...'
                                }
                                rows={2}
                                className={`flex-1 border rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 ${
                                    messageType === 'internal_note'
                                        ? 'border-yellow-200 focus:ring-yellow-300 bg-yellow-50'
                                        : 'border-gray-200 focus:ring-emerald-400'
                                }`}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || !connected}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
                            >
                                Send
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Press Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                    <div className="text-center">
                        <p className="text-lg mb-2">Select a vendor chat</p>
                        <p className="text-sm">Or send a chat invitation from a vendor's detail page</p>
                    </div>
                </div>
            )}

            {/* Send Invite Modal */}
            {showInviteModal && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}
                >
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="font-semibold text-gray-900">Send Chat Invitation</h3>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-600 mb-4">
                                A secure chat link will be emailed to the vendor. The link expires in 72 hours.
                            </p>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email address{' '}
                                <span className="text-gray-400 font-normal">
                                    (leave blank to use vendor's default email)
                                </span>
                            </label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="vendor@company.com"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendInvite}
                                disabled={inviting}
                                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {inviting ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}