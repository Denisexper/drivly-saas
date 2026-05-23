import api from "./api";

export const authService = {
  registerCompany: (data) => api.post("/auth/register-company", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) => api.post("/auth/reset-password", { token, newPassword }),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
  resendVerification: (email) => api.post("/auth/resend-verification", { email }),
};
