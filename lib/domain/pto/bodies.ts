import type { PtoBucketColumn, PtoBucketRow } from "./buckets";
import type { VehicleRow } from "../vehicles/types";
import { cleanAreaName, normalizeLookupValue } from "../../utils/text";

export type PtoBodyColumn = PtoBucketColumn & {
  area: string;
};

export type PtoBodyMaterialSource = {
  area: string;
  material: string;
};

export type PtoBodyColumnGroup = {
  area: string;
  span: number;
};

const bodyRowPrefix = "body";
const bodyColumnPrefix = "bodies";

export function isDumpTruck(vehicle: VehicleRow) {
  const vehicleType = normalizeLookupValue(vehicle.vehicleType);
  const equipmentType = normalizeLookupValue(vehicle.equipmentType);
  const rawVehicleType = vehicle.vehicleType.toLowerCase();
  const rawEquipmentType = vehicle.equipmentType.toLowerCase();
  const source = `${vehicleType} ${equipmentType} ${rawVehicleType} ${rawEquipmentType}`;

  return source.includes("\u0441\u0430\u043c\u043e\u0441\u0432\u0430\u043b")
    || source.includes("\u043a\u0430\u0440\u044c\u0435\u0440\u043d\u044b\u0439\u0441\u0430\u043c\u043e\u0441\u0432\u0430\u043b")
    || source.includes("\u043a\u0430\u0440\u044c\u0435\u0440\u043d\u044b\u0439 \u0441\u0430\u043c\u043e\u0441\u0432\u0430\u043b")
    || source.includes("dumptruck")
    || source.includes("tipper");
}

export function dumpTruckModelLabel(vehicle: Pick<VehicleRow, "brand" | "model" | "name">) {
  return [vehicle.brand, vehicle.model].map((value) => value.trim()).filter(Boolean).join(" ") || vehicle.name.trim();
}

export function createPtoBodyRows(vehicles: VehicleRow[]): PtoBucketRow[] {
  const rowsByKey = new Map<string, PtoBucketRow>();

  vehicles.forEach((vehicle) => {
    if (vehicle.visible === false || !isDumpTruck(vehicle)) return;

    const label = dumpTruckModelLabel(vehicle);
    if (!label) return;

    const key = `${bodyRowPrefix}:${normalizeLookupValue(label)}`;
    if (!rowsByKey.has(key)) {
      rowsByKey.set(key, {
        key,
        area: label,
        structure: "",
        source: "auto",
      });
    }
  });

  return Array.from(rowsByKey.values()).sort((left, right) => left.area.localeCompare(right.area, "ru"));
}

export function createPtoBodyColumns(
  materialSources: readonly Partial<PtoBodyMaterialSource>[],
  areaFilter: string,
): PtoBodyColumn[] {
  const columnsByKey = new Map<string, PtoBodyColumn>();

  materialSources.forEach((source) => {
    const area = typeof source.area === "string" ? cleanAreaName(source.area).trim() : "";
    const material = typeof source.material === "string" ? source.material.trim() : "";
    if (!area || !material) return;
    if (!ptoBodyAreaMatches(area, areaFilter)) return;

    const key = `${bodyColumnPrefix}:${normalizeLookupValue(area)}:${normalizeLookupValue(material)}`;
    if (!columnsByKey.has(key)) columnsByKey.set(key, { key, label: material, area });
  });

  return Array.from(columnsByKey.values()).sort((left, right) => {
    const areaCompare = left.area.localeCompare(right.area, "ru");
    if (areaCompare !== 0) return areaCompare;
    return left.label.localeCompare(right.label, "ru");
  });
}

export function createPtoBodyColumnGroups(columns: readonly PtoBodyColumn[]): PtoBodyColumnGroup[] {
  const groups: PtoBodyColumnGroup[] = [];

  columns.forEach((column) => {
    const lastGroup = groups.at(-1);
    if (lastGroup?.area === column.area) {
      lastGroup.span += 1;
      return;
    }

    groups.push({ area: column.area, span: 1 });
  });

  return groups;
}

function ptoBodyAreaMatches(area: string, filter: string) {
  if (filter === "\u0412\u0441\u0435 \u0443\u0447\u0430\u0441\u0442\u043a\u0438") return true;

  return cleanAreaName(area) === cleanAreaName(filter);
}
