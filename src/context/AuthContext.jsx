import { createContext, useContext, useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

const AuthContext = createContext(null);

const BROADCAST_CHANNEL = "carbonsentry_auth";

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole]                       = useState(null);
  const [user, setUser]                       = useState(null);
  const [organizationName, setOrganizationName] = useState(null);
  const [loading, setLoading]                 = useState(true);

  const channelRef = useRef(null);

  // clears tokens AND react state — used for explicit logout
  const _clearAll = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    _resetState();
  };

  // resets only react state — used when another tab logs in/out
  // we must NOT touch localStorage here because the new session's
  // tokens belong to the other tab and are still needed
  const _resetState = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    setOrganizationName(null);
  };

  // cross-tab session sync via BroadcastChannel
  // supported in all modern browsers (Chrome, Firefox, Safari 15.4+)
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === "NEW_LOGIN") {
        // another tab just started a new session — only reset this tab's
        // UI state so it shows the login screen; do NOT clear localStorage
        // because the new tokens there belong to the other tab's session
        _resetState();
      }

      if (event.data?.type === "LOGOUT") {
        // another tab explicitly logged out — mirror that here
        // tokens are already cleared in the tab that initiated logout,
        // so we just sync the UI state in this tab
        _resetState();
      }
    };

    return () => channel.close();
  }, []);

  const loadUser = async () => {
    const res = await api.get("accounts/users/me/");
    setUser(res.data);
    return res.data;
  };

  const loadOrganization = async () => {
    const res = await api.get("accounts/organizations/me/");
    setOrganizationName(res.data.name);
    return res.data;
  };

  // on first mount: restore session from localStorage if a valid token is present
  useEffect(() => {
    const init = async () => {
      const access = localStorage.getItem("access");

      if (!access) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(access);

        if (decoded.exp * 1000 < Date.now()) {
          // token expired — wipe and show login
          _clearAll();
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setRole(decoded.role);
        await loadUser();
        if (decoded.role === "admin") await loadOrganization();
      } catch (err) {
        // token invalid or API unreachable — clear and let user log in again
        console.error("AuthContext.init:", err);
        _clearAll();
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await api.post("accounts/auth/login/", {
      email: email.toLowerCase(),
      password,
    });

    const { access, refresh, role, must_change_password } = res.data;

    // store BEFORE setting state so any subsequent api calls have the token
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    setIsAuthenticated(true);
    setRole(role);

    await loadUser();
    if (role === "admin") await loadOrganization();

    // tell every OTHER open tab to reset its session UI
    // we broadcast AFTER our own state is fully set so this tab is
    // unaffected (BroadcastChannel never fires in the originating tab)
    channelRef.current?.postMessage({ type: "NEW_LOGIN" });

    return { role, must_change_password };
  };

  const logout = () => {
    // clear storage first so any in-flight requests don't retry
    _clearAll();
    // tell all other open tabs to also show the login screen
    channelRef.current?.postMessage({ type: "LOGOUT" });
  };

  // don't render anything until we know whether the user is authenticated
  // this prevents a flash of the login page on hard refresh with a valid session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        user,
        organizationName,
        loading,
        login,
        logout,
        loadUser,
        loadOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}