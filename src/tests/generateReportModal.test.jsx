import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock("../services/api", () => ({
  default: { get: mockGet, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("../services/reportService", () => ({
  default: { generateReport: vi.fn() },
}));

import reportService from "../services/reportService";
import GenerateReportModal from "../components/Reports/GenerateReportModal";

function getReportTypeSelect() {
  return document.querySelectorAll("select")[0];
}

function getGenerateButton() {
  return screen.getByRole("button", { name: /^generate report$/i });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue({ data: [{ id: "v1", name: "Acme Corp" }] });
});

describe("GenerateReportModal", () => {
  it("renders report type options", () => {
    render(<GenerateReportModal onClose={vi.fn()} onGenerated={vi.fn()} />);
    expect(screen.getByText(/vendor risk report/i)).toBeInTheDocument();
  });

  it("loads and shows vendor options for vendor-required report types", async () => {
    render(<GenerateReportModal onClose={vi.fn()} onGenerated={vi.fn()} />);
    await screen.findByText("Acme Corp");
  });

  it("hides vendor selector for compliance_summary", async () => {
    render(<GenerateReportModal onClose={vi.fn()} onGenerated={vi.fn()} />);
    fireEvent.change(getReportTypeSelect(), { target: { value: "compliance_summary" } });
    await waitFor(() => expect(screen.queryByText(/select a vendor/i)).not.toBeInTheDocument());
  });

  it("shows validation error when vendor is missing for vendor_risk", async () => {
    render(<GenerateReportModal onClose={vi.fn()} onGenerated={vi.fn()} />);
    await screen.findByText("Acme Corp");
    fireEvent.click(getGenerateButton());
    await screen.findByText(/please select a vendor/i);
  });

  it("shows error when date_from is after date_to", async () => {
    render(<GenerateReportModal onClose={vi.fn()} onGenerated={vi.fn()} />);
    fireEvent.change(getReportTypeSelect(), { target: { value: "compliance_summary" } });
    const [fromInput, toInput] = document.querySelectorAll('input[type="date"]');
    fireEvent.change(fromInput, { target: { value: "2026-02-01" } });
    fireEvent.change(toInput, { target: { value: "2026-01-01" } });
    fireEvent.click(getGenerateButton());
    await screen.findByText(/cannot be after/i);
  });

  it("calls reportService.generateReport with the correct payload", async () => {
    reportService.generateReport.mockResolvedValueOnce({ id: "r1", title: "Compliance Summary" });
    const onGenerated = vi.fn();
    render(<GenerateReportModal onClose={vi.fn()} onGenerated={onGenerated} />);
    fireEvent.change(getReportTypeSelect(), { target: { value: "compliance_summary" } });
    fireEvent.click(getGenerateButton());

    await waitFor(() =>
      expect(reportService.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({ report_type: "compliance_summary" })
      )
    );
    expect(onGenerated).toHaveBeenCalledWith({ id: "r1", title: "Compliance Summary" });
  });

  it("shows server error message on generation failure", async () => {
    reportService.generateReport.mockRejectedValueOnce({
      response: { data: { error: "Generation blew up" } },
    });
    render(<GenerateReportModal onClose={vi.fn()} onGenerated={vi.fn()} />);
    fireEvent.change(getReportTypeSelect(), { target: { value: "compliance_summary" } });
    fireEvent.click(getGenerateButton());
    await screen.findByText(/generation blew up/i);
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<GenerateReportModal onClose={onClose} onGenerated={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalled();
  });
});