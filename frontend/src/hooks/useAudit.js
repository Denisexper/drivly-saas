import { useState, useCallback } from "react";
import { auditService } from "@/services/audit.service";

export function useAudit() {
  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const fetchLogs = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditService.getAll(params);
      setLogs(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError("Error al cargar los logs de auditoría.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { logs, total, totalPages, loading, error, fetchLogs };
}
