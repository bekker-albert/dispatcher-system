import { isRecord } from "../../utils/normalizers";
import { cleanAreaName, normalizeLookupValue } from "../../utils/text";
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

export function ptoBucketCellKey(rowKey: string, equipmentKey: string) {
  return `${rowKey}::${equipmentKey}`;
}

export function ptoBucketSelectionKey(cell: PtoBucketCell) {
  return ptoBucketCellKey(cell.rowKey, cell.equipmentKey);
}
