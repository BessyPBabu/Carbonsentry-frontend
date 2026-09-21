import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock("../services/api", () => ({
  default: { get: mockGet, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ role: "officer" }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import VendorsList from "../pages/Officer/Vendors/VendorsList";

function wrap() {
  return render(
    <MemoryRouter initialEntries={["/officer/vendors"]}>
      <Routes><Route path="/officer/vendors" element={<VendorsList />} /></Routes>
    </MemoryRouter>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("VendorsList risk level consistency", () => {
  it("badges vendor with backend risk_level, ignoring score quartiles", async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes("industries")) return Promise.resolve({ data: [] });
      if (url.includes("risk-profiles")) return Promise.resolve({
        data: [{ id: "rp1", vendor: "v1", risk_level: "critical", risk_score: "30.00" }],
      });
      if (url.includes("/vendors/")) return Promise.resolve({
        data: { count: 1, results: [{
          id: "v1", name: "Consistency Corp", industry: "Energy", country: "India",
          compliance_status: "non_compliant", risk_level: "critical",
        }] },
      });
      return Promise.resolve({ data: { results: [] } });
    });
    
    wrap();
    await screen.findByText("Consistency Corp");
    expect(screen.getByText("critical")).toBeInTheDocument();
  });
});