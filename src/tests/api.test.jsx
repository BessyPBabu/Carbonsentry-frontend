import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPost, mockInstanceCall, capturedHandlers } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockInstanceCall: vi.fn(),
  capturedHandlers: { fulfilled: null, rejected: null },
}));

vi.mock("axios", () => {
  const instance = Object.assign(
    (config) => mockInstanceCall(config),
    {
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: {
          use: (fulfilled, rejected) => {
            capturedHandlers.fulfilled = fulfilled;
            capturedHandlers.rejected = rejected;
          },
        },
      },
    }
  );
  const axiosMock = {
    create: () => instance,
    post: mockPost,
  };
  return { default: axiosMock };
});

import "../services/api";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(window, "location", {
    writable: true,
    value: { href: "" },
  });
});

describe("api.js token refresh", () => {
  it("dedupes concurrent 401s into a single refresh call", async () => {
    localStorage.setItem("access", "old-access");
    localStorage.setItem("refresh", "refresh-token");
    mockPost.mockResolvedValue({ data: { access: "new-access" } });

    const cfg1 = { headers: {}, url: "/a/" };
    const cfg2 = { headers: {}, url: "/b/" };

    await Promise.all([
      capturedHandlers.rejected({ response: { status: 401 }, config: cfg1 }),
      capturedHandlers.rejected({ response: { status: 401 }, config: cfg2 }),
    ]);

    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("retries the original request with the new access token", async () => {
    localStorage.setItem("access", "old");
    localStorage.setItem("refresh", "refresh-token");
    mockPost.mockResolvedValueOnce({ data: { access: "fresh-token" } });

    const cfg = { headers: {}, url: "/x/" };
    await capturedHandlers.rejected({ response: { status: 401 }, config: cfg });

    expect(cfg.headers.Authorization).toBe("Bearer fresh-token");
    expect(localStorage.getItem("access")).toBe("fresh-token");
    expect(mockInstanceCall).toHaveBeenCalledWith(cfg);
  });

  it("redirects to login when no refresh token exists", async () => {
    const cfg = { headers: {}, url: "/y/" };
    await capturedHandlers.rejected({ response: { status: 401 }, config: cfg }).catch(() => {});

    expect(localStorage.getItem("access")).toBeNull();
    expect(window.location.href).toBe("/login");
  });

  it("clears storage and redirects when the refresh call itself fails", async () => {
    localStorage.setItem("access", "old");
    localStorage.setItem("refresh", "bad-refresh");
    mockPost.mockRejectedValueOnce(new Error("invalid refresh"));

    const cfg = { headers: {}, url: "/z/" };
    await capturedHandlers.rejected({ response: { status: 401 }, config: cfg }).catch(() => {});

    expect(localStorage.getItem("refresh")).toBeNull();
    expect(window.location.href).toBe("/login");
    expect(mockInstanceCall).not.toHaveBeenCalled();
  });

  it("rejects immediately on network error", async () => {
    await expect(
      capturedHandlers.rejected({ response: undefined })
    ).rejects.toEqual({ message: "Network error" });
  });

  it("does not retry a request already marked as retried", async () => {
    const cfg = { headers: {}, url: "/w/", _retry: true };
    await expect(
      capturedHandlers.rejected({ response: { status: 401 }, config: cfg })
    ).rejects.toBeTruthy();
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockInstanceCall).not.toHaveBeenCalled();
  });
});