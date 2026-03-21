// src/tests/components.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Pagination     from "../components/Common/Pagination";
import Badge          from "../components/Common/Badge";
import Button         from "../components/Common/Button";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import ErrorBoundary  from "../components/Common/ErrorBoundary";

// ══════════════════════════════════════════════════════════════════════
// Pagination
// ══════════════════════════════════════════════════════════════════════
describe("Pagination", () => {
  it("renders nothing when totalPages is 1", () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when totalPages is 0", () => {
    const { container } = render(<Pagination currentPage={1} totalPages={0} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders page numbers for small count", () => {
    render(<Pagination currentPage={1} totalPages={4} onPageChange={vi.fn()} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("calls onPageChange with correct page number", () => {
    const fn = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={fn} />);
    fireEvent.click(screen.getByText("3"));
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("prev < button is disabled on first page", () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText("<")).toBeDisabled();
  });

  it("next > button is disabled on last page", () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText(">")).toBeDisabled();
  });

  it("clicking next calls onPageChange with activePage + 1", () => {
    const fn = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={fn} />);
    fireEvent.click(screen.getByText(">"));
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("clicking prev calls onPageChange with activePage - 1", () => {
    const fn = vi.fn();
    render(<Pagination currentPage={4} totalPages={5} onPageChange={fn} />);
    fireEvent.click(screen.getByText("<"));
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("shows ellipsis for large page counts", () => {
    render(<Pagination currentPage={5} totalPages={20} onPageChange={vi.fn()} />);
    expect(screen.getAllByText("…").length).toBeGreaterThanOrEqual(1);
  });

  it("accepts 'page' prop as alias for currentPage", () => {
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    // page 2 button should have active (green) styling
    const btn = screen.getByText("2");
    expect(btn.className).toContain("bg-[#1a8f70]");
  });

  it("does NOT call onPageChange when clicking active page", () => {
    const fn = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={fn} />);
    fireEvent.click(screen.getByText("3"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("always renders first and last page for large total", () => {
    render(<Pagination currentPage={10} totalPages={20} onPageChange={vi.fn()} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("active page button has green background class", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText("2").className).toContain("bg-[#1a8f70]");
  });

  it("inactive page button does NOT have green background", () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText("3").className).not.toContain("bg-[#1a8f70]");
  });
});

// ══════════════════════════════════════════════════════════════════════
// Badge
// ══════════════════════════════════════════════════════════════════════
describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Compliant</Badge>);
    expect(screen.getByText("Compliant")).toBeInTheDocument();
  });

  it("default variant renders without crashing", () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("success variant includes green class", () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild.className).toContain("green");
  });

  it("danger variant includes red class", () => {
    const { container } = render(<Badge variant="danger">Error</Badge>);
    expect(container.firstChild.className).toContain("red");
  });

  it("warning variant includes yellow class", () => {
    const { container } = render(<Badge variant="warning">Warn</Badge>);
    expect(container.firstChild.className).toContain("yellow");
  });

  it("sm size applies text-xs", () => {
    const { container } = render(<Badge size="sm">Tiny</Badge>);
    expect(container.firstChild.className).toContain("text-xs");
  });

  it("lg size applies text-base", () => {
    const { container } = render(<Badge size="lg">Big</Badge>);
    expect(container.firstChild.className).toContain("text-base");
  });
});

// ══════════════════════════════════════════════════════════════════════
// Button
// ══════════════════════════════════════════════════════════════════════
describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Go</Button>);
    fireEvent.click(screen.getByText("Go"));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClick when disabled", () => {
    const fn = vi.fn();
    render(<Button disabled onClick={fn}>No</Button>);
    fireEvent.click(screen.getByText("No"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("is disabled when disabled prop set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText("Disabled")).toBeDisabled();
  });

  it("primary variant has emerald class", () => {
    const { container } = render(<Button>Primary</Button>);
    expect(container.firstChild.className).toContain("emerald");
  });

  it("danger variant has red class", () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild.className).toContain("red");
  });

  it("defaults to type=button", () => {
    const { container } = render(<Button>Btn</Button>);
    expect(container.firstChild.type).toBe("button");
  });

  it("renders type=submit when specified", () => {
    const { container } = render(<Button type="submit">Submit</Button>);
    expect(container.firstChild.type).toBe("submit");
  });
});

// ══════════════════════════════════════════════════════════════════════
// LoadingSpinner
// ══════════════════════════════════════════════════════════════════════
describe("LoadingSpinner", () => {
  it("renders spin element", () => {
    render(<LoadingSpinner />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders optional text label", () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════
// ErrorBoundary
// ══════════════════════════════════════════════════════════════════════
describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(<ErrorBoundary><div>Normal content</div></ErrorBoundary>);
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Crash = () => { throw new Error("Test crash"); };
    render(<ErrorBoundary><Crash /></ErrorBoundary>);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
    spy.mockRestore();
  });
});