// src/tests/auth.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── vi.hoisted: variables declared here are available inside vi.mock factories ──
// This is REQUIRED because vi.mock() is hoisted to the top of the file by Vitest.
// Plain `const mockFn = vi.fn()` runs AFTER the factory, putting the variable
// in the temporal dead zone when the factory executes → ReferenceError.
const { mockApiPost, mockApiGet, mockLogin, mockLogout, mockLoadUser } = vi.hoisted(() => ({
  mockApiPost:  vi.fn(),
  mockApiGet:   vi.fn(),
  mockLogin:    vi.fn(),
  mockLogout:   vi.fn(),
  mockLoadUser: vi.fn(),
}));

vi.mock("../services/api", () => ({
  default: {
    get:  mockApiGet,
    post: mockApiPost,
    put:  vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth:      vi.fn(),
  AuthProvider: ({ children }) => children,
}));

vi.mock("../context/ThemeContext", () => ({
  useTheme:      () => ({ theme: "light", toggleTheme: vi.fn() }),
  ThemeProvider: ({ children }) => children,
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { useAuth } from "../context/AuthContext";
import { toast }   from "react-toastify";
import Login               from "../pages/Auth/Login";
import Register            from "../pages/Auth/Register";
import ForgotPassword      from "../pages/Auth/ForgotPassword";
import ResetPassword       from "../pages/Auth/ResetPassword";
import ForceChangePassword from "../pages/Auth/ForceChangePassword";
import ProtectedRoute      from "../components/Auth/ProtectedRoute";
import VerifyEmail         from "../pages/Auth/VerifyEmail";
import VerifyEmailSent     from "../pages/Auth/VerifyEmailSent";

beforeEach(() => vi.clearAllMocks());

function wrap(element) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="*"                      element={element} />
        <Route path="/login"                 element={<div>Login Page</div>} />
        <Route path="/admin/dashboard"       element={<div>Admin Dashboard</div>} />
        <Route path="/officer/dashboard"     element={<div>Officer Dashboard</div>} />
        <Route path="/viewer/dashboard"      element={<div>Viewer Dashboard</div>} />
        <Route path="/force-change-password" element={<div>Force Change Password</div>} />
        <Route path="/verify-email-sent"     element={<div>Verify Email Sent</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Login
// ══════════════════════════════════════════════════════════════════════
describe("Login page", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ login: mockLogin, loading: false });
  });

  it("renders email and password fields", () => {
    wrap(<Login />);
    expect(screen.getByPlaceholderText(/email@company\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
  });

  it("renders Login button", () => {
    wrap(<Login />);
    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
  });

  it("shows loading screen while auth is initialising", () => {
    useAuth.mockReturnValue({ login: mockLogin, loading: true });
    wrap(<Login />);
    expect(screen.getByText(/preparing login/i)).toBeInTheDocument();
  });

  it("does NOT call login when fields are empty", () => {
    wrap(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows error toast when fields are empty", () => {
    wrap(<Login />);
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    expect(toast.error).toHaveBeenCalledWith("Email and password are required");
  });

  it("calls login() with correct credentials", async () => {
    mockLogin.mockResolvedValueOnce({ role: "admin", must_change_password: false });
    wrap(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/email@company\.com/i), { target: { value: "admin@test.com" } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("admin@test.com", "pass123"));
  });

  it("shows 'Logging in…' while submitting", async () => {
    mockLogin.mockReturnValue(new Promise(() => {}));
    wrap(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/email@company\.com/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    await screen.findByText(/logging in/i);
  });

  it("redirects admin to /admin/dashboard", async () => {
    mockLogin.mockResolvedValueOnce({ role: "admin", must_change_password: false });
    wrap(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/email@company\.com/i), { target: { value: "a@t.com" } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    await screen.findByText(/admin dashboard/i);
  });

  it("redirects to /force-change-password when must_change_password is true", async () => {
    mockLogin.mockResolvedValueOnce({ role: "officer", must_change_password: true });
    wrap(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/email@company\.com/i), { target: { value: "n@t.com" } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    await screen.findByText(/force change password/i);
  });

  it("shows unverified org error on 403", async () => {
    mockLogin.mockRejectedValueOnce({
      response: { status: 403, data: { error: "Organization not verified" } },
    });
    wrap(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/email@company\.com/i), { target: { value: "u@u.com" } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: "pw" } });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("verify your organization"), expect.any(Object)
    ));
  });

  it("shows invalid credentials error on 401", async () => {
    mockLogin.mockRejectedValueOnce({ response: { status: 401 } });
    wrap(<Login />);
    fireEvent.change(screen.getByPlaceholderText(/email@company\.com/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Invalid email or password"));
  });

  it("has Forgot password link", () => {
    wrap(<Login />);
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it("has Register here link", () => {
    wrap(<Login />);
    expect(screen.getByText(/register here/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════
// Register
// ══════════════════════════════════════════════════════════════════════
describe("Register page", () => {
  it("renders 5 input fields", () => {
    wrap(<Register />);
    expect(screen.getByPlaceholderText(/your company name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/manufacturing/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/united states/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your\.email@company/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/create a strong password/i)).toBeInTheDocument();
  });

  it("renders Create Organization button", () => {
    wrap(<Register />);
    expect(screen.getByRole("button", { name: /create organization/i })).toBeInTheDocument();
  });

  it("calls api.post with lowercased email", async () => {
    mockApiPost.mockResolvedValueOnce({ data: { email: "admin@acme.com" } });
    wrap(<Register />);
    fireEvent.change(screen.getByPlaceholderText(/your company name/i),   { target: { value: "Acme" } });
    fireEvent.change(screen.getByPlaceholderText(/manufacturing/i),        { target: { value: "Tech" } });
    fireEvent.change(screen.getByPlaceholderText(/united states/i),        { target: { value: "India" } });
    fireEvent.change(screen.getByPlaceholderText(/your\.email@company/i),  { target: { value: "ADMIN@ACME.COM" } });
    fireEvent.change(screen.getByPlaceholderText(/create a strong password/i), { target: { value: "Str0ng@Pass" } });
    fireEvent.click(screen.getByRole("button", { name: /create organization/i }));
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining("register"),
        expect.objectContaining({ admin_email: "admin@acme.com" })
      )
    );
  });

  it("rejects password < 8 chars without calling api", () => {
    wrap(<Register />);
    fireEvent.change(screen.getByPlaceholderText(/create a strong password/i), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /create organization/i }));
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("has Login here link", () => {
    wrap(<Register />);
    expect(screen.getByText(/login here/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════
// ForgotPassword
// ══════════════════════════════════════════════════════════════════════
describe("ForgotPassword page", () => {
  it("renders email field and Send Reset Link button", () => {
    wrap(<ForgotPassword />);
    expect(screen.getByPlaceholderText(/you@company/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("calls api.post with lowercased email", async () => {
    mockApiPost.mockResolvedValueOnce({});
    wrap(<ForgotPassword />);
    fireEvent.change(screen.getByPlaceholderText(/you@company/i), { target: { value: "USER@TEST.COM" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining("forgot"),
        expect.objectContaining({ email: "user@test.com" })
      )
    );
  });

  it("shows success message on both success AND error (no info leak)", async () => {
    mockApiPost.mockRejectedValueOnce({ response: { status: 404 } });
    wrap(<ForgotPassword />);
    fireEvent.change(screen.getByPlaceholderText(/you@company/i), { target: { value: "ghost@x.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await screen.findByText(/if the email exists/i);
  });

  it("has Back to Login link", () => {
    wrap(<ForgotPassword />);
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════
// ForceChangePassword
// ══════════════════════════════════════════════════════════════════════
describe("ForceChangePassword page", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user:     { email: "user@test.com", role: "officer" },
      logout:   mockLogout,
      loadUser: mockLoadUser.mockResolvedValue({}),
    });
  });

  it("renders 3 password fields", () => {
    wrap(<ForceChangePassword />);
    expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/create a strong password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/re-enter/i)).toBeInTheDocument();
  });

  it("shows error when passwords don't match — no api call", () => {
    wrap(<ForceChangePassword />);
    fireEvent.change(screen.getByPlaceholderText(/current password/i),          { target: { value: "Old@1234" } });
    fireEvent.change(screen.getByPlaceholderText(/create a strong password/i),  { target: { value: "New@1234" } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter/i),                  { target: { value: "Diff@1234" } });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("calls api.post with current and new password", async () => {
    mockApiPost.mockResolvedValueOnce({ data: {} });
    wrap(<ForceChangePassword />);
    fireEvent.change(screen.getByPlaceholderText(/current password/i),          { target: { value: "Old@Pass1!" } });
    fireEvent.change(screen.getByPlaceholderText(/create a strong password/i),  { target: { value: "New@Str0ng!" } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter/i),                  { target: { value: "New@Str0ng!" } });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        expect.stringContaining("password/change"),
        expect.objectContaining({ current_password: "Old@Pass1!", new_password: "New@Str0ng!" })
      )
    );
  });

  it("shows password requirements list", () => {
    wrap(<ForceChangePassword />);
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("calls logout on Cancel & Logout click", () => {
    wrap(<ForceChangePassword />);
    fireEvent.click(screen.getByRole("button", { name: /cancel.*logout/i }));
    expect(mockLogout).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════
// ProtectedRoute
// ══════════════════════════════════════════════════════════════════════
describe("ProtectedRoute", () => {
  function renderRoute({ isAuthenticated, role, loading = false, allowedRoles = null, mustChange = false }) {
    useAuth.mockReturnValue({
      isAuthenticated, role, loading,
      user: { must_change_password: mustChange },
    });
    return render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/protected" element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          } />
          <Route path="/login"                 element={<div>Login Page</div>} />
          <Route path="/admin/dashboard"       element={<div>Admin Dashboard</div>} />
          <Route path="/officer/dashboard"     element={<div>Officer Dashboard</div>} />
          <Route path="/viewer/dashboard"      element={<div>Viewer Dashboard</div>} />
          <Route path="/force-change-password" element={<div>Force Change Password</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("shows loading indicator", () => {
    renderRoute({ isAuthenticated: false, role: null, loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("redirects unauthenticated to /login", () => {
    renderRoute({ isAuthenticated: false, role: null });
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it("renders children when role is allowed", () => {
    renderRoute({ isAuthenticated: true, role: "admin", allowedRoles: ["admin"] });
    expect(screen.getByText(/protected content/i)).toBeInTheDocument();
  });

  it("redirects admin to dashboard when role not in allowedRoles", () => {
    renderRoute({ isAuthenticated: true, role: "admin", allowedRoles: ["officer"] });
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
  });

  it("redirects officer with must_change_password to force-change", () => {
    renderRoute({ isAuthenticated: true, role: "officer", allowedRoles: ["officer"], mustChange: true });
    expect(screen.getByText(/force change password/i)).toBeInTheDocument();
  });

  it("does NOT redirect admin with must_change_password", () => {
    renderRoute({ isAuthenticated: true, role: "admin", allowedRoles: ["admin"], mustChange: true });
    expect(screen.getByText(/protected content/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════
// VerifyEmail
// ══════════════════════════════════════════════════════════════════════
describe("VerifyEmail page", () => {
  function renderVerify(token = "valid-tok") {
    return render(
      <MemoryRouter initialEntries={[`/verify-email/${token}`]}>
        <Routes>
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/login"               element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("shows spinner while verifying", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    renderVerify();
    expect(screen.getByText(/verifying email/i)).toBeInTheDocument();
  });

  it("shows success state on valid token", async () => {
    mockApiGet.mockResolvedValueOnce({ data: { message: "OK", organization_name: "Acme" } });
    renderVerify();
    await screen.findByText(/email verified/i);
    expect(screen.getByText(/acme/i)).toBeInTheDocument();
  });

  it("shows error state on invalid token", async () => {
    mockApiGet.mockRejectedValueOnce({ response: { status: 400, data: { error: "Token expired" } } });
    renderVerify("bad");
    await screen.findByText(/verification failed/i);
  });
});

// ══════════════════════════════════════════════════════════════════════
// VerifyEmailSent
// ══════════════════════════════════════════════════════════════════════
describe("VerifyEmailSent page", () => {
  it("shows email from router state", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/verify-email-sent", state: { email: "user@corp.com" } }]}>
        <Routes>
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/user@corp\.com/i)).toBeInTheDocument();
  });

  it("falls back to 'your email' with no state", () => {
    render(
      <MemoryRouter initialEntries={["/verify-email-sent"]}>
        <Routes>
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/your email/i)).toBeInTheDocument();
  });
});