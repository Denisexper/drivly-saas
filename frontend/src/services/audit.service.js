import api from "./api";

export const auditService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.entity)   query.set("entity",   params.entity);
    if (params.action)   query.set("action",   params.action);
    if (params.userId)   query.set("userId",   params.userId);
    if (params.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params.dateTo)   query.set("dateTo",   params.dateTo);
    if (params.page)     query.set("page",     params.page);
    if (params.limit)    query.set("limit",    params.limit);
    return api.get(`/audit?${query.toString()}`);
  },
};
