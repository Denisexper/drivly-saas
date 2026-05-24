import api from "./api";

export const rentalService = {
  getAll: (status) => api.get("/rentals", { params: status ? { status } : {} }),
  getById: (id) => api.get(`/rentals/${id}`),
  create: (data) => api.post("/rentals", data),
  update: (id, data) => api.put(`/rentals/${id}`, data),
  cancel: (id, notes) => api.patch(`/rentals/${id}/cancel`, { notes }),
  returnVehicle: (id, data) => api.patch(`/rentals/${id}/return`, data),
  forceDelete: (id) => api.delete(`/rentals/${id}/force`),
  uploadPhotos: (id, files, type) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("photos", f));
    fd.append("type", type);
    return api.post(`/rentals/${id}/photos`, fd);
  },
  getPhotos: (id, type) =>
    api.get(`/rentals/${id}/photos`, { params: type ? { type } : {} }),
  downloadPdfContract: async (rentalId) => {
    const res = await api.get(`/rentals/${rentalId}/pdf-contract`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `contrato-${rentalId.slice(-8)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
