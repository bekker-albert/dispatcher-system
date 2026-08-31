"use client";

import { useCallback, type ChangeEvent, type Dispatch, type SetStateAction } from "react";

import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { PtoBodyColumn } from "@/lib/domain/pto/bodies";
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

function isBodyColumn(column: PtoBucketColumn): column is PtoBodyColumn {
  return "area" in column && typeof (column as Partial<PtoBodyColumn>).area === "string";
}

function isBodiesMatrix(rows: PtoBucketRow[], columns: PtoBucketColumn[]) {
  return rows.some((row) => row.key.startsWith("body:"))
    && columns.length > 0
    && columns.every(isBodyColumn);
}

function bodyColumnLookupKey(area: string, material: string) {
  return `${normalizeLookupValue(area)}\u001f${normalizeLookupValue(material)}`;
}

function createBodyColumnLookup(columns: PtoBodyColumn[]) {
  const lookup = new Map<string, PtoBodyColumn>();

  columns.forEach((column) => {
    lookup.set(bodyColumnLookupKey(column.area, column.label), column);
  });

  return lookup;
}

function createBodyRowLookup(rows: PtoBucketRow[]) {
  const lookup = new Map<string, PtoBucketRow>();

  rows.forEach((row) => {
    lookup.set(normalizeLookupValue(row.area), row);
    lookup.set(row.key, row);
  });

  return lookup;
}

function createBodyExportRows(
  rows: PtoBucketRow[],
  columns: PtoBodyColumn[],
  values: Record<string, number>,
) {
  const areaHeader = [
    "",
    ...columns.map((column, index) => (
      index === 0 || columns[index - 1]?.area !== column.area ? column.area : ""
    )),
  ];
  const materialHeader = ["Техника", ...columns.map((column) => column.label)];

  return [
    areaHeader,
    materialHeader,
    ...rows.map((row) => [
      row.area,
      ...columns.map((column) => formatBucketNumber(values[ptoBucketCellKey(row.key, column.key)])),
    ]),
  ];
}

function readBodyImportUpdates(
  tableRows: string[][],
  rows: PtoBucketRow[],
  columns: PtoBodyColumn[],
) {
  const areaHeader = tableRows[0] ?? [];
  const materialHeader = tableRows[1] ?? [];
  const columnLookup = createBodyColumnLookup(columns);
  const rowLookup = createBodyRowLookup(rows);
  let currentArea = "";
  const importedColumns = materialHeader
    .slice(1)
    .map((material, index) => {
      const areaCell = areaHeader[index + 1]?.trim() ?? "";
      if (areaCell) currentArea = areaCell;

      return {
        index: index + 1,
        column: columnLookup.get(bodyColumnLookupKey(currentArea, material)),
      };
    })
    .filter((item): item is { index: number; column: PtoBodyColumn } => Boolean(item.column));
  const updates: Record<string, number> = {};

  tableRows.slice(2).forEach((tableRow) => {
    const technique = tableRow[0]?.trim() ?? "";
    if (!technique) return;

    const sourceRow = rowLookup.get(normalizeLookupValue(technique));
    if (!sourceRow) return;

    importedColumns.forEach(({ index, column }) => {
      const value = parseMatrixNumber(tableRow[index] ?? "");
      if (value === undefined) return;
      updates[ptoBucketCellKey(sourceRow.key, column.key)] = value;
    });
  });

  return updates;
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
    const bodiesMatrix = isBodiesMatrix(rows, columns);
    const exportRows = bodiesMatrix
      ? createBodyExportRows(rows, columns as PtoBodyColumn[], values)
      : [
          ["Участок", "Структура", ...columns.map((column) => column.label)],
          ...rows.map((row) => [
            row.area,
            row.structure,
            ...columns.map((column) => formatBucketNumber(values[ptoBucketCellKey(row.key, column.key)])),
          ]),
        ];
    const blob = createXlsxBlob(exportRows, sectionLabel, {
      columns: bodiesMatrix
        ? [
            { width: 28 },
            ...columns.map(() => ({ width: 18 })),
          ]
        : [
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
    const bodiesMatrix = isBodiesMatrix(rows, columns);
    let updates: Record<string, number> = {};

    if (bodiesMatrix) {
      updates = readBodyImportUpdates(tableRows, rows, columns as PtoBodyColumn[]);
    } else {
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
    }

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
