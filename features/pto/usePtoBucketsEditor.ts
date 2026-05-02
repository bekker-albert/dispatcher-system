import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";

import {
  applyPtoBucketValueDraft,
  clearPtoBucketValueKeys,
  createPtoBucketManualRowDraft,
  normalizePtoBucketDraftValue,
  removePtoBucketManualRowValues,
} from "@/features/pto/ptoBucketsEditorModel";
import { enqueuePtoDatabaseWrite } from "@/features/pto/ptoSaveQueue";
import type { PtoDatabaseInlineSavePatch } from "@/features/pto/ptoPersistenceModel";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";

type AddAdminLog = (entry: AdminLogInput) => void;

type UsePtoBucketsEditorOptions = {
  ptoAreaFilter: string;
  ptoBucketRows: PtoBucketRow[];
  ptoBucketColumns: PtoBucketColumn[];
  ptoBucketManualRows: PtoBucketRow[];
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  databaseConfigured: boolean;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  markPtoDatabaseInlineWriteSaved: (updatedAt?: string | null, patch?: PtoDatabaseInlineSavePatch) => void;
  getPtoDatabaseExpectedUpdatedAt: () => string | null;
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
  markPtoDatabaseInlineWriteSaved,
  getPtoDatabaseExpectedUpdatedAt,
  requestSave,
  addAdminLog,
}: UsePtoBucketsEditorOptions) {
  const databaseReady = useCallback(() => databaseConfigured && ptoDatabaseLoadedRef.current, [databaseConfigured, ptoDatabaseLoadedRef]);

  const commitPtoBucketValue = useCallback((cellKey: string, draft: string) => {
    const [rowKey, equipmentKey] = cellKey.split("::");
    const bucketRow = ptoBucketRows.find((row) => row.key === rowKey);
    const bucketColumn = ptoBucketColumns.find((column) => column.key === equipmentKey);
    const nextValue = normalizePtoBucketDraftValue(draft);

    setPtoBucketValues((current) => applyPtoBucketValueDraft(current, cellKey, draft).values);
    if (databaseReady()) {
      void enqueuePtoDatabaseWrite(async () => {
        const { savePtoBucketValueToDatabase } = await import("@/lib/data/pto");
        const result = await savePtoBucketValueToDatabase(cellKey, nextValue, {
          expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
        });
        markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
          kind: "bucket-values",
          values: [{ cellKey, value: nextValue }],
        });
      })
        .catch((error) => console.warn("Database PTO bucket value save failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО: Ковши",
      details: `Изменена ячейка${bucketRow ? ` ${bucketRow.area} / ${bucketRow.structure}` : ""}${bucketColumn ? `, ${bucketColumn.label}` : ""}.`,
    });
  }, [addAdminLog, databaseReady, getPtoDatabaseExpectedUpdatedAt, markPtoDatabaseInlineWriteSaved, ptoBucketColumns, ptoBucketRows, requestSave, setPtoBucketValues]);

  const clearPtoBucketCells = useCallback((cellKeys: string[]) => {
    if (cellKeys.length === 0) return;

    setPtoBucketValues((current) => clearPtoBucketValueKeys(current, cellKeys));
    if (databaseReady()) {
      void enqueuePtoDatabaseWrite(async () => {
        const { deletePtoBucketValuesFromDatabase } = await import("@/lib/data/pto");
        const result = await deletePtoBucketValuesFromDatabase(cellKeys, {
          expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
        });
        markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
          kind: "bucket-values",
          values: cellKeys.map((cellKey) => ({ cellKey, value: null })),
        });
      })
        .catch((error) => console.warn("Database PTO bucket values delete failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО: Ковши",
      details: `Очищены выбранные ячейки ковшей: ${cellKeys.length}.`,
    });
  }, [addAdminLog, databaseReady, getPtoDatabaseExpectedUpdatedAt, markPtoDatabaseInlineWriteSaved, requestSave, setPtoBucketValues]);

  const addPtoBucketManualRow = useCallback((areaValue: string, structureValue: string) => {
    const row = createPtoBucketManualRowDraft(areaValue, structureValue, ptoAreaFilter, [
      ...ptoBucketManualRows,
      ...ptoBucketRows,
    ]);
    if (!row) return false;

    setPtoBucketManualRows((current) => [...current, row]);
    if (databaseReady()) {
      void enqueuePtoDatabaseWrite(async () => {
        const { savePtoBucketRowToDatabase } = await import("@/lib/data/pto");
        const result = await savePtoBucketRowToDatabase(row, ptoBucketManualRows.length, {
          expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
        });
        markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
          kind: "bucket-row",
          action: "upsert",
          row,
          index: ptoBucketManualRows.length,
        });
      })
        .catch((error) => console.warn("Database PTO bucket row save failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Добавление",
      section: "ПТО: Ковши",
      details: `Добавлена строка ковшей: ${row.area} / ${row.structure}.`,
    });
    return true;
  }, [addAdminLog, databaseReady, getPtoDatabaseExpectedUpdatedAt, markPtoDatabaseInlineWriteSaved, ptoAreaFilter, ptoBucketManualRows, ptoBucketRows, requestSave, setPtoBucketManualRows]);

  const deletePtoBucketManualRow = useCallback((row: PtoBucketRow) => {
    if (!window.confirm(`Удалить временную строку "${row.area} / ${row.structure}" из ковшей?`)) return;

    setPtoBucketManualRows((current) => current.filter((item) => item.key !== row.key));
    setPtoBucketValues((current) => removePtoBucketManualRowValues(current, row.key));
    if (databaseReady()) {
      void enqueuePtoDatabaseWrite(async () => {
        const { deletePtoBucketRowFromDatabase } = await import("@/lib/data/pto");
        const result = await deletePtoBucketRowFromDatabase(row.key, {
          expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
        });
        markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
          kind: "bucket-row",
          action: "delete",
          rowKey: row.key,
        });
      })
        .catch((error) => console.warn("Database PTO bucket row delete failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО: Ковши",
      details: `Удалена строка ковшей: ${row.area} / ${row.structure}.`,
    });
  }, [addAdminLog, databaseReady, getPtoDatabaseExpectedUpdatedAt, markPtoDatabaseInlineWriteSaved, requestSave, setPtoBucketManualRows, setPtoBucketValues]);

  return {
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  };
}
