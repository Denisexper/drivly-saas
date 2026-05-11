import { useState, useEffect, useCallback } from "react";
import { settingsService } from "../services/settings.service";

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await settingsService.get();
      setSettings(res.data.data ?? null);
    } catch {
      setError("No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { settings, loading, error, refetch: fetch };
}
