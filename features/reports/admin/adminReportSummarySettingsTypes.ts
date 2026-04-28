import type { ReportSummaryRowConfig } from "@/lib/domain/reports/types";

export type SummaryUpdateField = Exclude<keyof ReportSummaryRowConfig, "id" | "rowKeys">;
