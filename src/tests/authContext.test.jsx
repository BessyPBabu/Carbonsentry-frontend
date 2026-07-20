import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock("../services/api", () => ({
  default: {
    get: mockGet,
    post: mockPost,
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

import { AuthProvider, useAuth } from "../context/AuthContext";

function Consumer() {
  const { isAuthenticated, role, organizationName, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="role">{role || ""}</span>
      <span data-testid="org">{organizationName || ""}</span>
      <button onClick={() => login("a@b.com", "pw")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function b64(obj) {
  return btoa(JSON.stringify(obj)).replace(/=+$/, "");
}
function makeJwt(payload) {
  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("AuthContext", () => {
  it("starts unauthenticated with no stored token", async () => {
    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("auth").textContent).toBe("false");
  });

  it("rehydrates session from a valid stored access token", async () => {
    const token = makeJwt({ role: "officer", exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem("access", token);
    mockGet.mockImplementation((url) => {
      if (url.includes("users/me")) return Promise.resolve({ data: { email: "o@t.com" } });
      if (url.includes("organizations/me")) return Promise.resolve({ data: { name: "Test Org" } });
      return Promise.resolve({ data: {} });
    });

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("true"));
    expect(screen.getByTestId("role").textContent).toBe("officer");
    expect(screen.getByTestId("org").textContent).toBe("Test Org");
  });

  it("clears storage when the stored access token is expired", async () => {
    const token = makeJwt({ role: "officer", exp: Math.floor(Date.now() / 1000) - 10 });
    localStorage.setItem("access", token);
    localStorage.setItem("refresh", "refresh-tok");

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("auth").textContent).toBe("false");
    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
  });

  it("clears storage when the stored token is malformed", async () => {
    localStorage.setItem("access", "not-a-jwt");
    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(localStorage.getItem("access")).toBeNull();
  });

  it("login stores tokens and updates state", async () => {
    mockPost.mockResolvedValueOnce({
      data: { access: "acc", refresh: "ref", role: "admin", must_change_password: false },
    });
    mockGet.mockImplementation((url) => {
      if (url.includes("users/me")) return Promise.resolve({ data: { email: "a@a.com" } });
      if (url.includes("organizations/me")) return Promise.resolve({ data: { name: "Admin Org" } });
      return Promise.resolve({ data: {} });
    });

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      screen.getByText("login").click();
    });

    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("true"));
    expect(localStorage.getItem("access")).toBe("acc");
    expect(localStorage.getItem("refresh")).toBe("ref");
    expect(screen.getByTestId("role").textContent).toBe("admin");
  });

  it("logout clears tokens and resets state", async () => {
    mockPost.mockResolvedValueOnce({
      data: { access: "acc", refresh: "ref", role: "admin", must_change_password: false },
    });
    mockGet.mockResolvedValue({ data: { name: "Org" } });

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => { screen.getByText("login").click(); });
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("true"));

    mockPost.mockResolvedValueOnce({});
    await act(async () => { screen.getByText("logout").click(); });

    expect(localStorage.getItem("access")).toBeNull();
    expect(screen.getByTestId("auth").textContent).toBe("false");
  });

  it("logout still clears local state when the server blacklist call fails", async () => {
    localStorage.setItem("access", makeJwt({ role: "officer", exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem("refresh", "ref");
    mockGet.mockResolvedValue({ data: { name: "Org" } });

    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("true"));

    mockPost.mockRejectedValueOnce(new Error("network down"));
    await act(async () => { screen.getByText("logout").click(); });

    expect(localStorage.getItem("access")).toBeNull();
    expect(screen.getByTestId("auth").textContent).toBe("false");
  });
});