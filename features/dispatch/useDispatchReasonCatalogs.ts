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

async function requestCatalogs(action: "load-reason-catalogs" | "save-reason-catalogs", catalogs?: DispatchReasonCatalogs) {
  const response = await fetch("/api/database", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-dispatcher-request": "same-origin",
    },
    body: JSON.stringify({
      resource: "dispatch",
      action,
      payload: catalogs ? { catalogs } : {},
    }),
  });
  const body = await response.json() as CatalogResponse;
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Не удалось обработать справочники.");
  }
  return body;
}

export function useDispatchReasonCatalogs() {
  const [catalogs, setCatalogs] = useState<DispatchReasonCatalogs>(emptyDispatchReasonCatalogs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await requestCatalogs("load-reason-catalogs");
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
      const body = await requestCatalogs("save-reason-catalogs", normalized);
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
