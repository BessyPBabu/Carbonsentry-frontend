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

  // resets react state only — does NOT touch localStorage
  // used when another tab sends a broadcast
  const _resetState = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    setOrganizationName(null);
  };

  // full wipe — clears storage + state
  const _clearAll = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    _resetState();
  };

  // cross-tab sync
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      // new login in another tab: reset this tab's UI without touching storage
      // (the new session's tokens are in storage and belong to that tab)
      if (event.data?.type === "NEW_LOGIN") _resetState();
      // logout from another tab: mirror state reset here
      if (event.data?.type === "LOGOUT") _resetState();
    };

    return () => channel.close();
  }, []);

  const loadUser = async () => {
    const res = await api.get("accounts/users/me/");
    setUser(res.data);
    return res.data;
  };

  // load organization for ALL roles — not just admin
  // officer and viewer also belong to an organization and should see its name
  const loadOrganization = async () => {
    const res = await api.get("accounts/organizations/me/");
    setOrganizationName(res.data.name);
    return res.data;
  };

  // re-hydrate session on hard refresh
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
          _clearAll();
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setRole(decoded.role);
        // load user + org for every role
        await loadUser();
        await loadOrganization();
      } catch (err) {
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

    // write tokens before setting state so any subsequent api calls
    // from loadUser / loadOrganization already have the token available
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    setIsAuthenticated(true);
    setRole(role);

    await loadUser();
    await loadOrganization();

    // tell every OTHER open tab to reset — this tab is unaffected
    // because BroadcastChannel never fires in the originating tab
    channelRef.current?.postMessage({ type: "NEW_LOGIN" });

    return { role, must_change_password };
  };

  const logout = async () => {
    const refresh = localStorage.getItem("refresh");

    // best-effort: blacklist the refresh token on the server so it can't
    // be reused even if someone extracts it from storage before we clear it
    if (refresh) {
      try {
        await api.post("accounts/auth/logout/", { refresh });
      } catch (err) {
        // don't block logout if the server call fails — clear locally regardless
        console.warn("AuthContext.logout: server blacklist failed:", err);
      }
    }

    _clearAll();
    channelRef.current?.postMessage({ type: "LOGOUT" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
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