import api from "./api";

export const authService = {
  registerCompany: (data) => api.post("/auth/register-company", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) => api.post("/auth/reset-password", { token, newPassword }),
};
