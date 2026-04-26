import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

export type PtoRowTextField = "area" | "location" | "structure";

type PtoRowsSetter = Dispatch<SetStateAction<PtoPlanRow[]>>;

type UsePtoRowTextDraftsOptions = {
  drafts: Record<string, string>;
  setDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  commitValue: (setRows: PtoRowsSetter, row: PtoPlanRow, field: PtoRowTextField, value: string) => void;
  requestSave: () => void;
};

function ptoRowTextDraftKey(rowId: string, field: PtoRowTextField) {
  return `${rowId}:${field}`;
}

export function usePtoRowTextDrafts({
  drafts,
  setDrafts,
  commitValue,
  requestSave,
}: UsePtoRowTextDraftsOptions) {
  const getPtoRowTextDraft = useCallback((row: PtoPlanRow, field: PtoRowTextField) => {
    const key = ptoRowTextDraftKey(row.id, field);
    return drafts[key] ?? String(row[field] ?? "");
  }, [drafts]);

  const beginPtoRowTextDraft = useCallback((row: PtoPlanRow, field: PtoRowTextField) => {
    const key = ptoRowTextDraftKey(row.id, field);
    setDrafts((current) => (
      current[key] === undefined
        ? { ...current, [key]: String(row[field] ?? "") }
        : current
    ));
  }, [setDrafts]);

  const updatePtoRowTextDraft = useCallback((rowId: string, field: PtoRowTextField, value: string) => {
    const key = ptoRowTextDraftKey(rowId, field);
    setDrafts((current) => ({ ...current, [key]: value }));
  }, [setDrafts]);

  const clearPtoRowTextDraft = useCallback((rowId: string, field: PtoRowTextField) => {
    const key = ptoRowTextDraftKey(rowId, field);
    setDrafts((current) => {
      if (!(key in current)) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }, [setDrafts]);

  const commitPtoRowTextDraft = useCallback((setRows: PtoRowsSetter, row: PtoPlanRow, field: PtoRowTextField) => {
    const key = ptoRowTextDraftKey(row.id, field);
    const nextValue = drafts[key];
    if (nextValue === undefined) return;

    clearPtoRowTextDraft(row.id, field);
    if (nextValue === String(row[field] ?? "")) return;

    commitValue(setRows, row, field, nextValue);
    requestSave();
  }, [clearPtoRowTextDraft, commitValue, drafts, requestSave]);

  const cancelPtoRowTextDraft = useCallback((rowId: string, field: PtoRowTextField) => {
    clearPtoRowTextDraft(rowId, field);
  }, [clearPtoRowTextDraft]);

  return {
    getPtoRowTextDraft,
    beginPtoRowTextDraft,
    updatePtoRowTextDraft,
    commitPtoRowTextDraft,
    cancelPtoRowTextDraft,
  };
}
