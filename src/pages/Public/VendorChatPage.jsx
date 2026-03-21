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

const STATE = {
    VALIDATING:   'validating',
    OTP_REQUIRED: 'otp_required',
    CONNECTING:   'connecting',
    CONNECTED:    'connected',
    INVALID:      'invalid',
    EXPIRED:      'expired',
    DISCONNECTED: 'disconnected',
};

// ── OTP input — 6 individual boxes ──────────────────────────────────────────
function OtpInput({ value, onChange }) {
    const inputsRef = useRef([]);

    const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

    const handleChange = (idx, e) => {
        const char = e.target.value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[idx] = char;
        onChange(next.join(''));
        if (char && idx < 5) inputsRef.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            inputsRef.current[idx - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted.padEnd(6, '').slice(0, 6));
        inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-emerald-400
                        transition-colors
                        ${d ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'}
                    `}
                />
            ))}
        </div>
    );
}

// ── Shared screen wrappers ───────────────────────────────────────────────────
function CenteredCard({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
                {children}
            </div>
        </div>
    );
}

function Brand() {
    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">CarbonSentry</span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VendorChatPage() {
    const { token } = useParams();

    const [pageState, setPageState]         = useState(STATE.VALIDATING);
    const [vendorName, setVendorName]       = useState('');
    const [vendorId, setVendorId]           = useState(null);
    const [messages, setMessages]           = useState([]);
    const [input, setInput]                 = useState('');
    const [statusMsg, setStatusMsg]         = useState('');

    // OTP state
    const [otp, setOtp]                     = useState('');
    const [otpError, setOtpError]           = useState('');
    const [otpLoading, setOtpLoading]       = useState(false);

    const wsRef          = useRef(null);
    const messagesEndRef = useRef(null);

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) {
            setStatusMsg('No token provided in URL.');
            setPageState(STATE.INVALID);
            return;
        }
        validateToken();
    }, [token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => { wsRef.current?.close(); };
    }, []);

    // ── Step 1: validate the token ─────────────────────────────────────────────
    const validateToken = async () => {
        setPageState(STATE.VALIDATING);
        try {
            const result = await communicationService.validateToken(token);

            if (!result.valid) {
                setStatusMsg(
                    result.reason === 'expired'
                        ? 'This chat link has expired. Please ask your officer to send a new one.'
                        : 'This chat link is invalid or has already been revoked.'
                );
                setPageState(result.reason === 'expired' ? STATE.EXPIRED : STATE.INVALID);
                return;
            }

            setVendorName(result.vendor_name);
            setVendorId(result.vendor_id);

            // BUG FIX: backend requires OTP verification before WebSocket auth.
            // If otp_required is true, stop here and show the OTP entry screen.
            // Connecting to the socket without OTP verification returns code 4002.
            if (result.otp_required) {
                setPageState(STATE.OTP_REQUIRED);
            } else {
                // already verified — connect immediately
                setPageState(STATE.CONNECTING);
                openSocket(result.vendor_id);
            }
        } catch (err) {
            console.error('VendorChatPage.validateToken:', err);
            setStatusMsg('Failed to connect. Please try again or contact your officer.');
            setPageState(STATE.INVALID);
        }
    };

    // ── Step 2: verify OTP ─────────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setOtpError('Please enter all 6 digits.');
            return;
        }
        setOtpLoading(true);
        setOtpError('');
        try {
            const result = await communicationService.verifyOtp(token, otp);
            if (result.success) {
                setPageState(STATE.CONNECTING);
                openSocket(vendorId || result.vendor_id);
            } else {
                setOtpError(result.reason || 'Incorrect code. Please try again.');
                setOtp('');
            }
        } catch (err) {
            const msg = err?.response?.data?.reason || err?.response?.data?.otp_code?.[0] || 'Verification failed. Please try again.';
            setOtpError(msg);
            setOtp('');
        } finally {
            setOtpLoading(false);
        }
    };

    // ── Step 3: open WebSocket ─────────────────────────────────────────────────
    const openSocket = (vid) => {
        const ws = communicationService.openVendorSocket(vid, token, {
            onOpen: () => setPageState(STATE.CONNECTED),
            onClose: (event) => {
                if (event.code === 4002) {
                    setStatusMsg('Your session token is invalid or has expired.');
                    setPageState(STATE.EXPIRED);
                } else {
                    setPageState(STATE.DISCONNECTED);
                }
            },
            onError: () => setPageState(STATE.DISCONNECTED),
            onMessage: (data) => {
                if (data.type !== 'chat_message') return;
                if (data.message_type === 'internal_note') return;
                setMessages((prev) => {
                    if (prev.some((m) => m.id === data.id)) return prev;
                    return [...prev, data];
                });
            },
        });
        wsRef.current = ws;
    };

    // ── Send ───────────────────────────────────────────────────────────────────
    const handleSend = () => {
        const content = input.trim();
        if (!content || !wsRef.current) return;
        if (communicationService.sendMessage(wsRef.current, content, 'vendor_message')) {
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Screens ────────────────────────────────────────────────────────────────

    if (pageState === STATE.VALIDATING || pageState === STATE.CONNECTING) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 text-sm">
                        {pageState === STATE.VALIDATING ? 'Verifying your session…' : 'Connecting to chat…'}
                    </p>
                </div>
            </div>
        );
    }

    if (pageState === STATE.INVALID || pageState === STATE.EXPIRED) {
        return (
            <CenteredCard>
                <Brand />
                <div className="text-4xl mb-4">
                    {pageState === STATE.EXPIRED ? '⏰' : '🔒'}
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                    {pageState === STATE.EXPIRED ? 'Link Expired' : 'Invalid Link'}
                </h1>
                <p className="text-gray-500 text-sm">{statusMsg}</p>
                <p className="text-gray-400 text-xs mt-4">
                    Contact your compliance officer if you believe this is a mistake.
                </p>
            </CenteredCard>
        );
    }

    if (pageState === STATE.DISCONNECTED) {
        return (
            <CenteredCard>
                <Brand />
                <div className="text-4xl mb-4">📡</div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Lost</h1>
                <p className="text-gray-500 text-sm mb-6">
                    Your chat session was disconnected.
                </p>
                <button
                    onClick={validateToken}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm transition-colors"
                >
                    Reconnect
                </button>
            </CenteredCard>
        );
    }

    // ── OTP screen ─────────────────────────────────────────────────────────────
    if (pageState === STATE.OTP_REQUIRED) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full">
                    <Brand />

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
                        Verify your identity
                    </h1>
                    <p className="text-gray-500 text-sm text-center mb-2">
                        We sent a 6-digit verification code to your email.
                    </p>
                    {vendorName && (
                        <p className="text-center text-xs text-gray-400 mb-6">
                            Secure session for <span className="font-medium text-gray-600">{vendorName}</span>
                        </p>
                    )}

                    {/* OTP boxes */}
                    <div className="mb-6">
                        <OtpInput value={otp} onChange={setOtp} />
                    </div>

                    {/* Error */}
                    {otpError && (
                        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
                            {otpError}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleVerifyOtp}
                        disabled={otp.length !== 6 || otpLoading}
                        className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl
                            hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed
                            transition-colors"
                    >
                        {otpLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Verifying…
                            </span>
                        ) : 'Continue to Chat'}
                    </button>

                    <p className="text-xs text-gray-400 text-center mt-4">
                        Can't find the code? Check your spam folder or contact your compliance officer.
                    </p>

                    {/* Security badge */}
                    <div className="flex items-center justify-center gap-1 mt-6 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        End-to-end encrypted · CarbonSentry
                    </div>
                </div>
            </div>
        );
    }

    // ── Connected — chat UI ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* Header — FIX: replaced flex-shrink-0 with shrink-0 */}
            <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center
                    text-emerald-600 font-semibold shrink-0">
                    {vendorName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                        {vendorName} — CarbonSentry
                    </p>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-xs text-gray-400">Secure session active</span>
                    </div>
                </div>
                <div className="ml-auto shrink-0">
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
                        const showDay =
                            idx === 0 ||
                            formatDay(messages[idx - 1]?.created_at) !== formatDay(msg.created_at);

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
                        placeholder="Type your message…"
                        rows={2}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm
                            resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl
                            hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed
                            transition-colors self-end"
                    >
                        Send
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                    Enter to send · Shift+Enter for new line · Session expires in 72 hours
                </p>
            </div>
        </div>
    );
}