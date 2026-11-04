import { describe, it, expect } from "vitest";
import { text, num, fmtNum, scoreLabel, list, resolveRecommendations } from "../utils/reportFormatters";

describe("reportFormatters", () => {
  it("text returns the fallback only for null, undefined and blank strings", () => {
    expect(text(null)).toBe("—");
    expect(text(undefined)).toBe("—");
    expect(text("  ")).toBe("—");
    expect(text(0)).toBe("0");
    expect(text("High")).toBe("High");
    expect(text(null, null)).toBeNull();
  });

  it("num keeps a real 0 and falls back for null, blank and non-numeric", () => {
    expect(num(0)).toBe(0);
    expect(num("0")).toBe(0);
    expect(num(null)).toBe(0);
    expect(num("")).toBe(0);
    expect(num("abc", 5)).toBe(5);
    expect(num(null, null)).toBeNull();
  });

  it("fmtNum formats with en-US grouping and keeps 0", () => {
    expect(fmtNum(5267925)).toBe("5,267,925");
    expect(fmtNum(0)).toBe("0");
    expect(fmtNum(null)).toBe("—");
  });

  it("scoreLabel shows N/A for null and 0.0 / 100 for a real 0", () => {
    expect(scoreLabel(null)).toBe("N/A");
    expect(scoreLabel(undefined)).toBe("N/A");
    expect(scoreLabel(0)).toBe("0.0 / 100");
    expect(scoreLabel("55.5")).toBe("55.5 / 100");
  });

  it("list always returns an array", () => {
    expect(list(null)).toEqual([]);
    expect(list("x")).toEqual([]);
    expect(list([1])).toEqual([1]);
  });

  it("resolveRecommendations prefers recommendations, then action_checklist actions", () => {
    expect(resolveRecommendations({ recommendations: ["a"], action_checklist: [{ action: "b" }] })).toEqual(["a"]);
    expect(resolveRecommendations({ action_checklist: [{ action: "b" }, { action: " " }, null, { owner: "x" }] })).toEqual(["b"]);
    expect(resolveRecommendations({ recommendations: [], action_checklist: [{ action: "b" }] })).toEqual(["b"]);
  });

  it("resolveRecommendations never throws on malformed input", () => {
    [null, undefined, "x", [], {}, { recommendations: "bad", action_checklist: "bad" }]
      .forEach((d) => expect(resolveRecommendations(d)).toEqual([]));
  });
});
