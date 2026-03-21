// src/tests/services_utils.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Axios mock — the api service module creates an axios instance
// We mock the axios module itself so all created instances share our fns
vi.mock("axios", () => {
  const inst = {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };
  const mock = { ...inst, create: vi.fn(() => inst), default: undefined };
  mock.default = mock;
  return { default: mock };
});

import axios from "axios";
const inst = axios.create(); // returns the shared mock instance

import {
  formatDate, formatDateTime, formatTime, formatDay,
  formatNumber, formatPercentage, formatRiskScore, safeFloat, formatLargeNumber,
} from "../utils/formatters";
import communicationService from "../services/communicationService";
import reportService        from "../services/reportService";
import auditLogService      from "../services/auditLogService";
import { riskService }      from "../services/riskService";
import { validationService } from "../services/validationService";

beforeEach(() => vi.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════
// formatters
// ══════════════════════════════════════════════════════════════════════
describe("formatDate", () => {
  it("returns '—' for null",           () => expect(formatDate(null)).toBe("—"));
  it("returns '—' for undefined",       () => expect(formatDate(undefined)).toBe("—"));
  it("returns '—' for empty string",    () => expect(formatDate("")).toBe("—"));
  it("returns '—' for invalid date",    () => expect(formatDate("not-a-date")).toBe("—"));
  it("formats a valid ISO date string", () => {
    const result = formatDate("2024-06-15");
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/Jun|06/);
  });
});

describe("formatDateTime", () => {
  it("returns '—' for null",       () => expect(formatDateTime(null)).toBe("—"));
  it("returns '—' for invalid",     () => expect(formatDateTime("bad")).toBe("—"));
  it("includes year for valid ISO", () => expect(formatDateTime("2024-06-15T10:30:00Z")).toMatch(/2024/));
});

describe("formatTime", () => {
  it("returns '' for null",    () => expect(formatTime(null)).toBe(""));
  it("returns '' for invalid", () => expect(formatTime("bad")).toBe(""));
  it("returns HH:MM for valid ISO", () => expect(formatTime("2024-06-15T14:05:00Z")).toMatch(/\d{2}:\d{2}/));
});

describe("formatDay", () => {
  it("returns '' for null",        () => expect(formatDay(null)).toBe(""));
  it("returns '' for invalid",      () => expect(formatDay("xyz")).toBe(""));
  it("returns readable day string", () => {
    const r = formatDay("2024-06-15");
    expect(r).toMatch(/Jun/);
    expect(r).toMatch(/2024/);
  });
});

describe("formatNumber", () => {
  it("returns '—' for null",       () => expect(formatNumber(null)).toBe("—"));
  it("returns '—' for NaN string", () => expect(formatNumber("bad")).toBe("—"));
  it("formats to 0 decimals",       () => expect(formatNumber(3.14)).toBe("3"));
  it("formats to 2 decimals",       () => expect(formatNumber(3.1, 2)).toBe("3.10"));
});

describe("formatPercentage", () => {
  it("returns '—' for null",    () => expect(formatPercentage(null)).toBe("—"));
  it("appends % for number",     () => expect(formatPercentage(75)).toBe("75%"));
});

describe("formatRiskScore", () => {
  it("returns 'N/A' for null",      () => expect(formatRiskScore(null)).toBe("N/A"));
  it("returns 'N/A' for undefined", () => expect(formatRiskScore(undefined)).toBe("N/A"));
  it("divides by divisor 20",        () => expect(formatRiskScore(80)).toBe("4.0"));
  it("uses custom divisor",          () => expect(formatRiskScore(50, 10)).toBe("5.0"));
});

describe("safeFloat", () => {
  it("returns 0 for null",            () => expect(safeFloat(null)).toBe(0));
  it("returns 0 for undefined",        () => expect(safeFloat(undefined)).toBe(0));
  it("returns 0 for empty string",     () => expect(safeFloat("")).toBe(0));
  it("returns custom fallback for NaN",() => expect(safeFloat("bad", -1)).toBe(-1));
  it("parses valid numeric string",    () => expect(safeFloat("3.14")).toBeCloseTo(3.14));
  it("returns number as-is",           () => expect(safeFloat(42)).toBe(42));
});

// ══════════════════════════════════════════════════════════════════════
// communicationService
// ══════════════════════════════════════════════════════════════════════
describe("communicationService.getChatList", () => {
  it("returns results from paginated response", async () => {
    inst.get.mockResolvedValueOnce({ data: { count: 1, results: [{ vendor_id: "v1" }] } });
    expect(await communicationService.getChatList()).toEqual([{ vendor_id: "v1" }]);
  });

  it("returns direct array", async () => {
    inst.get.mockResolvedValueOnce({ data: [{ vendor_id: "v2" }] });
    expect(await communicationService.getChatList()).toEqual([{ vendor_id: "v2" }]);
  });

  it("returns empty array when empty", async () => {
    inst.get.mockResolvedValueOnce({ data: { count: 0, results: [] } });
    expect(await communicationService.getChatList()).toEqual([]);
  });
});

describe("communicationService.verifyOtp", () => {
  it("posts token and otp_code to public endpoint", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    const r = await communicationService.verifyOtp("my-tok", "123456");
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("verify-otp"),
      { token: "my-tok", otp_code: "123456" }
    );
    expect(r.success).toBe(true);
  });
});

describe("communicationService.sendMessage", () => {
  it("returns false when ws is null",   () => expect(communicationService.sendMessage(null, "hi")).toBe(false));
  it("returns false when socket closed", () => expect(communicationService.sendMessage({ readyState: 3, send: vi.fn() }, "hi")).toBe(false));
  it("sends JSON and returns true when open", () => {
    const ws = { readyState: 1, send: vi.fn() };
    expect(communicationService.sendMessage(ws, "Hello", "vendor_message")).toBe(true);
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ content: "Hello", message_type: "vendor_message" })
    );
  });
});

describe("communicationService.openOfficerSocket", () => {
  afterEach(() => localStorage.clear());

  it("returns null when no JWT",    () => expect(communicationService.openOfficerSocket("v1", {})).toBeNull());
  it("creates WebSocket with JWT",  () => {
    localStorage.setItem("access", "test-jwt");
    const ws = communicationService.openOfficerSocket("v-uuid", {});
    expect(ws).not.toBeNull();
    expect(ws.url).toContain("v-uuid");
    expect(ws.url).toContain("token=test-jwt");
  });
});

// ══════════════════════════════════════════════════════════════════════
// reportService
// ══════════════════════════════════════════════════════════════════════
describe("reportService.getReports", () => {
  it("returns results array from paginated response", async () => {
    inst.get.mockResolvedValueOnce({ data: { count: 1, results: [{ id: "r1" }] } });
    expect(await reportService.getReports({})).toEqual([{ id: "r1" }]);
  });

  it("passes report_type and status as params", async () => {
    inst.get.mockResolvedValueOnce({ data: { results: [] } });
    await reportService.getReports({ report_type: "vendor_risk", status: "approved" });
    expect(inst.get).toHaveBeenCalledWith("/reports/", {
      params: expect.objectContaining({ report_type: "vendor_risk", status: "approved" }),
    });
  });
});

describe("reportService.generateReport", () => {
  it("posts payload and returns report", async () => {
    inst.post.mockResolvedValueOnce({ data: { id: "r2", status: "generated" } });
    const r = await reportService.generateReport({ report_type: "compliance_summary", title: "T" });
    expect(r.status).toBe("generated");
  });
});

describe("reportService.approveReport", () => {
  it("patches correct endpoint with notes", async () => {
    inst.patch.mockResolvedValueOnce({ data: { id: "r1", status: "approved" } });
    await reportService.approveReport("r1", "LGTM");
    expect(inst.patch).toHaveBeenCalledWith(
      "/reports/r1/approve/",
      { approval_notes: "LGTM" }
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// auditLogService
// ══════════════════════════════════════════════════════════════════════
describe("auditLogService.getLogs", () => {
  it("maps camelCase filters to snake_case params", async () => {
    inst.get.mockResolvedValueOnce({ data: { count: 0, results: [] } });
    await auditLogService.getLogs({ action: "vendor_created", dateFrom: "2024-01-01", page: 2 });
    expect(inst.get).toHaveBeenCalledWith("/audit_logs/", {
      params: expect.objectContaining({ action: "vendor_created", date_from: "2024-01-01", page: 2 }),
    });
  });

  it("omits empty filter values", async () => {
    inst.get.mockResolvedValueOnce({ data: { count: 0, results: [] } });
    await auditLogService.getLogs({ action: "" });
    const params = inst.get.mock.calls[0][1].params;
    expect(Object.keys(params)).not.toContain("action");
  });
});

// ══════════════════════════════════════════════════════════════════════
// riskService
// ══════════════════════════════════════════════════════════════════════
describe("riskService.getAllRiskProfiles", () => {
  it("returns results from paginated response", async () => {
    inst.get.mockResolvedValueOnce({ data: { results: [{ id: "p1" }] } });
    expect(await riskService.getAllRiskProfiles()).toEqual([{ id: "p1" }]);
  });
});

describe("riskService.getVendorRiskProfile", () => {
  it("returns first result for vendor", async () => {
    inst.get.mockResolvedValueOnce({ data: { results: [{ id: "p1", vendor_id: "v1" }] } });
    const r = await riskService.getVendorRiskProfile("v1");
    expect(r.vendor_id).toBe("v1");
  });

  it("returns null when no profiles", async () => {
    inst.get.mockResolvedValueOnce({ data: { results: [] } });
    expect(await riskService.getVendorRiskProfile("v-x")).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════
// validationService
// ══════════════════════════════════════════════════════════════════════
describe("validationService.triggerValidation", () => {
  it("posts document_id to trigger endpoint", async () => {
    inst.post.mockResolvedValueOnce({ data: { status: "ok" } });
    await validationService.triggerValidation("doc-uuid");
    expect(inst.post).toHaveBeenCalledWith(
      "/ai-validation/validations/trigger_validation/",
      { document_id: "doc-uuid" }
    );
  });
});

describe("validationService.resolveReview", () => {
  it("posts decision and notes", async () => {
    inst.post.mockResolvedValueOnce({ data: {} });
    await validationService.resolveReview("rv1", "approved", "OK");
    expect(inst.post).toHaveBeenCalledWith(
      "/ai-validation/manual-reviews/rv1/resolve/",
      { decision: "approved", notes: "OK" }
    );
  });
});