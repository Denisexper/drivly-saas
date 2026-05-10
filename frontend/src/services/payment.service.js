import api from "./api";

export const paymentService = {
  getAll: () => api.get("/payments"),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post("/payments", data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  remove: (id) => api.delete(`/payments/${id}`),
  getSummary: (rentalId) => api.get(`/rentals/${rentalId}/payment-summary`),
  downloadPdfReceipt: async (paymentId) => {
    const res = await api.get(`/payments/${paymentId}/pdf-receipt`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `recibo-${paymentId.slice(-8)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
