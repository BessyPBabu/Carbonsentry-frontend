// src/tests/admin.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockGet, mockPost, mockPut, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet:    vi.fn(),
  mockPost:   vi.fn(),
  mockPut:    vi.fn(),
  mockPatch:  vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("../services/api", () => ({
  default: {
    get:    mockGet,
    post:   mockPost,
    put:    mockPut,
    patch:  mockPatch,
    delete: mockDelete,
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

import { useAuth } from "../context/AuthContext";
import { toast }   from "react-toastify";
import AdminDashboard from "../pages/Admin/Dashboard";
import UserManagement from "../pages/Admin/UserManagement";
import AddUser        from "../pages/Admin/AddUser";
import EditUser       from "../pages/Admin/EditUser";
import Settings       from "../pages/Admin/Settings";

beforeEach(() => vi.clearAllMocks());

const mockAdmin = () =>
  useAuth.mockReturnValue({
    user: { email: "admin@test.com", role: "admin", full_name: "Admin" },
    role: "admin",
    organizationName: "Test Org",
  });

function wrap(element) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="*" element={element} />
        <Route path="/admin/user-management" element={<div>User Management</div>} />
        <Route path="/login"                 element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ══════════════════════════════════════════════════════════════════════
// AdminDashboard
// ══════════════════════════════════════════════════════════════════════
describe("AdminDashboard", () => {
  beforeEach(() => {
    mockAdmin();
    mockGet.mockResolvedValue({ data: { results: [], count: 0, metrics: null, grafana_url: null } });
  });

  it("renders Admin Dashboard heading", async () => {
    wrap(<AdminDashboard />);
    await screen.findByText(/admin dashboard/i);
  });

  it("shows 4 stat cards", async () => {
    wrap(<AdminDashboard />);
    await screen.findByText(/total vendors/i);
    expect(screen.getByText(/compliant vendors/i)).toBeInTheDocument();
    expect(screen.getByText(/pending documents/i)).toBeInTheDocument();
    expect(screen.getByText(/high-risk vendors/i)).toBeInTheDocument();
  });

  it("calls monitoring endpoint on mount", async () => {
    wrap(<AdminDashboard />);
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("monitoring"))
    );
  });

  it("shows Risk Summary panel", async () => {
    wrap(<AdminDashboard />);
    await screen.findByText(/risk summary/i);
  });
});

// ══════════════════════════════════════════════════════════════════════
// UserManagement
// ══════════════════════════════════════════════════════════════════════
describe("UserManagement", () => {
  beforeEach(() => mockAdmin());

  it("renders heading", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [] } });
    wrap(<UserManagement />);
    await screen.findByText(/user management/i);
  });

  it("renders + Add User button", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [] } });
    wrap(<UserManagement />);
    await screen.findByRole("button", { name: /\+ add user/i });
  });

  it("shows 'No users found' for empty list", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [] } });
    wrap(<UserManagement />);
    await screen.findByText(/no users found/i);
  });

  it("renders user rows", async () => {
    mockGet.mockResolvedValueOnce({
      data: { results: [
        { id: "u1", full_name: "Alice", email: "a@t.com", role: "officer", status: "active"   },
        { id: "u2", full_name: "Bob",   email: "b@t.com", role: "viewer",  status: "inactive" },
      ]},
    });
    wrap(<UserManagement />);
    await screen.findByText("Alice");
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("calls api with search param", async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });
    wrap(<UserManagement />);
    await screen.findByRole("button", { name: /^search$/i });
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), { target: { value: "alice" } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        "/accounts/users/",
        expect.objectContaining({ params: expect.objectContaining({ search: "alice" }) })
      )
    );
  });

  it("calls api.delete and refetches after delete confirm", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    mockGet.mockResolvedValue({ data: { results: [
      { id: "u1", full_name: "Alice", email: "a@t.com", role: "officer", status: "active" },
    ]}});
    mockDelete.mockResolvedValueOnce({});
    wrap(<UserManagement />);
    await screen.findByText("Delete");
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining("u1")));
  });

  it("does NOT delete when confirm cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    mockGet.mockResolvedValue({ data: { results: [
      { id: "u1", full_name: "Alice", email: "a@t.com", role: "officer", status: "active" },
    ]}});
    wrap(<UserManagement />);
    await screen.findByText("Delete");
    fireEvent.click(screen.getByText("Delete"));
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════
// AddUser
// ══════════════════════════════════════════════════════════════════════
describe("AddUser", () => {
  beforeEach(() => mockAdmin());

  it("renders all fields", () => {
    wrap(<AddUser />);
    expect(screen.getByPlaceholderText(/enter full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/user@company\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/leave empty to auto-generate/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("role dropdown has officer and viewer but NOT admin", () => {
    wrap(<AddUser />);
    const opts = Array.from(screen.getByRole("combobox").options).map((o) => o.value);
    expect(opts).toContain("officer");
    expect(opts).toContain("viewer");
    expect(opts).not.toContain("admin");
  });

  it("calls api.post with correct payload", async () => {
    mockPost.mockResolvedValueOnce({ data: { id: "x" } });
    wrap(<AddUser />);
    fireEvent.change(screen.getByPlaceholderText(/enter full name/i),          { target: { value: "New Officer" } });
    fireEvent.change(screen.getByPlaceholderText(/user@company\.com/i),        { target: { value: "off@org.com" } });
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "/accounts/users/add/",
        expect.objectContaining({ full_name: "New Officer", email: "off@org.com" })
      )
    );
  });

  it("does NOT include password key when field is empty", async () => {
    mockPost.mockResolvedValueOnce({ data: { id: "x" } });
    wrap(<AddUser />);
    fireEvent.change(screen.getByPlaceholderText(/enter full name/i), { target: { value: "X" } });
    fireEvent.change(screen.getByPlaceholderText(/user@company\.com/i), { target: { value: "x@x.com" } });
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));
    await waitFor(() => {
      const payload = mockPost.mock.calls[0][1];
      expect(payload).not.toHaveProperty("password");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// EditUser
// ══════════════════════════════════════════════════════════════════════
describe("EditUser", () => {
  beforeEach(() => mockAdmin());

  function renderEdit(id = "u1") {
    return render(
      <MemoryRouter initialEntries={[`/admin/user-management/edit/${id}`]}>
        <Routes>
          <Route path="/admin/user-management/edit/:id" element={<EditUser />} />
          <Route path="/admin/user-management"           element={<div>User Management</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("pre-fills full_name from API", async () => {
    mockGet.mockResolvedValueOnce({ data: { id: "u1", full_name: "Alice", email: "a@t.com", role: "officer", is_active: true } });
    renderEdit();
    await screen.findByDisplayValue("Alice");
  });

  it("email field is disabled", async () => {
    mockGet.mockResolvedValueOnce({ data: { id: "u1", full_name: "A", email: "a@t.com", role: "officer", is_active: true } });
    renderEdit();
    await screen.findByDisplayValue("a@t.com");
    expect(screen.getByDisplayValue("a@t.com")).toBeDisabled();
  });

  it("calls api.patch on submit", async () => {
    mockGet.mockResolvedValueOnce({ data: { id: "u1", full_name: "Alice", email: "a@t.com", role: "officer", is_active: true } });
    mockPatch.mockResolvedValueOnce({});
    renderEdit();
    await screen.findByDisplayValue("Alice");
    fireEvent.click(screen.getByRole("button", { name: /update user/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        expect.stringContaining("/accounts/users/u1/"),
        expect.objectContaining({ full_name: "Alice", is_active: expect.any(Boolean) })
      )
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// Settings
// ══════════════════════════════════════════════════════════════════════
describe("Settings", () => {
  beforeEach(() => {
    mockAdmin();
    mockGet.mockResolvedValueOnce({
      data: { name: "Test Corp", industry: "Technology", country: "India", primary_email: "admin@testcorp.com" },
    });
  });

  it("pre-fills organization name", async () => {
    wrap(<Settings />);
    await screen.findByDisplayValue("Test Corp");
  });

  it("primary_email is disabled", async () => {
    wrap(<Settings />);
    await screen.findByDisplayValue("admin@testcorp.com");
    expect(screen.getByDisplayValue("admin@testcorp.com")).toBeDisabled();
  });

  it("calls api.put with correct payload on save", async () => {
    mockPut.mockResolvedValueOnce({ data: {} });
    wrap(<Settings />);
    await screen.findByRole("button", { name: /save changes/i });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(mockPut).toHaveBeenCalledWith(
        "/accounts/organizations/me/",
        expect.objectContaining({ name: "Test Corp" })
      )
    );
  });

  it("does NOT include primary_email in PUT payload", async () => {
    mockPut.mockResolvedValueOnce({ data: {} });
    wrap(<Settings />);
    await screen.findByRole("button", { name: /save changes/i });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      const payload = mockPut.mock.calls[0][1];
      expect(payload).not.toHaveProperty("primary_email");
    });
  });

  it("renders Export Compliance Data button", async () => {
    wrap(<Settings />);
    await screen.findByRole("button", { name: /export compliance data/i });
  });

  it("renders Security & Access section", async () => {
    wrap(<Settings />);
    await screen.findByText(/security.*access/i);
  });
});