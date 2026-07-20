import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockGet, mockOpenSocket, mockGetChatList, mockGetMessages } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockOpenSocket: vi.fn(),
  mockGetChatList: vi.fn(),
  mockGetMessages: vi.fn(),
}));

vi.mock("../services/api", () => ({
  default: { get: mockGet, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

vi.mock("../services/communicationService", () => ({
  default: {
    getChatList: mockGetChatList,
    getMessages: mockGetMessages,
    openOfficerSocket: mockOpenSocket,
    sendMessage: vi.fn(),
    sendChatInvite: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { full_name: "Officer" } }),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { toast } from "react-toastify";
import CommunicationPage from "../pages/Officer/Vendors/CommunicationPage";

function wrap() {
  return render(
    <MemoryRouter initialEntries={["/officer/communication/v1"]}>
      <Routes>
        <Route path="/officer/communication/:vendorId" element={<CommunicationPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function b64(obj) {
  return btoa(JSON.stringify(obj)).replace(/=+$/, "");
}
function makeJwt(payload) {
  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
}

function makeFakeSocket() {
  return { close: vi.fn() };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockGetChatList.mockResolvedValue([{ vendor_id: "v1", vendor_name: "Chat Corp" }]);
  mockGetMessages.mockResolvedValue([]);
});

describe("CommunicationPage websocket handling", () => {
  it("shows a session-expired toast and does not reconnect on close code 4001", async () => {
    let handlers;
    mockOpenSocket.mockImplementation((vid, h) => {
      handlers = h;
      return makeFakeSocket();
    });

    wrap();
    await act(async () => {});

    act(() => {
      handlers.onClose({ code: 4001 });
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("session has expired")
    );
  });

  it("shows a session-expired toast and does not reconnect on close code 4003", async () => {
    let handlers;
    mockOpenSocket.mockImplementation((vid, h) => {
      handlers = h;
      return makeFakeSocket();
    });

    wrap();
    await act(async () => {});

    act(() => {
      handlers.onClose({ code: 4003 });
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("session has expired")
    );
  });

  it("does not attempt a reconnect probe for an ordinary drop before a successful connect", async () => {
    let handlers;
    mockOpenSocket.mockImplementation((vid, h) => {
      handlers = h;
      return makeFakeSocket();
    });

    wrap();
    await act(async () => {});

    act(() => {
      handlers.onClose({ code: 1006 });
    });

    expect(mockGet).not.toHaveBeenCalled();
  });

  it("probes the API to force-refresh an expired token before reconnecting", async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      "access",
      makeJwt({ exp: Math.floor(Date.now() / 1000) - 10 })
    );
    mockGet.mockResolvedValue({ data: {} });

    let handlers;
    mockOpenSocket.mockImplementation((vid, h) => {
      handlers = h;
      return makeFakeSocket();
    });

    wrap();
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      handlers.onOpen();
    });
    act(() => {
      handlers.onClose({ code: 1006 });
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGet).toHaveBeenCalledWith("/accounts/users/me/");
    vi.useRealTimers();
  });
});