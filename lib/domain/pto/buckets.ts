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
};

export type PtoBucketColumnsModel = {
  columns: PtoBucketColumn[];
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

export function createPtoBucketColumns(vehicles: VehicleRow[]) {
  return createPtoBucketColumnsModel(vehicles).columns;
}

export function createPtoBucketColumnsModel(vehicles: VehicleRow[]): PtoBucketColumnsModel {
  const columnsByKey = new Map<string, PtoBucketColumn>();

  vehicles.forEach((vehicle) => {
    if (vehicle.visible === false || !isLoadingEquipment(vehicle)) return;

    const label = loadingEquipmentLabel(vehicle);
    if (!label) return;

    const key = normalizeLookupValue(label);
    if (!columnsByKey.has(key)) columnsByKey.set(key, { key, label });
  });

  const columns = Array.from(columnsByKey.values())
    .sort((left, right) => left.label.localeCompare(right.label, "ru"));

  return {
    columns,
    signature: columns.map((column) => [column.key, column.label].join("\u001f")).join("\u001e"),
  };
}

function ptoAreaMatchesForBucket(area: string, filter: string) {
  return filter === "Все участки" || cleanAreaName(area) === cleanAreaName(filter);
}

export function ptoBucketCellKey(rowKey: string, equipmentKey: string) {
  return `${rowKey}::${equipmentKey}`;
}

export function ptoBucketSelectionKey(cell: PtoBucketCell) {
  return ptoBucketCellKey(cell.rowKey, cell.equipmentKey);
}
