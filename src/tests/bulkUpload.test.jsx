import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock("../services/api", () => ({
  default: { post: mockPost, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

import BulkUpload from "../pages/Officer/Vendors/BulkUpload";

function wrap() {
  return render(
    <MemoryRouter initialEntries={["/officer/vendors/bulk-upload"]}>
      <Routes>
        <Route path="/officer/vendors/bulk-upload" element={<BulkUpload />} />
        <Route path="/officer/vendors" element={<div>Vendors List</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function makeCsvFile(name = "vendors.csv", content = "name,contact_email,industry,country\nA,a@a.com,Tech,India") {
  return new File([content], name, { type: "text/csv" });
}

beforeEach(() => vi.clearAllMocks());

describe("BulkUpload", () => {
  it("renders heading", () => {
    wrap();
    expect(screen.getByText(/bulk vendor upload/i)).toBeInTheDocument();
  });

  it("upload button disabled until a file is chosen", () => {
    wrap();
    expect(screen.getByRole("button", { name: /upload csv/i })).toBeDisabled();
  });

  it("uploads csv and shows results summary", async () => {
    mockPost.mockResolvedValueOnce({
      data: { total_rows: 2, success_count: 2, failure_count: 0, error_summary: [], vendor_ids: ["v1", "v2"] },
    });
    wrap();
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [makeCsvFile()] } });
    fireEvent.click(screen.getByRole("button", { name: /upload csv/i }));

    await screen.findByText(/upload results/i);
    expect(mockPost).toHaveBeenCalledWith(
      "/vendors/bulk-upload/",
      expect.any(FormData),
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
  });

  it("shows validation errors for failed rows", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        total_rows: 1, success_count: 0, failure_count: 1,
        error_summary: [{ row: 2, error: "Invalid name", data: {} }], vendor_ids: [],
      },
    });
    wrap();
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [makeCsvFile()] } });
    fireEvent.click(screen.getByRole("button", { name: /upload csv/i }));

    await screen.findByText(/invalid name/i);
  });

  it("shows email confirmation modal when send_emails is checked and vendors are created", async () => {
    mockPost.mockResolvedValueOnce({
      data: { total_rows: 1, success_count: 1, failure_count: 0, error_summary: [], vendor_ids: ["v1"] },
    });
    wrap();
    fireEvent.click(screen.getByRole("checkbox"));
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [makeCsvFile()] } });
    fireEvent.click(screen.getByRole("button", { name: /upload csv/i }));

    await screen.findByText(/send document request emails\?/i);
  });

  it("handles upload failure gracefully without crashing", async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { error: "Server exploded" } } });
    wrap();
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [makeCsvFile()] } });
    fireEvent.click(screen.getByRole("button", { name: /upload csv/i }));

    await waitFor(() => expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument());
  });
});