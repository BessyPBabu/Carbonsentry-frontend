import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) {
    throw new Error("No refresh token available");
  }
  const res = await axios.post(
    `${API_BASE_URL}/api/accounts/auth/token/refresh/`,
    { refresh }
  );
  const newAccess = res.data.access;
  localStorage.setItem("access", newAccess);
  return newAccess;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!error.response) {
      return Promise.reject({ message: "Network error" });
    }

    if (error.response.status === 401 && !original._retry) {
      original._retry = true;

      if (!localStorage.getItem("refresh")) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccess = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;