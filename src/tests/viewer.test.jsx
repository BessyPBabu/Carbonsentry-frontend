// src/tests/viewer.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// vi.hoisted() REQUIRED — vi.mock factories run before const declarations
const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet:  vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock("../services/api", () => ({
  default: {
    get:    mockGet,
    post:   mockPost,
    patch:  vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../context/ThemeContext", () => ({
  useTheme:      () => ({ theme: "light", toggleTheme: vi.fn() }),
  ThemeProvider: ({ children }) => children,
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { useAuth }       from "../context/AuthContext";
import ViewerDashboard   from "../pages/Viewer/Dashboard";

beforeEach(() => vi.clearAllMocks());

const mockViewer = () =>
  useAuth.mockReturnValue({
    user:             { email: "viewer@test.com", role: "viewer", full_name: "Viewer" },
    role:             "viewer",
    organizationName: "Test Org",
  });

function wrap(element) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ViewerDashboard
// ══════════════════════════════════════════════════════════════════════
describe("ViewerDashboard", () => {
  beforeEach(() => {
    mockViewer();
    mockGet.mockResolvedValue({ data: { results: [], count: 0 } });
  });

  it("renders Viewer Dashboard heading", async () => {
    wrap(<ViewerDashboard />);
    await screen.findByText(/viewer dashboard/i);
  });

  it("renders 4 stat cards", async () => {
    wrap(<ViewerDashboard />);
    await screen.findByText(/total vendors/i);
    expect(screen.getByText(/uploaded documents/i)).toBeInTheDocument();
    expect(screen.getByText(/pending documents/i)).toBeInTheDocument();
    expect(screen.getByText(/high-risk vendors/i)).toBeInTheDocument();
  });

  it("renders AI System Health section", async () => {
    wrap(<ViewerDashboard />);
    await screen.findByText(/ai system health/i);
  });

  it("renders Reports section", async () => {
    wrap(<ViewerDashboard />);
    await screen.findByText(/^reports$/i);
  });

  it("shows correct vendor count from API", async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes("/vendors/"))
        return Promise.resolve({ data: { results: [
          { id: "v1", name: "A" }, { id: "v2", name: "B" }, { id: "v3", name: "C" },
        ]}});
      return Promise.resolve({ data: { results: [] } });
    });
    wrap(<ViewerDashboard />);
    // total vendors should show 3
    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());
  });

  it("reports counts come from API not hardcoded 0", async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes("/reports/"))
        return Promise.resolve({ data: { results: [
          { id: "r1", status: "approved" },
          { id: "r2", status: "generated" },
        ]}});
      return Promise.resolve({ data: { results: [] } });
    });
    wrap(<ViewerDashboard />);
    await screen.findByText(/ai system health/i);
    // "1" appears for approved reports (generated count = pending approvals)
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("shows flagged documents count in AI Health section", async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes("documents"))
        return Promise.resolve({ data: { results: [
          { id: "d1", status: "flagged",  vendor_id: "v1" },
          { id: "d2", status: "valid",    vendor_id: "v1" },
        ]}});
      return Promise.resolve({ data: { results: [] } });
    });
    wrap(<ViewerDashboard />);
    await screen.findByText(/flagged for review/i);
  });

  it("handles API failure gracefully without crashing", async () => {
    mockGet.mockRejectedValue(new Error("network error"));
    wrap(<ViewerDashboard />);
    // should show dashboard with zeros, not crash
    await screen.findByText(/viewer dashboard/i);
  });

  it("shows read-only compliance overview subtitle", async () => {
    wrap(<ViewerDashboard />);
    await screen.findByText(/read-only compliance overview/i);
  });
});