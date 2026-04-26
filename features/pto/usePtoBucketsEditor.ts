import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";

import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import { ptoBucketRowKey, type PtoBucketColumn, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { parseDecimalInput } from "@/lib/utils/numbers";
import { cleanAreaName } from "@/lib/utils/text";

type AddAdminLog = (entry: Omit<AdminLogEntry, "id" | "at" | "user">) => void;

type UsePtoBucketsEditorOptions = {
  ptoAreaFilter: string;
  ptoBucketRows: PtoBucketRow[];
  ptoBucketColumns: PtoBucketColumn[];
  ptoBucketManualRows: PtoBucketRow[];
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  databaseConfigured: boolean;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  requestSave: () => void;
  addAdminLog: AddAdminLog;
};

export function usePtoBucketsEditor({
  ptoAreaFilter,
  ptoBucketRows,
  ptoBucketColumns,
  ptoBucketManualRows,
  setPtoBucketValues,
  setPtoBucketManualRows,
  databaseConfigured,
  ptoDatabaseLoadedRef,
  requestSave,
  addAdminLog,
}: UsePtoBucketsEditorOptions) {
  const databaseReady = useCallback(() => databaseConfigured && ptoDatabaseLoadedRef.current, [databaseConfigured, ptoDatabaseLoadedRef]);

  const commitPtoBucketValue = useCallback((cellKey: string, draft: string) => {
    const parsed = parseDecimalInput(draft);
    const [rowKey, equipmentKey] = cellKey.split("::");
    const bucketRow = ptoBucketRows.find((row) => row.key === rowKey);
    const bucketColumn = ptoBucketColumns.find((column) => column.key === equipmentKey);
    const nextValue = parsed === null ? null : Math.round(parsed * 100) / 100;

    setPtoBucketValues((current) => {
      const next = { ...current };

      if (nextValue === null) {
        delete next[cellKey];
      } else {
        next[cellKey] = nextValue;
      }

      return next;
    });
    if (databaseReady()) {
      void import("@/lib/data/pto")
        .then(({ savePtoBucketValueToDatabase }) => savePtoBucketValueToDatabase(cellKey, nextValue))
        .catch((error) => console.warn("Database PTO bucket value save failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО: Ковши",
      details: `Изменена ячейка${bucketRow ? ` ${bucketRow.area} / ${bucketRow.structure}` : ""}${bucketColumn ? `, ${bucketColumn.label}` : ""}.`,
    });
  }, [addAdminLog, databaseReady, ptoBucketColumns, ptoBucketRows, requestSave, setPtoBucketValues]);

  const clearPtoBucketCells = useCallback((cellKeys: string[]) => {
    if (cellKeys.length === 0) return;

    setPtoBucketValues((current) => {
      const next = { ...current };
      cellKeys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
    if (databaseReady()) {
      void import("@/lib/data/pto")
        .then(({ deletePtoBucketValuesFromDatabase }) => deletePtoBucketValuesFromDatabase(cellKeys))
        .catch((error) => console.warn("Database PTO bucket values delete failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО: Ковши",
      details: `Очищены выбранные ячейки ковшей: ${cellKeys.length}.`,
    });
  }, [addAdminLog, databaseReady, requestSave, setPtoBucketValues]);

  const addPtoBucketManualRow = useCallback((areaValue: string, structureValue: string) => {
    const fallbackArea = ptoAreaFilter === "Все участки" ? "" : ptoAreaFilter;
    const area = cleanAreaName(areaValue.trim() || fallbackArea).trim();
    const structure = structureValue.trim();

    if (!area || !structure) return false;

    const key = ptoBucketRowKey(area, structure);
    if (ptoBucketManualRows.some((row) => row.key === key) || ptoBucketRows.some((row) => row.key === key)) {
      return false;
    }

    setPtoBucketManualRows((current) => [...current, { key, area, structure, source: "manual" }]);
    if (databaseReady()) {
      void import("@/lib/data/pto")
        .then(({ savePtoBucketRowToDatabase }) => savePtoBucketRowToDatabase({ key, area, structure, source: "manual" }, ptoBucketManualRows.length))
        .catch((error) => console.warn("Database PTO bucket row save failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Добавление",
      section: "ПТО: Ковши",
      details: `Добавлена строка ковшей: ${area} / ${structure}.`,
    });
    return true;
  }, [addAdminLog, databaseReady, ptoAreaFilter, ptoBucketManualRows, ptoBucketRows, requestSave, setPtoBucketManualRows]);

  const deletePtoBucketManualRow = useCallback((row: PtoBucketRow) => {
    if (!window.confirm(`Удалить временную строку "${row.area} / ${row.structure}" из ковшей?`)) return;

    setPtoBucketManualRows((current) => current.filter((item) => item.key !== row.key));
    setPtoBucketValues((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${row.key}::`)) delete next[key];
      });
      return next;
    });
    if (databaseReady()) {
      void import("@/lib/data/pto")
        .then(({ deletePtoBucketRowFromDatabase }) => deletePtoBucketRowFromDatabase(row.key))
        .catch((error) => console.warn("Database PTO bucket row delete failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО: Ковши",
      details: `Удалена строка ковшей: ${row.area} / ${row.structure}.`,
    });
  }, [addAdminLog, databaseReady, requestSave, setPtoBucketManualRows, setPtoBucketValues]);

  return {
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  };
}
