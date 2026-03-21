// src/tests/VendorChatPage.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../services/communicationService", () => ({
  default: {
    validateToken:    vi.fn(),
    verifyOtp:        vi.fn(),
    openVendorSocket: vi.fn(),
    sendMessage:      vi.fn(),
  },
}));

import VendorChatPage       from "../pages/Public/VendorChatPage";
import communicationService from "../services/communicationService";

const TOKEN = "test-token-abc";

function renderPage(token = TOKEN) {
  return render(
    <MemoryRouter initialEntries={[`/vendor-chat/${token}`]}>
      <Routes>
        <Route path="/vendor-chat/:token" element={<VendorChatPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => vi.clearAllMocks());

// ── Loading / token validation ────────────────────────────────────────
describe("Loading & token validation", () => {
  it("shows verifying spinner while validating", () => {
    communicationService.validateToken.mockReturnValueOnce(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/verifying your session/i)).toBeInTheDocument();
  });

  it("shows invalid screen for not_found token", async () => {
    communicationService.validateToken.mockResolvedValueOnce({ valid: false, reason: "not_found" });
    renderPage();
    await screen.findByText(/invalid link/i);
  });

  it("shows expired screen for expired token", async () => {
    communicationService.validateToken.mockResolvedValueOnce({ valid: false, reason: "expired" });
    renderPage();
    await screen.findByText(/link expired/i);
  });
});

// ── OTP flow ──────────────────────────────────────────────────────────
describe("OTP screen", () => {
  beforeEach(() => {
    communicationService.validateToken.mockResolvedValue({
      valid: true, otp_required: true,
      vendor_id: "v1", vendor_name: "Acme Corp",
    });
  });

  it("shows OTP screen when otp_required is true", async () => {
    renderPage();
    await screen.findByText(/verify your identity/i);
  });

  it("shows 6 individual digit inputs", async () => {
    renderPage();
    await screen.findByText(/verify your identity/i);
    expect(screen.getAllByRole("textbox").length).toBe(6);
  });

  it("shows vendor name on OTP screen", async () => {
    renderPage();
    await screen.findByText(/acme corp/i);
  });

  it("Continue button disabled when OTP incomplete", async () => {
    renderPage();
    await screen.findByText(/verify your identity/i);
    expect(screen.getByRole("button", { name: /continue to chat/i })).toBeDisabled();
  });

  it("Continue button enabled when all 6 digits entered", async () => {
    renderPage();
    await screen.findByText(/verify your identity/i);
    screen.getAllByRole("textbox").forEach((i) => fireEvent.change(i, { target: { value: "1" } }));
    expect(screen.getByRole("button", { name: /continue to chat/i })).not.toBeDisabled();
  });

  it("shows error on wrong OTP", async () => {
    communicationService.verifyOtp.mockResolvedValueOnce({ success: false, reason: "Incorrect code." });
    renderPage();
    await screen.findByText(/verify your identity/i);
    screen.getAllByRole("textbox").forEach((i) => fireEvent.change(i, { target: { value: "0" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue to chat/i })); });
    await screen.findByText(/incorrect code/i);
  });

  it("opens socket after correct OTP", async () => {
    communicationService.verifyOtp.mockResolvedValueOnce({ success: true, vendor_id: "v1" });
    communicationService.openVendorSocket.mockImplementation((vid, token, { onOpen }) => {
      setTimeout(() => onOpen(), 0);
      return new WebSocket("ws://test");
    });
    renderPage();
    await screen.findByText(/verify your identity/i);
    screen.getAllByRole("textbox").forEach((i) => fireEvent.change(i, { target: { value: "1" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /continue to chat/i })); });
    await waitFor(() =>
      expect(communicationService.openVendorSocket).toHaveBeenCalledWith(
        "v1", TOKEN, expect.any(Object)
      )
    );
  });
});

// ── Already verified — skip OTP ───────────────────────────────────────
describe("Already verified", () => {
  it("skips OTP and connects directly", async () => {
    communicationService.validateToken.mockResolvedValueOnce({
      valid: true, otp_required: false, vendor_id: "v1", vendor_name: "Corp",
    });
    communicationService.openVendorSocket.mockImplementation((vid, token, { onOpen }) => {
      setTimeout(() => onOpen(), 0);
      return new WebSocket("ws://test");
    });
    renderPage();
    await waitFor(() => expect(screen.queryByText(/verify your identity/i)).not.toBeInTheDocument());
    expect(communicationService.openVendorSocket).toHaveBeenCalled();
  });
});

// ── Connected chat UI ─────────────────────────────────────────────────
describe("Connected state", () => {
  let handlers = {};

  function setupConnected() {
    communicationService.validateToken.mockResolvedValue({
      valid: true, otp_required: false, vendor_id: "v1", vendor_name: "Chat Corp",
    });
    communicationService.openVendorSocket.mockImplementation((vid, token, h) => {
      handlers = h;
      setTimeout(() => h.onOpen(), 0);
      return new WebSocket("ws://test");
    });
  }

  it("shows textarea after connecting", async () => {
    setupConnected();
    renderPage();
    await screen.findByPlaceholderText(/type your message/i);
  });

  it("shows vendor name in header", async () => {
    setupConnected();
    renderPage();
    await screen.findByText(/chat corp/i);
  });

  it("displays received chat message", async () => {
    setupConnected();
    renderPage();
    await screen.findByPlaceholderText(/type your message/i);
    act(() => {
      handlers.onMessage({
        type: "chat_message", id: "m1", content: "Hello from officer",
        sender_type: "officer", message_type: "vendor_message",
        created_at: new Date().toISOString(),
      });
    });
    await screen.findByText(/hello from officer/i);
  });

  it("hides internal_note messages from vendor", async () => {
    setupConnected();
    renderPage();
    await screen.findByPlaceholderText(/type your message/i);
    act(() => {
      handlers.onMessage({
        type: "chat_message", id: "m2", content: "Secret note",
        sender_type: "officer", message_type: "internal_note",
        created_at: new Date().toISOString(),
      });
    });
    expect(screen.queryByText(/secret note/i)).not.toBeInTheDocument();
  });

  it("sends message on button click", async () => {
    setupConnected();
    communicationService.sendMessage.mockReturnValue(true);
    renderPage();
    await screen.findByPlaceholderText(/type your message/i);
    fireEvent.change(screen.getByPlaceholderText(/type your message/i), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    expect(communicationService.sendMessage).toHaveBeenCalledWith(
      expect.anything(), "Hello", "vendor_message"
    );
  });

  it("clears input after sending", async () => {
    setupConnected();
    communicationService.sendMessage.mockReturnValue(true);
    renderPage();
    await screen.findByPlaceholderText(/type your message/i);
    const ta = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(ta, { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    expect(ta.value).toBe("");
  });

  it("shows disconnected screen on socket close", async () => {
    setupConnected();
    renderPage();
    await screen.findByPlaceholderText(/type your message/i);
    act(() => handlers.onClose({ code: 1001 }));
    await screen.findByText(/connection lost/i);
  });

  it("shows expired screen on socket close code 4002", async () => {
    setupConnected();
    renderPage();
    await screen.findByPlaceholderText(/type your message/i);
    act(() => handlers.onClose({ code: 4002 }));
    await screen.findByText(/link expired/i);
  });
});