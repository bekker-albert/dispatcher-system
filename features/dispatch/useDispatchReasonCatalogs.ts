"use client";

import { useCallback, useEffect, useState } from "react";

import {
  emptyDispatchReasonCatalogs,
  normalizeDispatchReasonCatalogs,
  type DispatchReasonCatalogs,
} from "@/lib/domain/dispatch/reason-catalog";

type CatalogResponse = {
  catalogs?: unknown;
  error?: unknown;
};

export function useDispatchReasonCatalogs() {
  const [catalogs, setCatalogs] = useState<DispatchReasonCatalogs>(emptyDispatchReasonCatalogs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/dispatch/reason-catalogs", { cache: "no-store" });
      const body = await response.json() as CatalogResponse;
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Не удалось загрузить справочники.");
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
      const response = await fetch("/api/dispatch/reason-catalogs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogs: normalized }),
      });
      const body = await response.json() as CatalogResponse;
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Не удалось сохранить справочники.");
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
