import { isRecord } from "../../utils/normalizers";
import { cleanAreaName, normalizeLookupValue } from "../../utils/text";
import type { PtoPlanRow } from "./date-table";
import type { VehicleRow } from "../vehicles/types";

export type PtoBucketRow = {
  key: string;
  area: string;
  structure: string;
  source?: "auto" | "manual";
};

export type PtoBucketColumn = {
  key: string;
  label: string;
  duplicate?: boolean;
};

export type PtoBucketColumnsModel = {
  columns: PtoBucketColumn[];
  signature: string;
};

export type PtoBucketRowsModel = {
  rows: PtoBucketRow[];
  signature: string;
};

export type PtoBucketCell = {
  rowKey: string;
  equipmentKey: string;
};

export function normalizePtoBucketManualRows(value: unknown): PtoBucketRow[] {
  if (!Array.isArray(value)) return [];

  const rowsByKey = new Map<string, PtoBucketRow>();

  value.forEach((item) => {
    if (!isRecord(item)) return;

    const area = typeof item.area === "string" ? cleanAreaName(item.area).trim() : "";
    const structure = typeof item.structure === "string" ? item.structure.trim() : "";
    if (!area || !structure) return;

    const key = ptoBucketRowKey(area, structure);
    if (!rowsByKey.has(key)) rowsByKey.set(key, { key, area, structure, source: "manual" });
  });

  return Array.from(rowsByKey.values());
}

export function loadingEquipmentLabel(vehicle: Pick<VehicleRow, "brand" | "model" | "name">) {
  return [vehicle.brand, vehicle.model].map((value) => value.trim()).filter(Boolean).join(" ") || vehicle.name.trim();
}

export function isLoadingEquipment(vehicle: VehicleRow) {
  const type = normalizeLookupValue(vehicle.vehicleType);

  if (
    type.includes("\u044d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440")
    || type.includes("\u043f\u043e\u0433\u0440\u0443\u0437")
  ) {
    return true;
  }

  return type.includes("экскаватор")
    || type.includes("погруз")
    || type.includes("loader")
    || type.includes("excavator");
}

export function ptoBucketRowKey(area: string, structure: string) {
  return [area, structure].map(normalizeLookupValue).join(":");
}

export function createPtoBucketRows(
  sourceRows: Array<Pick<PtoPlanRow, "area" | "structure">>,
  manualRows: PtoBucketRow[],
  areaFilter: string,
) {
  const rowsByKey = new Map<string, PtoBucketRow>();

  sourceRows.forEach((row) => {
    const area = cleanAreaName(row.area).trim();
    const structure = row.structure.trim();
    if (!area || !structure) return;

    const key = ptoBucketRowKey(area, structure);
    if (!rowsByKey.has(key)) rowsByKey.set(key, { key, area, structure, source: "auto" });
  });

  manualRows.forEach((row) => {
    if (!rowsByKey.has(row.key)) rowsByKey.set(row.key, { ...row, source: "manual" });
  });

  return Array.from(rowsByKey.values())
    .filter((row) => ptoAreaMatchesForBucket(row.area, areaFilter));
}

export function ptoBucketRowsSignature(rows: readonly PtoBucketRow[]) {
  return rows.map((row) => [row.key, row.area, row.structure, row.source ?? ""].join("\u001f")).join("\u001e");
}

export function createPtoBucketRowsModel(
  sourceRows: Array<Pick<PtoPlanRow, "area" | "structure">>,
  manualRows: PtoBucketRow[],
  areaFilter: string,
): PtoBucketRowsModel {
  const rows = createPtoBucketRows(sourceRows, manualRows, areaFilter);

  return {
    rows,
    signature: ptoBucketRowsSignature(rows),
  };
}

export function createPtoBucketColumns(vehicles: VehicleRow[]) {
  return createPtoBucketColumnsModel(vehicles).columns;
}

export function ptoBucketColumnsSourceSignature(vehicles: readonly VehicleRow[]) {
  return createPtoBucketColumnEntries(vehicles)
    .map((column) => [column.key, column.label, column.duplicate ? "duplicate" : ""].join("\u001f"))
    .sort((left, right) => left.localeCompare(right, "ru"))
    .join("\u001e");
}

export function createPtoBucketColumnsModel(vehicles: VehicleRow[]): PtoBucketColumnsModel {
  const columns = createPtoBucketColumnEntries(vehicles)
    .sort((left, right) => left.label.localeCompare(right.label, "ru"));

  return {
    columns,
    signature: columns
      .map((column) => [column.key, column.label, column.duplicate ? "duplicate" : ""].join("\u001f"))
      .join("\u001e"),
  };
}

function createPtoBucketColumnEntries(vehicles: readonly VehicleRow[]): PtoBucketColumn[] {
  const duplicateCounts = new Map<string, number>();

  vehicles.forEach((vehicle) => {
    if (vehicle.visible === false || !isLoadingEquipment(vehicle)) return;

    const duplicateKey = loadingEquipmentDuplicateKey(vehicle);
    if (!duplicateKey) return;

    duplicateCounts.set(duplicateKey, (duplicateCounts.get(duplicateKey) ?? 0) + 1);
  });

  const usedKeys = new Set<string>();
  const columnsByKey = new Map<string, PtoBucketColumn>();

  vehicles.forEach((vehicle) => {
    if (vehicle.visible === false || !isLoadingEquipment(vehicle)) return;

    const label = loadingEquipmentLabel(vehicle);
    if (!label) return;

    const duplicateKey = loadingEquipmentDuplicateKey(vehicle);
    const baseKey = loadingEquipmentColumnBaseKey(label);
    const key = duplicateKey && (duplicateCounts.get(duplicateKey) ?? 0) > 1
      ? duplicateKey
      : uniqueLoadingEquipmentColumnKey(baseKey, vehicle, usedKeys);

    if (!usedKeys.has(key)) usedKeys.add(key);
    if (!columnsByKey.has(key)) {
      columnsByKey.set(key, {
        key,
        label,
        ...(duplicateKey && (duplicateCounts.get(duplicateKey) ?? 0) > 1 ? { duplicate: true } : null),
      });
    }
  });

  return Array.from(columnsByKey.values());
}

function loadingEquipmentColumnBaseKey(label: string) {
  return normalizeLookupValue(label);
}

function loadingEquipmentDuplicateKey(vehicle: Pick<VehicleRow, "brand" | "model">) {
  const brand = normalizeEquipmentExactPart(vehicle.brand);
  const model = normalizeEquipmentExactPart(vehicle.model);
  if (!brand || !model) return "";

  return `${brand}\u001f${model}`;
}

function normalizeEquipmentExactPart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function uniqueLoadingEquipmentColumnKey(baseKey: string, vehicle: Pick<VehicleRow, "id">, usedKeys: ReadonlySet<string>) {
  if (!usedKeys.has(baseKey)) return baseKey;

  return `${baseKey}\u001f${vehicle.id}`;
}

function ptoAreaMatchesForBucket(area: string, filter: string) {
  if (filter === "\u0412\u0441\u0435 \u0443\u0447\u0430\u0441\u0442\u043a\u0438") return true;

  return filter === "Все участки" || cleanAreaName(area) === cleanAreaName(filter);
}

export function ptoBucketCellKey(rowKey: string, equipmentKey: string) {
  return `${rowKey}::${equipmentKey}`;
}

export function ptoBucketSelectionKey(cell: PtoBucketCell) {
  return ptoBucketCellKey(cell.rowKey, cell.equipmentKey);
}
