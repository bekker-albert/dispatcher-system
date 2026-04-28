import { cleanAreaName } from "../../utils/text";
import type { PtoDateTableKey } from "./date-table";

export type PtoDateExcelMeta = {
  table: PtoDateTableKey;
  label: string;
  slug: string;
  section: string;
};

export function ptoDateTableMeta(tab: string): PtoDateExcelMeta {
  if (tab === "oper") {
    return { table: "oper", label: "Оперучет", slug: "operuchet", section: "ПТО: Оперучет" };
  }

  if (tab === "survey") {
    return { table: "survey", label: "Замер", slug: "zamer", section: "ПТО: Замер" };
  }

  return { table: "plan", label: "План", slug: "plan", section: "ПТО: План" };
}

export function ptoDateExportFileName(meta: Pick<PtoDateExcelMeta, "slug">, year: string, areaFilter: string) {
  const areaPart = areaFilter === "Все участки" ? "vse-uchastki" : cleanAreaName(areaFilter);
  const safeAreaPart = areaPart.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-") || meta.slug;

  return `pto-${meta.slug}-${year}-${safeAreaPart}.xlsx`;
}
