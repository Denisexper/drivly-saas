import api from "./api";

export const settingsService = {
  get: () => api.get("/settings"),
  update: (data) => api.patch("/settings", data),
};
