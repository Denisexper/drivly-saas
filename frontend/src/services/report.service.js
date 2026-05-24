import api from "./api";

function triggerCsvDownload(blob, filename) {
  const url = URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const reportService = {
  getDailySummary: (date, tenantId) =>
    api.get("/reports/daily-summary", { params: { date, tenantId } }),

  getReceivables: (tenantId) =>
    api.get("/reports/receivables", { params: { tenantId } }),

  getRentalsReport: (params) =>
    api.get("/reports/rentals", { params }),

  getPaymentsReport: (params) =>
    api.get("/reports/payments", { params }),

  getVehiclesReport: (params) =>
    api.get("/reports/vehicles", { params }),

  downloadRentalsCsv: async (params) => {
    const res = await api.get("/reports/rentals", {
      params: { ...params, format: "csv" },
      responseType: "blob",
    });
    triggerCsvDownload(res.data, "reporte-alquileres.csv");
  },

  downloadPaymentsCsv: async (params) => {
    const res = await api.get("/reports/payments", {
      params: { ...params, format: "csv" },
      responseType: "blob",
    });
    triggerCsvDownload(res.data, "reporte-pagos.csv");
  },

  downloadVehiclesCsv: async (params) => {
    const res = await api.get("/reports/vehicles", {
      params: { ...params, format: "csv" },
      responseType: "blob",
    });
    triggerCsvDownload(res.data, "reporte-vehiculos.csv");
  },
};
