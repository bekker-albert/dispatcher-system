import { useCallback, type RefObject } from "react";
import { ptoDateTableKeyFromTab, type PtoDateTableKey } from "@/lib/domain/pto/date-table";
import type { SubTabConfig } from "@/lib/domain/navigation/tabs";

type PtoDayPatch = {
  rowId: string;
  day: string;
  value: number | null;
};

type UsePtoDateTableContextOptions = {
  ptoTab: string;
  ptoSubTabs: SubTabConfig[];
  databaseConfigured: boolean;
  databaseLoadedRef: RefObject<boolean>;
};

export function usePtoDateTableContext({
  ptoTab,
  ptoSubTabs,
  databaseConfigured,
  databaseLoadedRef,
}: UsePtoDateTableContextOptions) {
  const currentPtoTableLabel = useCallback(() => (
    ptoSubTabs.find((tab) => tab.value === ptoTab)?.label ?? ptoTab
  ), [ptoSubTabs, ptoTab]);

  const currentPtoDateTableKey = useCallback((): PtoDateTableKey | null => (
    ptoDateTableKeyFromTab(ptoTab)
  ), [ptoTab]);

  const savePtoDayPatchToDatabase = useCallback((rowId: string, day: string, value: number | null) => {
    const table = currentPtoDateTableKey();
    if (!table || !databaseConfigured || !databaseLoadedRef.current) return;

    void import("@/lib/data/pto")
      .then(({ savePtoDayValueToDatabase }) => savePtoDayValueToDatabase(table, rowId, day, value))
      .catch((error) => console.warn("Database PTO day save failed:", error));
  }, [currentPtoDateTableKey, databaseConfigured, databaseLoadedRef]);

  const savePtoDayPatchesToDatabase = useCallback((values: PtoDayPatch[]) => {
    const table = currentPtoDateTableKey();
    if (!table || !databaseConfigured || !databaseLoadedRef.current || values.length === 0) return;

    void import("@/lib/data/pto")
      .then(({ savePtoDayValuesToDatabase }) => savePtoDayValuesToDatabase(table, values))
      .catch((error) => console.warn("Database PTO day batch save failed:", error));
  }, [currentPtoDateTableKey, databaseConfigured, databaseLoadedRef]);

  return {
    currentPtoTableLabel,
    currentPtoDateTableKey,
    savePtoDayPatchToDatabase,
    savePtoDayPatchesToDatabase,
  };
}
