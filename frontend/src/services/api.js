import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      const slug = localStorage.getItem("lastSlug");
      useAuthStore.setState({ token: null, user: null, savedSASession: null });
      window.location.href = slug ? `/login/${slug}` : "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
