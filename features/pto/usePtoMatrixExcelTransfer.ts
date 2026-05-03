"use client";

import { useCallback, type ChangeEvent, type Dispatch, type SetStateAction } from "react";

import type { AdminLogInput } from "@/lib/domain/admin/logs";
import {
  ptoBucketCellKey,
  ptoBucketRowKey,
  type PtoBucketColumn,
  type PtoBucketRow,
} from "@/lib/domain/pto/buckets";
import { formatBucketNumber } from "@/lib/domain/pto/formatting";
import { normalizeLookupValue } from "@/lib/utils/text";

type UsePtoMatrixExcelTransferOptions = {
  rows: PtoBucketRow[];
  columns: PtoBucketColumn[];
  values: Record<string, number>;
  setValues: Dispatch<SetStateAction<Record<string, number>>>;
  sectionLabel: string;
  fileName: string;
  requestSave: () => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

function parseMatrixNumber(value: string) {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createColumnLookup(columns: PtoBucketColumn[]) {
  const lookup = new Map<string, PtoBucketColumn>();

  columns.forEach((column) => {
    lookup.set(normalizeLookupValue(column.label), column);
    lookup.set(normalizeLookupValue(column.key), column);
  });

  return lookup;
}

function createRowLookup(rows: PtoBucketRow[]) {
  const lookup = new Map<string, PtoBucketRow>();

  rows.forEach((row) => {
    lookup.set(row.key, row);
    lookup.set(ptoBucketRowKey(row.area, row.structure), row);
  });

  return lookup;
}

export function usePtoMatrixExcelTransfer({
  rows,
  columns,
  values,
  setValues,
  sectionLabel,
  fileName,
  requestSave,
  addAdminLog,
}: UsePtoMatrixExcelTransferOptions) {
  const exportMatrixToExcel = useCallback(async () => {
    const { createXlsxBlob } = await import("@/lib/utils/xlsx");
    const exportRows = [
      ["Участок", "Структура", ...columns.map((column) => column.label)],
      ...rows.map((row) => [
        row.area,
        row.structure,
        ...columns.map((column) => formatBucketNumber(values[ptoBucketCellKey(row.key, column.key)])),
      ]),
    ];
    const blob = createXlsxBlob(exportRows, sectionLabel, {
      columns: [
        { width: 18 },
        { width: 42 },
        ...columns.map(() => ({ width: 14 })),
      ],
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addAdminLog({
      action: "Выгрузка",
      section: sectionLabel,
      details: `Выгружена таблица: ${rows.length} строк, ${columns.length} столбцов.`,
      fileName,
      rowsCount: rows.length,
    });
  }, [addAdminLog, columns, fileName, rows, sectionLabel, values]);

  const importMatrixFromExcel = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const { parseTableImportFile } = await import("@/lib/utils/xlsx");
    const tableRows = await parseTableImportFile(file);
    const header = tableRows[0] ?? [];
    const columnLookup = createColumnLookup(columns);
    const rowLookup = createRowLookup(rows);
    const importedColumns = header
      .slice(2)
      .map((label, index) => ({
        index: index + 2,
        column: columnLookup.get(normalizeLookupValue(label)),
      }))
      .filter((item): item is { index: number; column: PtoBucketColumn } => Boolean(item.column));
    const updates: Record<string, number> = {};

    tableRows.slice(1).forEach((tableRow) => {
      const area = tableRow[0]?.trim() ?? "";
      const structure = tableRow[1]?.trim() ?? "";
      if (!area || !structure) return;

      const sourceRow = rowLookup.get(ptoBucketRowKey(area, structure));
      if (!sourceRow) return;

      importedColumns.forEach(({ index, column }) => {
        const value = parseMatrixNumber(tableRow[index] ?? "");
        if (value === undefined) return;
        updates[ptoBucketCellKey(sourceRow.key, column.key)] = value;
      });
    });

    const updateCount = Object.keys(updates).length;
    if (updateCount === 0) {
      window.alert("В выбранном файле не найдено подходящих значений для этой таблицы.");
      return;
    }

    if (!window.confirm(`Загрузить значения в "${sectionLabel}"? Будет обновлено ячеек: ${updateCount}.`)) return;

    setValues((current) => ({ ...current, ...updates }));
    requestSave();
    addAdminLog({
      action: "Загрузка",
      section: sectionLabel,
      details: `Загружены значения таблицы: ${updateCount} ячеек.`,
      fileName: file.name,
      rowsCount: updateCount,
    });
  }, [addAdminLog, columns, requestSave, rows, sectionLabel, setValues]);

  return {
    exportMatrixToExcel,
    importMatrixFromExcel,
  };
}
