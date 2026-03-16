import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  headers: { "Content-Type": "application/json" },
});

// attach access token from localStorage on every request
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!error.response) {
      return Promise.reject({ message: "Network error" });
    }

    // only attempt refresh once per request
    if (error.response.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem("refresh");

      if (!refresh) {
        // no refresh token — full logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/accounts/auth/token/refresh/`,
          { refresh }
        );
        const newAccess = res.data.access;
        localStorage.setItem("access", newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        // refresh token itself is expired or invalid
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;