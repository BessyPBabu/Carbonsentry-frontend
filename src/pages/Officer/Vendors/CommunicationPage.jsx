import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import communicationService from '../../../services/communicationService';
import { useAuth } from '../../../context/AuthContext';

const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (name = '') =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const RISK_COLORS = {
    low:      'bg-green-100 text-green-700',
    medium:   'bg-yellow-100 text-yellow-700',
    high:     'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
    unknown:  'bg-gray-100 text-gray-500',
};

const ChatSidebarItem = ({ vendor, isActive, onClick }) => (
    <button
        onClick={() => onClick(vendor.id)}
        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/10 transition-colors border-b border-white/10 ${
            isActive ? 'bg-white/20' : ''
        }`}
    >
        <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
            {getInitials(vendor.name)}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
                <span className="text-white text-sm font-medium truncate">{vendor.name}</span>
                {vendor.last_message_at && (
                    <span className="text-white/50 text-xs flex-shrink-0">
                        {formatDate(vendor.last_message_at)}
                    </span>
                )}
            </div>
            <p className="text-white/60 text-xs truncate mt-0.5">
                {vendor.last_message || 'No messages yet'}
            </p>
        </div>
    </button>
);

const ChatBubble = ({ msg }) => {
    const isOutbound = msg.is_outbound;
    const isInternal = msg.direction === 'internal_note';

    return (
        <div className={`flex items-end gap-2 ${isOutbound ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isOutbound && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mb-1">
                    {getInitials(msg.sender_name)}
                </div>
            )}

            <div className={`flex flex-col gap-1 max-w-sm ${isOutbound ? 'items-end' : 'items-start'}`}>
                {!isOutbound && (
                    <span className="text-xs font-semibold text-gray-700 ml-1">{msg.sender_name}</span>
                )}

                <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isOutbound
                            ? 'bg-emerald-700 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                    } ${isInternal ? 'border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-900' : ''}`}
                >
                    {msg.message}
                    {isInternal && (
                        <span className="block text-xs text-emerald-600 mt-1">Internal note</span>
                    )}
                </div>

                <div className={`flex items-center gap-1.5 ${isOutbound ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                    {msg.direction === 'vendor_facing' && (
                        <span className={`text-xs ${msg.email_sent ? 'text-emerald-500' : 'text-red-400'}`}>
                            {msg.email_sent ? '✓✓' : '⚠'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const CommunicationPage = () => {
    const { vendorId: urlVendorId } = useParams();
    const navigate = useNavigate();
    const { role } = useAuth();

    const [chatList, setChatList] = useState([]);
    const [activeVendorId, setActiveVendorId] = useState(urlVendorId || null);
    const [messages, setMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [direction, setDirection] = useState('vendor_facing');
    const [sending, setSending] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const activeVendor = chatList.find((v) => v.id === activeVendorId);

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingChats(true);
                const data = await communicationService.getChatList();
                setChatList(data);
                if (!urlVendorId && data.length > 0) {
                    setActiveVendorId(data[0].id);
                }
            } catch (err) {
                console.error('CommunicationPage: failed to load chat list:', err);
            } finally {
                setLoadingChats(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!activeVendorId) return;
        const load = async () => {
            try {
                setLoadingMessages(true);
                setMessages([]);
                const data = await communicationService.getMessages(activeVendorId);
                setMessages(data);
            } catch (err) {
                console.error('CommunicationPage: failed to load messages:', err);
            } finally {
                setLoadingMessages(false);
            }
        };
        load();
    }, [activeVendorId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleVendorSelect = (vendorId) => {
        setActiveVendorId(vendorId);
        setError('');
    };

    const handleSend = async () => {
        if (!replyText.trim() || !activeVendorId || sending) return;

        try {
            setSending(true);
            setError('');
            const sent = await communicationService.sendMessage(
                activeVendorId, replyText.trim(), direction
            );
            setMessages((prev) => [...prev, sent]);
            setReplyText('');

            setChatList((prev) =>
                prev.map((v) =>
                    v.id === activeVendorId
                        ? { ...v, last_message: replyText.trim().slice(0, 80), last_message_at: new Date().toISOString(), last_direction: direction }
                        : v
                )
            );
        } catch (err) {
            console.error('CommunicationPage.handleSend:', err);
            setError(err.response?.data?.error || 'Failed to send message.');
        } finally {
            setSending(false);
            textareaRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">

            <div className="w-64 bg-[#1a6b55] flex flex-col flex-shrink-0">
                <div className="px-4 py-4 border-b border-white/10">
                    <h2 className="text-white font-semibold text-base">Vendor Chats</h2>
                    <p className="text-white/50 text-xs mt-0.5">
                        {chatList.length} conversation{chatList.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingChats ? (
                        <p className="text-white/50 text-sm text-center py-8">Loading...</p>
                    ) : chatList.length === 0 ? (
                        <p className="text-white/50 text-xs text-center py-8 px-4">
                            No conversations yet. Go to a vendor and send a message.
                        </p>
                    ) : (
                        chatList.map((vendor) => (
                            <ChatSidebarItem
                                key={vendor.id}
                                vendor={vendor}
                                isActive={vendor.id === activeVendorId}
                                onClick={handleVendorSelect}
                            />
                        ))
                    )}
                </div>
            </div>

            {activeVendor ? (
                <div className="flex-1 flex flex-col bg-gray-50 min-w-0">

                    <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                                {getInitials(activeVendor.name)}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{activeVendor.name}</h3>
                                <p className="text-xs text-gray-400">{activeVendor.industry}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_COLORS[activeVendor.risk_level]}`}>
                                {activeVendor.risk_level} risk
                            </span>
                            <button
                                onClick={() => navigate(`/officer/vendors/${activeVendor.id}`)}
                                className="text-xs text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50"
                            >
                                View Vendor
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                Loading messages...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                No messages yet. Send the first message below.
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <ChatBubble key={msg.id} msg={msg} />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {role !== 'viewer' && (
                        <div className="bg-white border-t px-4 py-3">

                            <div className="flex gap-2 mb-2">
                                {[
                                    { value: 'vendor_facing', label: 'To Vendor' },
                                    { value: 'internal_note', label: 'Internal Note' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDirection(opt.value)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                            direction === opt.value
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <p className="text-xs text-red-500 mb-2">{error}</p>
                            )}

                            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                <button className="text-gray-400 hover:text-gray-600 pb-1">
                                    <span className="text-lg">☺</span>
                                </button>
                                <textarea
                                    ref={textareaRef}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Reply..."
                                    rows={1}
                                    className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none max-h-32"
                                    style={{ minHeight: '24px' }}
                                />
                                <button className="text-gray-400 hover:text-gray-600 pb-1">
                                    <span className="text-base">🖼</span>
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !replyText.trim()}
                                    className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    <span className="text-sm">›</span>
                                </button>
                            </div>

                            {direction === 'vendor_facing' && (
                                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                                    Email will be sent to vendor on submit
                                </p>
                            )}
                            {direction === 'internal_note' && (
                                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                                    Only visible to your team
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                    {loadingChats ? 'Loading...' : 'Select a conversation from the sidebar'}
                </div>
            )}
        </div>
    );
};

export default CommunicationPage;