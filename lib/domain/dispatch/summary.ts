import { parseDecimalInput } from "../../utils/numbers";
import { normalizeLookupValue } from "../../utils/text";
import { buildVehicleDisplayName } from "../vehicles/import-export";
import type { VehicleRow } from "../vehicles/types";

export type DispatchShift = "daily" | "night" | "day";

export type DispatchSummaryRow = {
  id: string;
  date: string;
  shift: DispatchShift;
  vehicleId: number | null;
  vehicleName: string;
  area: string;
  location: string;
  workType: string;
  excavator: string;
  planVolume: number;
  factVolume: number;
  workHours: number;
  rentHours: number;
  repairHours: number;
  downtimeHours: number;
  trips: number;
  reason: string;
  comment: string;
};

export type DispatchSummaryTextField =
  | "vehicleName"
  | "area"
  | "location"
  | "workType"
  | "excavator"
  | "reason"
  | "comment";

export type DispatchSummaryNumberField =
  | "planVolume"
  | "factVolume"
  | "workHours"
  | "rentHours"
  | "repairHours"
  | "downtimeHours"
  | "trips";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatHours(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function dispatchShiftFromTab(tab: string): DispatchShift {
  if (tab === "night" || tab === "day") return tab;
  return "daily";
}

export function dispatchShiftLabel(shift: DispatchShift) {
  if (shift === "night") return "Ночная смена";
  if (shift === "day") return "Дневная смена";
  return "Сутки";
}

export function createDispatchSummaryRow(vehicle: VehicleRow | undefined, date: string, shift: DispatchShift, id?: string): DispatchSummaryRow {
  const vehicleName = vehicle ? buildVehicleDisplayName(vehicle) : "";
  const workHours = vehicle?.work ?? 0;
  const trips = vehicle?.trips ?? 0;
  const planVolume = workHours > 0 ? Math.round(workHours * 100) : 0;
  const factVolume = trips > 0 ? Math.round(trips * 45) : 0;

  return {
    id: id ?? `dispatch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    shift,
    vehicleId: vehicle?.id ?? null,
    vehicleName,
    area: vehicle?.area ?? "",
    location: vehicle?.location ?? "",
    workType: vehicle?.workType ?? "",
    excavator: vehicle?.excavator ?? "",
    planVolume,
    factVolume,
    workHours,
    rentHours: vehicle?.rent ?? 0,
    repairHours: vehicle?.repair ?? 0,
    downtimeHours: vehicle?.downtime ?? 0,
    trips,
    reason: "",
    comment: "",
  };
}

export function createDefaultDispatchSummaryRows(vehicles: VehicleRow[], date: string) {
  return vehicles
    .filter((vehicle) => vehicle.visible !== false)
    .slice(0, 5)
    .map((vehicle, index) => createDispatchSummaryRow(
      vehicle,
      date,
      index % 2 === 0 ? "night" : "day",
      `dispatch-seed-${date}-${vehicle.id}-${index}`,
    ));
}

export function normalizeDispatchSummaryRow(row: unknown, index: number, fallbackDate: string): DispatchSummaryRow | null {
  if (!isRecord(row)) return null;

  const shift = row.shift === "night" || row.shift === "day" || row.shift === "daily" ? row.shift : "daily";
  const vehicleId = typeof row.vehicleId === "number" && Number.isFinite(row.vehicleId) ? row.vehicleId : null;
  const numberValue = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") return parseDecimalInput(value) ?? 0;
    return 0;
  };
  const stringValue = (value: unknown) => (typeof value === "string" ? value : "");

  return {
    id: stringValue(row.id) || `dispatch-loaded-${index}`,
    date: stringValue(row.date) || fallbackDate,
    shift,
    vehicleId,
    vehicleName: stringValue(row.vehicleName),
    area: stringValue(row.area),
    location: stringValue(row.location),
    workType: stringValue(row.workType),
    excavator: stringValue(row.excavator),
    planVolume: numberValue(row.planVolume),
    factVolume: numberValue(row.factVolume),
    workHours: numberValue(row.workHours),
    rentHours: numberValue(row.rentHours),
    repairHours: numberValue(row.repairHours),
    downtimeHours: numberValue(row.downtimeHours),
    trips: numberValue(row.trips),
    reason: stringValue(row.reason),
    comment: stringValue(row.comment),
  };
}

export function normalizeDispatchSummaryRows(value: unknown, fallbackDate: string) {
  if (!Array.isArray(value)) return null;
  return value
    .map((row, index) => normalizeDispatchSummaryRow(row, index, fallbackDate))
    .filter((row): row is DispatchSummaryRow => row !== null);
}

function dispatchConsolidationKey(row: DispatchSummaryRow) {
  return [
    row.vehicleId ? `vehicle-${row.vehicleId}` : row.vehicleName,
    row.area,
    row.location,
    row.workType,
    row.excavator,
  ].map(normalizeLookupValue).join(":");
}

function mergeDispatchText(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).join("; ");
}

export function consolidateDispatchSummaryRows(rows: DispatchSummaryRow[], date: string) {
  const groupedRows = new Map<string, { row: DispatchSummaryRow; reasons: string[]; comments: string[] }>();

  rows
    .filter((row) => row.date === date && (row.shift === "night" || row.shift === "day"))
    .forEach((row) => {
      const key = dispatchConsolidationKey(row) || row.id;
      const current = groupedRows.get(key);

      if (!current) {
        groupedRows.set(key, {
          row: {
            ...row,
            id: `dispatch-daily-${date}-${key}`,
            shift: "daily",
            planVolume: row.planVolume,
            factVolume: row.factVolume,
            workHours: row.workHours,
            rentHours: row.rentHours,
            repairHours: row.repairHours,
            downtimeHours: row.downtimeHours,
            trips: row.trips,
          },
          reasons: row.reason ? [row.reason] : [],
          comments: row.comment ? [row.comment] : [],
        });
        return;
      }

      current.row.planVolume += row.planVolume;
      current.row.factVolume += row.factVolume;
      current.row.workHours += row.workHours;
      current.row.rentHours += row.rentHours;
      current.row.repairHours += row.repairHours;
      current.row.downtimeHours += row.downtimeHours;
      current.row.trips += row.trips;
      if (row.reason.trim()) current.reasons.push(row.reason);
      if (row.comment.trim()) current.comments.push(row.comment);
    });

  return Array.from(groupedRows.values())
    .map(({ row, reasons, comments }) => ({
      ...row,
      reason: mergeDispatchText(reasons),
      comment: mergeDispatchText(comments),
    }))
    .sort((left, right) => (
      left.area.localeCompare(right.area, "ru")
      || left.workType.localeCompare(right.workType, "ru")
      || left.vehicleName.localeCompare(right.vehicleName, "ru")
    ));
}

export function dispatchProductivity(row: Pick<DispatchSummaryRow, "factVolume" | "workHours">) {
  return row.workHours > 0 ? row.factVolume / row.workHours : 0;
}

export function dispatchNumberInputValue(value: number) {
  return Number.isFinite(value) && value !== 0 ? String(value) : "";
}

export function buildDispatchAiSuggestion(rows: DispatchSummaryRow[]) {
  const repairHours = rows.reduce((sum, row) => sum + row.repairHours, 0);
  const downtimeHours = rows.reduce((sum, row) => sum + row.downtimeHours, 0);
  const lowFactRows = rows.filter((row) => row.planVolume > 0 && row.factVolume < row.planVolume);
  const parts: string[] = [];

  if (repairHours > 0) parts.push(`ремонт техники ${formatHours(repairHours)} ч.`);
  if (downtimeHours > 0) parts.push(`простой ${formatHours(downtimeHours)} ч.`);
  if (lowFactRows.length > 0) parts.push(`отставание по ${lowFactRows.length} строкам`);

  return parts.length
    ? `Предварительно: ${parts.join("; ")}.`
    : "Явной причины невыполнения не видно: план выполнен или не заполнены плановые показатели.";
}
