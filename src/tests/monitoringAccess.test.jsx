import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../components/Monitoring/AIMonitoringPanel", () => ({
  default: () => <div>Monitoring Panel</div>,
}));

import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/Auth/ProtectedRoute";
import Sidebar from "../components/Layout/Sidebar";
import MonitoringPage from "../pages/Admin/MonitoringPage";

const authAs = (role) =>
  useAuth.mockReturnValue({
    isAuthenticated: true, loading: false, role, user: { role, must_change_password: false },
  });

beforeEach(() => vi.clearAllMocks());

describe("Monitoring sidebar item", () => {
  const renderSidebar = (role) =>
    render(
      <MemoryRouter>
        <Sidebar role={role} organizationName="Org" isOpen onClose={() => {}} />
      </MemoryRouter>
    );

  it("is shown to admins and links to /admin/monitoring", () => {
    renderSidebar("admin");
    expect(screen.getByRole("link", { name: /monitoring/i })).toHaveAttribute("href", "/admin/monitoring");
  });

  it.each(["officer", "viewer"])("is hidden from %s", (role) => {
    renderSidebar(role);
    expect(screen.queryByRole("link", { name: /monitoring/i })).not.toBeInTheDocument();
  });
});

describe("/admin/monitoring route", () => {
  const renderRoute = () =>
    render(
      <MemoryRouter initialEntries={["/admin/monitoring"]}>
        <Routes>
          <Route
            path="/admin"
            element={<ProtectedRoute allowedRoles={["admin"]}><Outlet /></ProtectedRoute>}
          >
            <Route path="monitoring" element={<MonitoringPage />} />
          </Route>
          <Route path="/officer/dashboard" element={<div>Officer Home</div>} />
          <Route path="/viewer/dashboard"  element={<div>Viewer Home</div>} />
        </Routes>
      </MemoryRouter>
    );

  it("renders the page for admins", () => {
    authAs("admin");
    renderRoute();
    expect(screen.getByRole("heading", { name: /ai monitoring/i })).toBeInTheDocument();
    expect(screen.getByText("Monitoring Panel")).toBeInTheDocument();
  });

  it("redirects officers to their dashboard", () => {
    authAs("officer");
    renderRoute();
    expect(screen.getByText("Officer Home")).toBeInTheDocument();
    expect(screen.queryByText("Monitoring Panel")).not.toBeInTheDocument();
  });

  it("redirects viewers to their dashboard", () => {
    authAs("viewer");
    renderRoute();
    expect(screen.getByText("Viewer Home")).toBeInTheDocument();
    expect(screen.queryByText("Monitoring Panel")).not.toBeInTheDocument();
  });

  it("is registered in App.jsx inside the admin-only route block", () => {
    const source = readFileSync(resolve(__dirname, "../App.jsx"), "utf-8");
    const route  = source.indexOf('path="monitoring"');
    const admin  = source.indexOf('allowedRoles={["admin"]}');
    const officer = source.indexOf('allowedRoles={["officer"]}');
    expect(route).toBeGreaterThan(admin);
    expect(route).toBeLessThan(officer);
    expect(source.match(/path="monitoring"/g)).toHaveLength(1);
  });
});
