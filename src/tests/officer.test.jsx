// src/tests/officer.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet:    vi.fn(),
  mockPost:   vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("../services/api", () => ({
  default: {
    get:    mockGet,
    post:   mockPost,
    delete: mockDelete,
    patch:  vi.fn(),
    put:    vi.fn(),
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
vi.mock("../services/auditLogService", () => ({
  default: {
    getLogs:          vi.fn(),
    getActionChoices: vi.fn(),
    exportCsv:        vi.fn(),
  },
}));
vi.mock("../services/validationService", () => ({
  validationService: {
    triggerValidation: vi.fn(),
    getStatistics:     vi.fn(),
  },
}));

import { useAuth }      from "../context/AuthContext";
import { toast }        from "react-toastify";
import auditLogService  from "../services/auditLogService";
import OfficerDashboard from "../pages/Officer/Dashboard";
import VendorsList      from "../pages/Officer/Vendors/VendorsList";
import AddVendor        from "../pages/Officer/Vendors/AddVendor";
import DocumentsList    from "../pages/Officer/Documents/DocumentsList";
import AuditLogsPage    from "../pages/Officer/AuditLogs/AuditLogsPage";

beforeEach(() => vi.clearAllMocks());

const mockOfficer = () =>
  useAuth.mockReturnValue({
    user: { email: "officer@test.com", role: "officer", full_name: "Officer" },
    role: "officer",
    organizationName: "Test Org",
  });

function wrap(element) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="*" element={element} />
        <Route path="/officer/vendors"         element={<div>Vendors List</div>} />
        <Route path="/officer/ai-review-queue" element={<div>AI Queue</div>} />
        <Route path="/officer/risk-analysis"   element={<div>Risk Analysis</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function mockVendorsListCalls({ industries = [], vendors = { results: [], count: 0 } } = {}) {
  mockGet.mockImplementation((url) => {
    if (url.includes("industries"))  return Promise.resolve({ data: industries });
    if (url.includes("/vendors/"))   return Promise.resolve({ data: vendors });
    return Promise.resolve({ data: { results: [], count: 0 } });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// OfficerDashboard
// ══════════════════════════════════════════════════════════════════════════════
describe("OfficerDashboard", () => {
  beforeEach(() => {
    mockOfficer();
    mockGet.mockResolvedValue({ data: { results: [], count: 0 } });
  });

  it("renders Compliance Dashboard heading", async () => {
    wrap(<OfficerDashboard />);
    await screen.findByText(/compliance dashboard/i);
  });

  it("shows 4 stat cards", async () => {
    wrap(<OfficerDashboard />);
    await screen.findByText(/total vendors/i);
    expect(screen.getByText(/pending uploads/i)).toBeInTheDocument();
    expect(screen.getByText(/ai validation running/i)).toBeInTheDocument();
    expect(screen.getAllByText(/review queue/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows AI Review Queue section", async () => {
    wrap(<OfficerDashboard />);
    await screen.findByText(/ai review queue/i);
  });

  it("shows High-Risk Vendors section", async () => {
    wrap(<OfficerDashboard />);
    await screen.findByRole("heading", { name: /high-risk vendors/i });
  });

  it("shows 'No items pending review' when queue empty", async () => {
    wrap(<OfficerDashboard />);
    await screen.findByText(/no items pending review/i);
  });

  it("shows 'No high-risk vendors' when none exist", async () => {
    wrap(<OfficerDashboard />);
    await screen.findByText(/no high-risk vendors/i);
  });

  it("renders vendor name from populated review queue", async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes("manual-reviews"))
        return Promise.resolve({
          data: { results: [
            { id: "r1", validation: { vendor_name: "Risky Corp" }, reason: "low_confidence", priority: "high" },
          ]},
        });
      return Promise.resolve({ data: { results: [] } });
    });
    wrap(<OfficerDashboard />);
    await screen.findByText("Risky Corp");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// VendorsList
// ══════════════════════════════════════════════════════════════════════════════
describe("VendorsList", () => {
  beforeEach(() => mockOfficer());

  it("renders Vendors heading", async () => {
    mockVendorsListCalls();
    wrap(<VendorsList />);
    await screen.findByText(/^vendors$/i);
  });

  it("shows + Add Vendor button for officer", async () => {
    mockVendorsListCalls();
    wrap(<VendorsList />);
    await screen.findByRole("button", { name: /\+ add vendor/i });
  });

  it("shows Bulk Upload CSV button for officer", async () => {
    mockVendorsListCalls();
    wrap(<VendorsList />);
    await screen.findByRole("button", { name: /bulk upload csv/i });
  });

  it("shows empty state when no vendors", async () => {
    mockVendorsListCalls();
    wrap(<VendorsList />);
    await screen.findByText(/no vendors found/i);
  });

  it("renders vendor rows", async () => {
    mockVendorsListCalls({
      vendors: {
        count: 2,
        results: [
          { id: "v1", name: "Acme Corp", industry: "Tech", country: "India",
            compliance_status: "compliant", risk_level: "low" },
          { id: "v2", name: "Beta Ltd",  industry: "Mfg",  country: "US",
            compliance_status: "pending",   risk_level: "medium" },
        ],
      },
    });
    wrap(<VendorsList />);
    await screen.findByText("Acme Corp");
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
  });

  it("renders View Details link for each vendor", async () => {
    mockVendorsListCalls({
      vendors: {
        count: 1,
        results: [
          { id: "v1", name: "X Corp", industry: "T", country: "IN",
            compliance_status: "compliant", risk_level: "low" },
        ],
      },
    });
    wrap(<VendorsList />);
    await screen.findByText("View Details");
  });

  it("calls api with search param when filter changes", async () => {
    mockVendorsListCalls();
    wrap(<VendorsList />);
    await screen.findByPlaceholderText(/search vendors/i);

    fireEvent.change(screen.getByPlaceholderText(/search vendors/i), {
      target: { value: "Acme" },
    });

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        "/vendors/",
        expect.objectContaining({
          params: expect.objectContaining({ search: "Acme" }),
        })
      )
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AddVendor
// ══════════════════════════════════════════════════════════════════════════════
describe("AddVendor", () => {
  beforeEach(() => {
    mockOfficer();
    mockGet.mockResolvedValueOnce({
      data: [{ id: "i1", name: "Technology" }, { id: "i2", name: "Manufacturing" }],
    });
  });

  it("renders heading", async () => {
    wrap(<AddVendor />);
    await screen.findByText(/add vendor/i);
  });

  it("loads industries from API", async () => {
    wrap(<AddVendor />);
    await screen.findByText("Technology");
    expect(screen.getByText("Manufacturing")).toBeInTheDocument();
  });

  it("shows email confirmation modal after vendor created", async () => {
    mockPost.mockResolvedValueOnce({ data: { id: "nv" } });
    wrap(<AddVendor />);
    await screen.findByText("Technology");

    document.querySelectorAll("input").forEach((inp) => {
      if (inp.name === "name")          fireEvent.change(inp, { target: { value: "Test Vendor" } });
      if (inp.name === "country")       fireEvent.change(inp, { target: { value: "India" } });
      if (inp.name === "contact_email") fireEvent.change(inp, { target: { value: "t@t.com" } });
    });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "i1" } });
    fireEvent.click(screen.getByRole("button", { name: /save vendor/i }));

    await screen.findByText(/send document request email/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DocumentsList
// ══════════════════════════════════════════════════════════════════════════════
describe("DocumentsList", () => {
  beforeEach(() => mockOfficer());

  it("renders Documents heading", async () => {
    mockGet.mockResolvedValue({ data: { results: [], count: 0 } });
    wrap(<DocumentsList />);
    await screen.findByText(/^documents$/i);
  });

  it("shows empty state when no documents", async () => {
    mockGet.mockResolvedValue({ data: { results: [], count: 0 } });
    wrap(<DocumentsList />);
    await screen.findByText(/no documents found/i);
  });

  it("renders document rows", async () => {
    mockGet
      .mockResolvedValueOnce({ data: [{ id: "v1", name: "Vendor A" }] })
      .mockResolvedValueOnce({
        data: {
          count: 1,
          results: [{
            id: "d1",
            vendor_name:   "Vendor A",
            document_type: "Emission Report",
            status:        "uploaded",
            upload_attempts: 1,
          }],
        },
      });
    wrap(<DocumentsList />);
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Vendor A")).toBeInTheDocument();
    expect(within(table).getByText("Emission Report")).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AuditLogsPage
// ══════════════════════════════════════════════════════════════════════════════
describe("AuditLogsPage", () => {
  beforeEach(() => {
    mockOfficer();
    auditLogService.getLogs.mockResolvedValue({ count: 0, results: [] });
    auditLogService.getActionChoices.mockResolvedValue([
      { value: "vendor_created",    label: "Vendor Created" },
      { value: "document_uploaded", label: "Document Uploaded" },
    ]);
  });

  it("renders Audit Logs heading", async () => {
    wrap(<AuditLogsPage />);
    await screen.findByRole("heading", { name: /^audit logs$/i });
  });

  it("renders Export CSV button", async () => {
    wrap(<AuditLogsPage />);
    await screen.findByRole("button", { name: /export csv/i });
  });

  it("renders action choices in the filter dropdown", async () => {
    wrap(<AuditLogsPage />);
    await screen.findByText("Vendor Created");
    expect(screen.getByText("Document Uploaded")).toBeInTheDocument();
  });

  it("shows empty state when no logs", async () => {
    wrap(<AuditLogsPage />);
    await screen.findByText(/no audit logs found/i);
  });

  it("renders log row data when logs exist", async () => {
    auditLogService.getLogs.mockResolvedValueOnce({
      count: 1,
      results: [{
        id:          "log1",
        action:      "vendor_created",
        entity_type: "Vendor",
        entity_id:   "abc-123",
        actor_name:  "Admin User",
        actor_email: "admin@test.com",
        details:     {},
        ip_address:  "127.0.0.1",
        created_at:  new Date().toISOString(),
      }],
    });
    wrap(<AuditLogsPage />);
    await screen.findByText("Admin User");
    expect(screen.getByText("admin@test.com")).toBeInTheDocument();
  });

  it("resets to page 1 when action filter changes", async () => {
    wrap(<AuditLogsPage />);
    await screen.findByRole("combobox");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "vendor_created" } });
    await waitFor(() =>
      expect(auditLogService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ action: "vendor_created", page: 1 })
      )
    );
  });

  it("calls exportCsv when Export CSV clicked", async () => {
    wrap(<AuditLogsPage />);
    await screen.findByRole("button", { name: /export csv/i });
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    expect(auditLogService.exportCsv).toHaveBeenCalled();
  });
});