import { useCallback, type RefObject } from "react";
import { enqueuePtoDatabaseWrite } from "@/features/pto/ptoSaveQueue";
import { ptoDateTableKeyFromTab, type PtoDateTableKey, type PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { SubTabConfig } from "@/lib/domain/navigation/tabs";
import type { PtoDayPatch } from "@/features/pto/ptoDateTableTypes";
import type { PtoDatabaseInlineSavePatch } from "@/features/pto/ptoPersistenceModel";

type UsePtoDateTableContextOptions = {
  ptoTab: string;
  ptoSubTabs: SubTabConfig[];
  databaseConfigured: boolean;
  databaseLoadedRef: RefObject<boolean>;
  markPtoDatabaseInlineWriteSaved: (updatedAt?: string | null, patch?: PtoDatabaseInlineSavePatch) => void;
  getPtoDatabaseExpectedUpdatedAt: () => string | null;
};

export function usePtoDateTableContext({
  ptoTab,
  ptoSubTabs,
  databaseConfigured,
  databaseLoadedRef,
  markPtoDatabaseInlineWriteSaved,
  getPtoDatabaseExpectedUpdatedAt,
}: UsePtoDateTableContextOptions) {
  const currentPtoTableLabel = useCallback(() => (
    ptoSubTabs.find((tab) => tab.value === ptoTab)?.label ?? ptoTab
  ), [ptoSubTabs, ptoTab]);

  const currentPtoDateTableKey = useCallback((): PtoDateTableKey | null => (
    ptoDateTableKeyFromTab(ptoTab)
  ), [ptoTab]);

  const savePtoDayPatchToDatabase = useCallback((row: PtoPlanRow, day: string, value: number | null) => {
    const table = currentPtoDateTableKey();
    if (!table || !databaseConfigured || !databaseLoadedRef.current) return;

    void enqueuePtoDatabaseWrite(async () => {
      const { savePtoDayValueWithRowToDatabase } = await import("@/lib/data/pto");
      const result = await savePtoDayValueWithRowToDatabase(table, row, day, value, {
        expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
      });
      markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
        kind: "day-values",
        table,
        values: [{ rowId: row.id, day, value }],
      });
    })
      .catch((error) => console.warn("Database PTO day save failed:", error));
  }, [currentPtoDateTableKey, databaseConfigured, databaseLoadedRef, getPtoDatabaseExpectedUpdatedAt, markPtoDatabaseInlineWriteSaved]);

  const savePtoDayPatchesToDatabase = useCallback((row: PtoPlanRow, values: PtoDayPatch[]) => {
    const table = currentPtoDateTableKey();
    if (!table || !databaseConfigured || !databaseLoadedRef.current || values.length === 0) return;

    void enqueuePtoDatabaseWrite(async () => {
      const { savePtoDayValuesWithRowToDatabase } = await import("@/lib/data/pto");
      const result = await savePtoDayValuesWithRowToDatabase(table, row, values, {
        expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
      });
      markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
        kind: "day-values",
        table,
        values,
      });
    })
      .catch((error) => console.warn("Database PTO day batch save failed:", error));
  }, [currentPtoDateTableKey, databaseConfigured, databaseLoadedRef, getPtoDatabaseExpectedUpdatedAt, markPtoDatabaseInlineWriteSaved]);

  return {
    currentPtoTableLabel,
    currentPtoDateTableKey,
    savePtoDayPatchToDatabase,
    savePtoDayPatchesToDatabase,
  };
}
