import type { ReactNode } from "react";
import { reportColumnHeaderFallbacks, reportColumnKeys, type ReportColumnKey } from "@/lib/domain/reports/columns";

export type ReportHeaderGroupKey = "day-group" | "month-group" | "year-group" | "annual-group";
export type ReportHeaderKey = ReportColumnKey | ReportHeaderGroupKey;

const REPORT_HEADER_GROUP_FALLBACKS: Record<ReportHeaderGroupKey, string> = {
  "day-group": "Текущая дата",
  "month-group": "С начала месяца",
  "year-group": "С начала года",
  "annual-group": "Годовой план",
};

export const REPORT_HEADER_KEYS = [
  ...reportColumnKeys,
  "day-group",
  "month-group",
  "year-group",
  "annual-group",
] as const satisfies readonly ReportHeaderKey[];

const REPORT_HEADER_FALLBACKS: Record<ReportHeaderKey, string> = {
  ...reportColumnHeaderFallbacks,
  ...REPORT_HEADER_GROUP_FALLBACKS,
};

export type ReportHeaderView = {
  printLabel: string;
  text: ReactNode;
};

export function createReportHeaderViews(
  reportHeaderLabel: (key: string, fallback: string) => string,
  renderReportHeaderText: (key: string, fallback: string) => ReactNode,
) {
  return REPORT_HEADER_KEYS.reduce<Record<ReportHeaderKey, ReportHeaderView>>((headers, key) => {
    const fallback = REPORT_HEADER_FALLBACKS[key];
    headers[key] = {
      printLabel: reportHeaderLabel(key, fallback),
      text: renderReportHeaderText(key, fallback),
    };
    return headers;
  }, {} as Record<ReportHeaderKey, ReportHeaderView>);
}
