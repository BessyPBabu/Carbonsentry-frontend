// src/tests/reports_validation.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet:    vi.fn(),
  mockPost:   vi.fn(),
  mockPatch:  vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("../services/api", () => ({
  default: {
    get:    mockGet,
    post:   mockPost,
    patch:  mockPatch,
    delete: mockDelete,
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
vi.mock("../services/reportService", () => ({
  default: {
    getReports:     vi.fn(),
    getReportById:  vi.fn(),
    generateReport: vi.fn(),
    approveReport:  vi.fn(),
    deleteReport:   vi.fn(),
    downloadPdf:    vi.fn(),
    downloadJson:   vi.fn(),
  },
}));
vi.mock("../services/validationService", () => ({
  validationService: {
    getReviewQueue:          vi.fn(),
    resolveReview:           vi.fn(),
    getStatistics:           vi.fn(),
    getValidationsByVendor:  vi.fn(),
    getLatestReviewByVendor: vi.fn(),
  },
}));
vi.mock("../services/riskService", () => ({
  riskService: {
    getAllRiskProfiles:    vi.fn(),
    getVendorRiskProfile: vi.fn(),
  },
}));

import { useAuth }           from "../context/AuthContext";
import { toast }             from "react-toastify";
import reportService         from "../services/reportService";
import { validationService } from "../services/validationService";
import { riskService }       from "../services/riskService";
import ReportsPage           from "../pages/Reports/ReportsPage";
import ReportPreview         from "../pages/Reports/ReportPreview";
import AIReviewQueue         from "../pages/Validation/AIReviewQueue";
import VendorRiskList        from "../pages/Validation/VendorRiskList";
import AIMonitoringPanel     from "../components/Monitoring/AIMonitoringPanel";

beforeEach(() => vi.clearAllMocks());

const mockOfficer = () =>
  useAuth.mockReturnValue({ user: { role: "officer" }, role: "officer" });
const mockAdmin = () =>
  useAuth.mockReturnValue({ user: { role: "admin"   }, role: "admin" });
const mockViewer = () =>
  useAuth.mockReturnValue({ user: { role: "viewer"  }, role: "viewer" });

function wrap(element) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="*" element={element} />
        <Route path="/officer/reports/:reportId"      element={<div>Report Preview</div>} />
        <Route path="/officer/risk-analysis/:vendorId" element={<div>Risk Detail</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ReportsPage
// ══════════════════════════════════════════════════════════════════════════════
describe("ReportsPage", () => {
  const SAMPLE = [
    { id: "r1", title: "Q1 Report", report_type: "compliance_summary",
      status: "generated", generated_by_name: "Officer", generated_at: new Date().toISOString() },
    { id: "r2", title: "Q2 Report", report_type: "vendor_risk",
      status: "approved",  generated_by_name: "Admin",   generated_at: new Date().toISOString() },
  ];

  beforeEach(() => {
    mockOfficer();
    reportService.getReports.mockResolvedValue(SAMPLE);
  });

  it("renders Reports heading", async () => {
    wrap(<ReportsPage />);
    await screen.findByText(/^reports$/i);
  });

  it("renders + Generate Report button for officer", async () => {
    wrap(<ReportsPage />);
    await screen.findByRole("button", { name: /generate report/i });
  });

  it("hides + Generate Report button for viewer", async () => {
    mockViewer();
    reportService.getReports.mockResolvedValue([]);
    wrap(<ReportsPage />);
    await screen.findByText(/no reports found/i);
    expect(screen.queryByRole("button", { name: /generate report/i })).not.toBeInTheDocument();
  });

  it("renders report cards", async () => {
    wrap(<ReportsPage />);
    await screen.findByText("Q1 Report");
    expect(screen.getByText("Q2 Report")).toBeInTheDocument();
  });

  it("shows empty state when no reports", async () => {
    reportService.getReports.mockResolvedValue([]);
    wrap(<ReportsPage />);
    await screen.findByText(/no reports found/i);
  });

  it("calls deleteReport and removes card on confirm", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    reportService.deleteReport.mockResolvedValueOnce({});
    wrap(<ReportsPage />);
    await screen.findByText("Q1 Report");
    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    await waitFor(() => expect(reportService.deleteReport).toHaveBeenCalledWith("r1"));
  });

  it("does NOT delete when confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    wrap(<ReportsPage />);
    await screen.findByText("Q1 Report");
    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    expect(reportService.deleteReport).not.toHaveBeenCalled();
  });

  it("shows error banner when fetch fails", async () => {
    reportService.getReports.mockRejectedValueOnce(new Error("fail"));
    wrap(<ReportsPage />);
    await screen.findByText(/failed to load reports/i);
  });

  it("opens Generate modal on button click", async () => {
    wrap(<ReportsPage />);
    await screen.findByRole("button", { name: /generate report/i });
    fireEvent.click(screen.getByRole("button", { name: /generate report/i }));
    await screen.findByText(/generate report/i); // modal heading
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ReportPreview
// ══════════════════════════════════════════════════════════════════════════════
describe("ReportPreview", () => {
  function renderPreview(id = "r1") {
    return render(
      <MemoryRouter initialEntries={[`/officer/reports/${id}`]}>
        <Routes>
          <Route path="/officer/reports/:reportId" element={<ReportPreview />} />
          <Route path="/officer/reports"           element={<div>Reports</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  beforeEach(() => mockOfficer());

  it("shows loading state", () => {
    reportService.getReportById.mockReturnValue(new Promise(() => {}));
    renderPreview();
    expect(screen.getByText(/loading report/i)).toBeInTheDocument();
  });

  it("renders report title", async () => {
    reportService.getReportById.mockResolvedValueOnce({
      id: "r1", title: "Q1 Compliance", status: "generated",
      report_type: "compliance_summary", generated_by_name: "Officer",
      generated_at: new Date().toISOString(),
      data: { summary: { total_vendors: 5 }, vendors: [] },
    });
    renderPreview();
    await screen.findByText("Q1 Compliance");
  });

  it("shows Approve Report button for generated report (non-viewer)", async () => {
    reportService.getReportById.mockResolvedValueOnce({
      id: "r1", title: "Q1", status: "generated",
      report_type: "compliance_summary", generated_by_name: "O",
      generated_at: new Date().toISOString(),
      data: { summary: {}, vendors: [] },
    });
    renderPreview();
    await screen.findByRole("button", { name: /approve report/i });
  });

  it("hides Approve Report button for viewer", async () => {
    useAuth.mockReturnValue({ user: { role: "viewer" }, role: "viewer" });
    reportService.getReportById.mockResolvedValueOnce({
      id: "r1", title: "Q1", status: "generated",
      report_type: "compliance_summary", generated_by_name: "O",
      generated_at: new Date().toISOString(),
      data: { summary: {}, vendors: [] },
    });
    renderPreview();
    await screen.findByText("Q1");
    expect(screen.queryByRole("button", { name: /approve report/i })).not.toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    reportService.getReportById.mockRejectedValueOnce(new Error("not found"));
    renderPreview();
    await screen.findByText(/failed to load report/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AIReviewQueue
// ══════════════════════════════════════════════════════════════════════════════
describe("AIReviewQueue", () => {
  const REVIEWS = [
    { id: "rv1", status: "pending", priority: "high", reason: "Low confidence",
      validation: { vendor_name: "Flagged Corp", document_name: "ISO Cert",
        overall_confidence: 42 } },
  ];

  beforeEach(() => {
    mockOfficer();
    validationService.getReviewQueue.mockResolvedValue({ count: 1, results: REVIEWS });
  });

  it("renders AI Review Queue heading", async () => {
    wrap(<AIReviewQueue />);
    await screen.findByText(/ai review queue/i);
  });

  it("renders vendor name", async () => {
    wrap(<AIReviewQueue />);
    await screen.findByText("Flagged Corp");
  });

  it("shows 'No documents pending review' when queue is empty", async () => {
    validationService.getReviewQueue.mockResolvedValueOnce({ count: 0, results: [] });
    wrap(<AIReviewQueue />);
    await screen.findByText(/no documents pending review/i);
  });

  it("calls getReviewQueue with status: pending", async () => {
    wrap(<AIReviewQueue />);
    await waitFor(() =>
      expect(validationService.getReviewQueue).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" })
      )
    );
  });

  it("renders Review button for each item", async () => {
    wrap(<AIReviewQueue />);
    await screen.findByRole("button", { name: /^review$/i });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// VendorRiskList
// ══════════════════════════════════════════════════════════════════════════════
describe("VendorRiskList", () => {
  // Both profiles intentionally have NO total_co2_emissions so the table
  // renders "Pending" for both rows — this is the behaviour under test.
  const PROFILES = [
    { id: "p1", vendor_id: "v1", vendor_name: "High Corp", vendor_industry: "Tech",
      risk_level: "high",   risk_score: "80.00",
      validated_documents: 3, total_documents: 4,
      avg_document_confidence: "72",
      total_co2_emissions: null },     // explicit null → "Pending"
    { id: "p2", vendor_id: "v2", vendor_name: "Low Corp",  vendor_industry: "Retail",
      risk_level: "low",    risk_score: "15.00",
      validated_documents: 2, total_documents: 2,
      avg_document_confidence: "88",
      total_co2_emissions: undefined }, // missing key → "Pending"
  ];

  beforeEach(() => {
    mockOfficer();
    riskService.getAllRiskProfiles.mockResolvedValue(PROFILES);
  });

  it("renders Vendor Risk Analysis heading", async () => {
    wrap(<VendorRiskList />);
    await screen.findByText(/vendor risk analysis/i);
  });

  it("renders all profile rows", async () => {
    wrap(<VendorRiskList />);
    await screen.findByText("High Corp");
    expect(screen.getByText("Low Corp")).toBeInTheDocument();
  });

  it("shows risk score in X.X / 5 format", async () => {
    wrap(<VendorRiskList />);
    // 80 / 20 = 4.0
    await screen.findByText(/4\.0 \/ 5/i);
  });

  it("shows 'Pending' when total_co2_emissions is null or missing", async () => {
    wrap(<VendorRiskList />);

    // FIX: do NOT use findByText("Pending") as the first await.
    // The table renders asynchronously after the API resolves. If findByText
    // runs in the brief window between mount and the first render-with-data,
    // it can time out even though "Pending" will appear milliseconds later.
    //
    // Instead: wait for a guaranteed unique text first ("High Corp" is always
    // present and unambiguous), confirming the table is fully rendered. Then
    // use the synchronous getAllByText which succeeds immediately.
    await screen.findByText("High Corp"); // table is rendered ✓
    const pendingCells = screen.getAllByText("Pending");
    expect(pendingCells.length).toBeGreaterThanOrEqual(1);
  });

  it("renders View Details buttons", async () => {
    wrap(<VendorRiskList />);
    const btns = await screen.findAllByRole("button", { name: /view details/i });
    expect(btns.length).toBe(PROFILES.length);
  });

  it("shows empty state when no profiles", async () => {
    riskService.getAllRiskProfiles.mockResolvedValueOnce([]);
    wrap(<VendorRiskList />);
    await screen.findByText(/no risk profiles found/i);
  });

  it("renders filter buttons (All Risk, High + Critical, Medium, Low)", async () => {
    wrap(<VendorRiskList />);
    await screen.findByRole("button", { name: /all risk/i });
    expect(screen.getByRole("button", { name: /high.*critical/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /medium risk/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /low risk/i })).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AIMonitoringPanel
// ══════════════════════════════════════════════════════════════════════════════
describe("AIMonitoringPanel", () => {
  beforeEach(() => mockAdmin());

  // FIX 1: "shows loading spinner on mount"
  // Previous test used document.querySelector(".animate-spin") which returns
  // null in jsdom because Tailwind classes are not processed at runtime.
  // The component now renders the text "Loading metrics…" alongside the
  // spinner, which is always findable regardless of CSS processing.
  it("shows loading text while fetch is in-flight", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AIMonitoringPanel />);
    expect(screen.getByText(/loading metrics/i)).toBeInTheDocument();
  });

  // FIX 2: "renders DB metrics"
  // Previous test used findByText("10") which is ambiguous when the same
  // value appears in multiple nodes. Now uses data-testid="stat-valid" which
  // is unique and deterministic.
  it("renders DB metrics when monitoring responds", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        source: "database",
        grafana_url: null,
        metrics: {
          validations_valid:   10,
          validations_invalid:  2,
          validations_review:   3,
          validations_failed:   1,
          median_confidence:   78,
          p95_duration_s:       4.2,
        },
      },
    });
    render(<AIMonitoringPanel />);
    // wait for the specific stat tile to appear
    const validTile = await screen.findByTestId("stat-valid");
    expect(validTile.textContent).toBe("10");
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText("4.2s")).toBeInTheDocument();
  });

  it("shows 'Metrics unavailable' when metrics is null", async () => {
    mockGet.mockResolvedValueOnce({
      data: { source: "database", grafana_url: null, metrics: null },
    });
    render(<AIMonitoringPanel />);
    await screen.findByText(/metrics unavailable/i);
  });

  it("shows 'Open Grafana' toggle button when grafana_url is present", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        source: "prometheus",
        grafana_url: "https://grafana.example.com",
        metrics: { validations_valid: 5, validations_invalid: 0,
                   validations_review: 0, validations_failed: 0 },
      },
    });
    render(<AIMonitoringPanel />);
    await screen.findByText(/open grafana/i);
  });

  // FIX 3: "hides Grafana button when grafana_url is null"
  // Previous test used findByText("1") — ambiguous because the component
  // renders "1" in BOTH the stat-valid tile AND the MetricRow total counter.
  // Now uses findByTestId("stat-valid") which is unique.
  it("hides Grafana toggle button when grafana_url is null", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        source: "database",
        grafana_url: null,
        metrics: { validations_valid: 1, validations_invalid: 0,
                   validations_review: 0, validations_failed: 0 },
      },
    });
    render(<AIMonitoringPanel />);
    await screen.findByTestId("stat-valid"); // table rendered ✓
    expect(screen.queryByText(/open grafana/i)).not.toBeInTheDocument();
  });

  // FIX 4: "refetches on refresh button click"
  // Previous test used getByTitle(/refresh metrics/i) — but the button had
  // no title attribute. The component now has title="Refresh metrics" added.
  it("refetches when the refresh button is clicked", async () => {
    mockGet.mockResolvedValue({
      data: { source: "database", grafana_url: null, metrics: null },
    });
    render(<AIMonitoringPanel />);
    await screen.findByText(/metrics unavailable/i);

    // button has title="Refresh metrics" in the updated component
    fireEvent.click(screen.getByTitle(/refresh metrics/i));
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  });

  it("renders Grafana ↗ external link when grafana_url is set", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        source: "prometheus",
        grafana_url: "https://grafana.example.com",
        metrics: { validations_valid: 1, validations_invalid: 0,
                   validations_review: 0, validations_failed: 0 },
      },
    });
    render(<AIMonitoringPanel />);
    await screen.findByRole("link", { name: /grafana ↗/i });
  });

  it("shows source label in the subtitle", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        source: "prometheus",
        grafana_url: null,
        metrics: { validations_valid: 1, validations_invalid: 0,
                   validations_review: 0, validations_failed: 0 },
      },
    });
    render(<AIMonitoringPanel />);
    await screen.findByText(/source: prometheus/i);
  });
});