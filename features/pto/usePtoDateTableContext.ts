import { useCallback, type RefObject } from "react";
import { enqueuePtoInlineDatabaseWrite } from "@/features/pto/ptoInlineDatabaseWrite";
import { ptoDateTableKeyFromTab, type PtoDateTableKey, type PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { SubTabConfig } from "@/lib/domain/navigation/tabs";
import type { PtoDayPatch } from "@/features/pto/ptoDateTableTypes";
import type { PtoDatabaseInlineSavePatch } from "@/features/pto/ptoPersistenceModel";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type UsePtoDateTableContextOptions = {
  ptoTab: string;
  ptoSubTabs: SubTabConfig[];
  databaseConfigured: boolean;
  databaseLoadedRef: RefObject<boolean>;
  markPtoDatabaseInlineWriteSaved: (updatedAt?: string | null, patch?: PtoDatabaseInlineSavePatch) => void;
  getPtoDatabaseExpectedUpdatedAt: () => string | null;
  showSaveStatus: ShowSaveStatus;
};

export function usePtoDateTableContext({
  ptoTab,
  ptoSubTabs,
  databaseConfigured,
  databaseLoadedRef,
  markPtoDatabaseInlineWriteSaved,
  getPtoDatabaseExpectedUpdatedAt,
  showSaveStatus,
}: UsePtoDateTableContextOptions) {
  const currentPtoTableLabel = useCallback(() => (
    ptoSubTabs.find((tab) => tab.value === ptoTab)?.label ?? ptoTab
  ), [ptoSubTabs, ptoTab]);

  const currentPtoDateTableKey = useCallback((): PtoDateTableKey | null => (
    ptoDateTableKeyFromTab(ptoTab)
  ), [ptoTab]);

  const savePtoDayPatchToDatabase = useCallback((row: PtoPlanRow, day: string, value: number | null, onError?: () => void) => {
    const table = currentPtoDateTableKey();
    if (!table || !databaseConfigured || !databaseLoadedRef.current) return false;

    enqueuePtoInlineDatabaseWrite({
      label: "ячейка дня",
      showSaveStatus,
      write: async () => {
        const { savePtoDayValueWithRowToDatabase } = await import("@/lib/data/pto");
        return await savePtoDayValueWithRowToDatabase(table, row, day, value, {
          expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
        });
      },
      onSaved: (result) => markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
        kind: "day-values",
        table,
        values: [{ rowId: row.id, day, value }],
      }),
      onError,
    });
    return true;
  }, [currentPtoDateTableKey, databaseConfigured, databaseLoadedRef, getPtoDatabaseExpectedUpdatedAt, markPtoDatabaseInlineWriteSaved, showSaveStatus]);

  const savePtoDayPatchesToDatabase = useCallback((row: PtoPlanRow, values: PtoDayPatch[], onError?: () => void) => {
    const table = currentPtoDateTableKey();
    if (!table || !databaseConfigured || !databaseLoadedRef.current || values.length === 0) return false;

    enqueuePtoInlineDatabaseWrite({
      label: "значения месяца",
      showSaveStatus,
      write: async () => {
        const { savePtoDayValuesWithRowToDatabase } = await import("@/lib/data/pto");
        return await savePtoDayValuesWithRowToDatabase(table, row, values, {
          expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
        });
      },
      onSaved: (result) => markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
        kind: "day-values",
        table,
        values,
      }),
      onError,
    });
    return true;
  }, [currentPtoDateTableKey, databaseConfigured, databaseLoadedRef, getPtoDatabaseExpectedUpdatedAt, markPtoDatabaseInlineWriteSaved, showSaveStatus]);

  return {
    currentPtoTableLabel,
    currentPtoDateTableKey,
    savePtoDayPatchToDatabase,
    savePtoDayPatchesToDatabase,
  };
}
