"use client";

import { useCallback, useEffect, useState } from "react";

import {
  loadDispatchReasonCatalogsFromDatabase,
  saveDispatchReasonCatalogsToDatabase,
} from "@/lib/data/dispatch-reason-catalogs";
import {
  emptyDispatchReasonCatalogs,
  normalizeDispatchReasonCatalogs,
  type DispatchReasonCatalogs,
} from "@/lib/domain/dispatch/reason-catalog";

export function useDispatchReasonCatalogs() {
  const [catalogs, setCatalogs] = useState<DispatchReasonCatalogs>(emptyDispatchReasonCatalogs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await loadDispatchReasonCatalogsFromDatabase();
      setCatalogs(normalizeDispatchReasonCatalogs(body.catalogs));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить справочники.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (nextCatalogs: DispatchReasonCatalogs) => {
    const normalized = normalizeDispatchReasonCatalogs(nextCatalogs);
    const previous = catalogs;
    setCatalogs(normalized);
    setSaving(true);
    setError("");
    try {
      const body = await saveDispatchReasonCatalogsToDatabase(normalized);
      const saved = normalizeDispatchReasonCatalogs(body.catalogs);
      setCatalogs(saved);
      return saved;
    } catch (saveError) {
      setCatalogs(previous);
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить справочники.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [catalogs]);

  return { catalogs, setCatalogs, loading, saving, error, reload, save };
}
