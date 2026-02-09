import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [organizationName, setOrganizationName] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    setOrganizationName(null);
  };

  const loadUser = async () => {
    try {
      const res = await api.get("accounts/users/me/");
      setUser(res.data);
      return res.data;
    } catch (error) {
      console.error("Failed to load user:", error);
      throw error;
    }
  };

  const loadOrganization = async () => {
    try{
      const res = await api.get("accounts/organizations/me/");
      setOrganizationName(res.data.name);
      return res.data;
    } catch (error) {
      console.error("Failed to load organization:", error);
      throw error;
    }
  };

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
          logout();
          return;
        }

        setIsAuthenticated(true);
        setRole(decoded.role);

        await loadUser();
        if (decoded.role === "admin") {
          await loadOrganization();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (email, password) => {
    try{
      const res = await api.post("accounts/auth/login/", {
        email: email.toLowerCase(),
        password,
    });

    const { access, refresh, role, must_change_password } = res.data;

    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    setIsAuthenticated(true);
    setRole(role);

    await loadUser();
    if (role === "admin") await loadOrganization();
    
    return { role, must_change_password };
  }catch (error) {
      console.error("Login error:", error);
      throw error;
    }
};

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
      {!loading && children}
    </AuthContext.Provider>
  );
}
