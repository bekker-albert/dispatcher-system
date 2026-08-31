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

export type PtoBodyReferenceData = {
  areas: string[];
  materialSources: PtoBodyMaterialSource[];
};

const bodyRowPrefix = "body";
const bodyColumnPrefix = "bodies";
const bodyAreaMetadataPrefix = "__pto_body_area__:";
const bodyMaterialMetadataPrefix = "__pto_body_material__:";

export const defaultPtoBodyMaterialSources: readonly PtoBodyMaterialSource[] = [
  { area: "Аксу", material: "Руда(Котенко)" },
  { area: "Аксу", material: "Порода(Котенко)" },
  { area: "Аксу", material: "Руда(Маныбай)" },
  { area: "Аксу", material: "Порода(Маныбай)" },
  { area: "Акбакай", material: "Руда(Карьер)" },
  { area: "Акбакай", material: "Вскрыша(Карьер)" },
  { area: "Акбакай", material: "Скальник(Негабариты)" },
  { area: "Акбакай", material: "Руда(Шахта)" },
  { area: "Акбакай", material: "Порода(Шахта)" },
  { area: "Жолымбет", material: "Руда(Карьер №6)" },
  { area: "Жолымбет", material: "Порода(Карьер №6)" },
  { area: "Жолымбет", material: "Руда(Склады)" },
  { area: "Жолымбет", material: "Порода(Склады)" },
  { area: "Жолымбет", material: "Скальный(Рыхлый)" },
  { area: "Жолымбет", material: "Скальник(Негабарит)" },
  { area: "Жолымбет", material: "Порода(Зона)" },
  { area: "Жолымбет", material: "ПРС" },
  { area: "Долинное", material: "Руда(КарьерД)" },
  { area: "Долинное", material: "Порода(КарьерД)" },
  { area: "Долинное", material: "Дробленная руда" },
  { area: "Долинное", material: "Недробленная руда" },
  { area: "Долинное", material: "Скальный(Негабарит)" },
  { area: "Пустынное", material: "Скальник(Рыхлый)" },
  { area: "Пустынное", material: "Скальник негабаритный" },
  { area: "Пустынное", material: "Суглинок(Стройка)" },
  { area: "Пустынное", material: "Суглинок(УКВ)" },
  { area: "Пустынное", material: "ПРС3" },
  { area: "Уч_Коксай", material: "Суглинок" },
  { area: "Уч_Коксай", material: "Грунт(Галька)" },
  { area: "Уч_Коксай", material: "ПРC" },
  { area: "Уч_Бактай", material: "Скальник(Рыхлый)." },
  { area: "Уч_Бактай", material: "Порода(КарьерБ)" },
  { area: "Уч_Бактай", material: "Руда(КарьерБ)" },
  { area: "Уч_Бактай", material: "ПРС2" },
  { area: "Разное", material: "Прочее2" },
  { area: "Разное", material: "Суглинок(Карьер)" },
  { area: "Разное", material: "ТМО" },
  { area: "Уч.Каражыра", material: "Порода(вскрыша)" },
];

const defaultPtoBodyTechniqueLabels = [
  "Volvo FMX_440_10х4",
  "Volvo FMX_480_10х4",
  "Volvo FMX_520_10х4",
  "Тонар 9590(100тн)",
  "Тонар 9590(40тн)",
  "Тонар 9590(60тн)",
  "Caterpillar 745",
  "Volvo A40D",
  "Shacman 40",
  "Shacman 25",
  "Камаз 6520-041",
  "HOWO Sinotruk",
  "БелАЗ 7547",
  "БелАЗ 7555B",
  "LGMG MT86H",
  "XCMG XGA5902D3T",
  "XCMG XGA510D3T",
  "XCMG XG105",
  "Howo A7ZZ3327N3847P",
  "Howo ZZ3407S3867E",
  "Howo ZZ5707V38440CJ",
  "Howo ZZ5707V384L",
  "Howo ZZ3317V306GE1",
  "Howo T5G ZZ3317V386GE1",
  "Howo T5G ZZ3317V386GE2",
  "Howo ZZ3407S3867E.",
  "Develon DA45",
  "Doosan DA40",
  "Doosan DA45",
  "Howo 70тн",
  "Howo ZZ3251M3841C1",
  "Howo ZZ3259N434PB3",
  "Howo ZZ3327S3847E",
  "Howo ZZ5707V3840CJ",
  "Shacman SX32586R384",
  "XCMG XG90D",
  "XCMG XD90D",
  "Bell B50D",
  "Komatsu НМ400",
  "Tonly TL875B",
  "LGMG MT106H",
  "LGMG MT85",
  "Hitachi EH1700-3",
  "Howo 25",
  "Howo ZZ3317V3867E1C",
] as const;

export function isDumpTruck(vehicle: VehicleRow) {
  const vehicleType = normalizeLookupValue(vehicle.vehicleType);
  const equipmentType = normalizeLookupValue(vehicle.equipmentType);
  const rawVehicleType = vehicle.vehicleType.toLowerCase();
  const rawEquipmentType = vehicle.equipmentType.toLowerCase();
  const source = `${vehicleType} ${equipmentType} ${rawVehicleType} ${rawEquipmentType}`;

  return source.includes("самосвал")
    || source.includes("карьерныйсамосвал")
    || source.includes("карьерный самосвал")
    || source.includes("dumptruck")
    || source.includes("tipper");
}

export function dumpTruckModelLabel(vehicle: Pick<VehicleRow, "brand" | "model" | "name">) {
  return [vehicle.brand, vehicle.model].map((value) => value.trim()).filter(Boolean).join(" ") || vehicle.name.trim();
}

function createBodyReferenceRow(label: string): PtoBucketRow {
  return {
    key: `${bodyRowPrefix}:${normalizeLookupValue(label)}`,
    area: label,
    structure: "",
    source: "auto",
  };
}

export function createPtoBodyRows(vehicles: VehicleRow[]): PtoBucketRow[] {
  const rowsByKey = new Map<string, PtoBucketRow>();

  defaultPtoBodyTechniqueLabels.forEach((label) => {
    const row = createBodyReferenceRow(label);
    rowsByKey.set(row.key, row);
  });

  const additionalRows: PtoBucketRow[] = [];
  vehicles.forEach((vehicle) => {
    if (vehicle.visible === false || !isDumpTruck(vehicle)) return;

    const label = dumpTruckModelLabel(vehicle);
    if (!label) return;

    const row = createBodyReferenceRow(label);
    if (!rowsByKey.has(row.key)) additionalRows.push(row);
  });

  additionalRows
    .sort((left, right) => left.area.localeCompare(right.area, "ru"))
    .forEach((row) => rowsByKey.set(row.key, row));

  return Array.from(rowsByKey.values());
}

function normalizedBodyArea(area: string) {
  return cleanAreaName(area).trim();
}

function bodyAreaKey(area: string) {
  return normalizeLookupValue(normalizedBodyArea(area));
}

function bodyMaterialKey(area: string, material: string) {
  return `${bodyAreaKey(area)}:${normalizeLookupValue(material)}`;
}

export function ptoBodyAreaMetadataKey(area: string) {
  return `${bodyAreaMetadataPrefix}${bodyAreaKey(area)}`;
}

export function ptoBodyMaterialMetadataKey(area: string, material: string) {
  return `${bodyMaterialMetadataPrefix}${bodyMaterialKey(area, material)}`;
}

export function addPtoBodyAreaMetadata(
  current: Record<string, string>,
  area: string,
): Record<string, string> {
  const normalizedArea = normalizedBodyArea(area);
  if (!normalizedArea) return current;

  return {
    ...current,
    [ptoBodyAreaMetadataKey(normalizedArea)]: normalizedArea,
  };
}

export function addPtoBodyMaterialMetadata(
  current: Record<string, string>,
  area: string,
  material: string,
): Record<string, string> {
  const normalizedArea = normalizedBodyArea(area);
  const normalizedMaterial = material.trim();
  if (!normalizedArea || !normalizedMaterial) return current;

  return {
    ...current,
    [ptoBodyAreaMetadataKey(normalizedArea)]: normalizedArea,
    [ptoBodyMaterialMetadataKey(normalizedArea, normalizedMaterial)]: JSON.stringify([normalizedArea, normalizedMaterial]),
  };
}

function parsePtoBodyMaterialMetadata(value: string): PtoBodyMaterialSource | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [area, material] = parsed;
    if (typeof area !== "string" || typeof material !== "string") return null;
    const normalizedArea = normalizedBodyArea(area);
    const normalizedMaterial = material.trim();
    if (!normalizedArea || !normalizedMaterial) return null;
    return { area: normalizedArea, material: normalizedMaterial };
  } catch {
    return null;
  }
}

export function resolvePtoBodyReferenceData(headerLabels: Record<string, string>): PtoBodyReferenceData {
  const areasByKey = new Map<string, string>();
  const materialsByKey = new Map<string, PtoBodyMaterialSource>();

  defaultPtoBodyMaterialSources.forEach((source) => {
    const area = normalizedBodyArea(source.area);
    const material = source.material.trim();
    if (!area || !material) return;
    areasByKey.set(bodyAreaKey(area), area);
    materialsByKey.set(bodyMaterialKey(area, material), { area, material });
  });

  Object.entries(headerLabels).forEach(([key, value]) => {
    if (key.startsWith(bodyAreaMetadataPrefix)) {
      const area = normalizedBodyArea(value);
      if (area) areasByKey.set(bodyAreaKey(area), area);
      return;
    }

    if (!key.startsWith(bodyMaterialMetadataPrefix)) return;
    const source = parsePtoBodyMaterialMetadata(value);
    if (!source) return;
    areasByKey.set(bodyAreaKey(source.area), source.area);
    materialsByKey.set(bodyMaterialKey(source.area, source.material), source);
  });

  return {
    areas: Array.from(areasByKey.values()),
    materialSources: Array.from(materialsByKey.values()),
  };
}

export function createPtoBodyAreaTabs(areas: readonly string[]) {
  return ["Все участки", ...areas];
}

export function ptoBodyAreaExists(areas: readonly string[], area: string) {
  const key = bodyAreaKey(area);
  return Boolean(key && areas.some((item) => bodyAreaKey(item) === key));
}

export function ptoBodyMaterialExists(
  sources: readonly PtoBodyMaterialSource[],
  area: string,
  material: string,
) {
  const key = bodyMaterialKey(area, material);
  return Boolean(key && sources.some((source) => bodyMaterialKey(source.area, source.material) === key));
}

export function createPtoBodyColumns(
  materialSources: readonly Partial<PtoBodyMaterialSource>[],
  areaFilter: string,
): PtoBodyColumn[] {
  const columnsByKey = new Map<string, PtoBodyColumn>();

  materialSources.forEach((source) => {
    const area = typeof source.area === "string" ? normalizedBodyArea(source.area) : "";
    const material = typeof source.material === "string" ? source.material.trim() : "";
    if (!area || !material) return;
    if (!ptoBodyAreaMatches(area, areaFilter)) return;

    const key = `${bodyColumnPrefix}:${normalizeLookupValue(area)}:${normalizeLookupValue(material)}`;
    if (!columnsByKey.has(key)) columnsByKey.set(key, { key, label: material, area });
  });

  return Array.from(columnsByKey.values());
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
  if (filter === "Все участки") return true;

  return bodyAreaKey(area) === bodyAreaKey(filter);
}
