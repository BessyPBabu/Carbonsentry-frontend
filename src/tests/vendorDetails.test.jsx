import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock("../services/api", () => ({
  default: { get: mockGet, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import VendorDetails from "../pages/Officer/Vendors/VendorDetails";

function renderPage(id = "v1") {
  return render(
    <MemoryRouter initialEntries={[`/officer/vendors/${id}`]}>
      <Routes>
        <Route path="/officer/vendors/:id" element={<VendorDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

const VENDOR = {
  id: "v1", name: "Acme Corp", industry: "Technology", country: "India",
  contact_email: "acme@acme.com", compliance_status: "compliant",
  risk_level: "low", last_updated: "2026-01-01T00:00:00Z",
};

beforeEach(() => vi.clearAllMocks());

describe("VendorDetails", () => {
  it("renders vendor name after load", async () => {
    mockGet.mockImplementation((url) => {
      if (url === "/vendors/v1/") return Promise.resolve({ data: VENDOR });
      if (url.includes("/documents/")) return Promise.resolve({ data: [] });
      return Promise.reject(new Error("no risk profile"));
    });
    renderPage();
    await screen.findByText("Acme Corp");
  });

  it("shows 'Vendor not found' and does not crash on fetch failure", async () => {
    mockGet.mockRejectedValue(new Error("network error"));
    renderPage();
    await screen.findByText(/vendor not found/i);
  });

  it("renders document rows", async () => {
    mockGet.mockImplementation((url) => {
      if (url === "/vendors/v1/") return Promise.resolve({ data: VENDOR });
      if (url.includes("/documents/")) return Promise.resolve({
        data: [{ id: "d1", document_type: "Emission Report", status: "valid", uploaded_at: "2026-01-01" }],
      });
      return Promise.reject(new Error("no risk profile"));
    });
    renderPage();
    await screen.findByText("Emission Report");
  });

  it("shows CO2 emissions when a risk profile has data", async () => {
    mockGet.mockImplementation((url) => {
      if (url === "/vendors/v1/") return Promise.resolve({ data: VENDOR });
      if (url.includes("/documents/")) return Promise.resolve({ data: [] });
      if (url.includes("risk-profiles")) return Promise.resolve({
        data: [{ id: "rp1", vendor_id: "v1", total_co2_emissions: "1500.00", risk_score: "60", exceeds_threshold: false }],
      });
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await screen.findByText(/1,500/);
  });

  it("shows the empty CO2 state when no risk profile exists", async () => {
    mockGet.mockImplementation((url) => {
      if (url === "/vendors/v1/") return Promise.resolve({ data: VENDOR });
      if (url.includes("/documents/")) return Promise.resolve({ data: [] });
      if (url.includes("risk-profiles")) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await screen.findByText(/no co₂ data extracted yet/i);
  });

  it("shows the exceeds-threshold badge when applicable", async () => {
    mockGet.mockImplementation((url) => {
      if (url === "/vendors/v1/") return Promise.resolve({ data: VENDOR });
      if (url.includes("/documents/")) return Promise.resolve({ data: [] });
      if (url.includes("risk-profiles")) return Promise.resolve({
        data: [{ id: "rp1", vendor_id: "v1", total_co2_emissions: "9000.00", risk_score: "80", exceeds_threshold: true }],
      });
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await screen.findByText(/exceeds threshold/i);
  });

  it("shows backend risk_level even when score would imply a different band", async () => {
    mockGet.mockImplementation((url) => {
      if (url === "/vendors/v1/") return Promise.resolve({ data: VENDOR });
      if (url.includes("/documents/")) return Promise.resolve({ data: [] });
      if (url.includes("risk-profiles")) return Promise.resolve({
        data: [{ id: "rp1", vendor_id: "v1", risk_level: "critical",
                 total_co2_emissions: "20000.00", risk_score: "35", exceeds_threshold: true }],
      });
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await screen.findByText(/critical/i);
  });
});