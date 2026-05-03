import type { PtoBucketColumn, PtoBucketRow } from "./buckets";
import { ptoBucketRowKey } from "./buckets";
import type { PtoPlanRow } from "./date-table";
import { cleanAreaName } from "../../utils/text";

export type PtoPerformanceRow = PtoBucketRow & {
  unit: string;
};

export type PtoPerformanceColumn = PtoBucketColumn & {
  readOnly?: boolean;
};

export const ptoPerformanceEditableColumns: PtoPerformanceColumn[] = [
  { key: "performance:specific-weight", label: "удельный вес" },
  { key: "performance:loosening-factor", label: "коэфициент разрыхления" },
  { key: "performance:bucket-fill-factor", label: "коэфициент наполнения ковша" },
  { key: "performance:preparation-factor", label: "коэфициент подготовительных работ" },
  { key: "performance:haul-distance", label: "плечо" },
  { key: "performance:loading-time", label: "время погрузки (мин)" },
  { key: "performance:unloading-time", label: "время разгрузки (мин)" },
  { key: "performance:movement-irregularity-factor", label: "коэфициент неравномерности движения" },
  { key: "performance:average-speed", label: "средняя скорость" },
  { key: "performance:truck-use-factor", label: "коэфициент использования самосвала" },
  { key: "performance:ktg", label: "КТГ" },
  { key: "performance:working-time", label: "Рабочее время (12 часов смена - Пересменка - Заправка - БВР/ДСК)" },
  { key: "performance:shift-change", label: "Пересменка" },
  { key: "performance:fueling", label: "Заправка" },
  { key: "performance:bvr-dsk", label: "БВР/ДСК" },
];

export const ptoPerformanceCalculatedColumn: PtoPerformanceColumn = {
  key: "performance:obrkio",
  label: "ОбрКИО",
  readOnly: true,
};

export function createPtoPerformanceRows(sourceRows: Array<Pick<PtoPlanRow, "area" | "structure" | "unit">>, areaFilter: string): PtoPerformanceRow[] {
  const rowsByKey = new Map<string, PtoPerformanceRow>();

  sourceRows.forEach((row) => {
    const area = cleanAreaName(row.area).trim();
    const structure = row.structure.trim();
    if (!area || !structure) return;
    if (!ptoPerformanceAreaMatches(area, areaFilter)) return;

    const key = `performance:${ptoBucketRowKey(area, structure)}`;
    if (!rowsByKey.has(key)) {
      rowsByKey.set(key, {
        key,
        area,
        structure,
        unit: row.unit,
        source: "auto",
      });
    }
  });

  return Array.from(rowsByKey.values()).sort((left, right) => {
    const areaCompare = left.area.localeCompare(right.area, "ru");
    if (areaCompare !== 0) return areaCompare;
    return left.structure.localeCompare(right.structure, "ru");
  });
}

export function calculatePtoObrKio(workingTime: number | undefined) {
  if (typeof workingTime !== "number" || !Number.isFinite(workingTime)) return undefined;
  return ((workingTime * 24) - 1) / 12;
}

function ptoPerformanceAreaMatches(area: string, filter: string) {
  if (filter === "Все участки") return true;

  return cleanAreaName(area) === cleanAreaName(filter);
}
