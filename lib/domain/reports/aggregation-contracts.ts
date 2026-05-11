import type { VersionedEntityReference } from "@/lib/domain/editing/patchEditing";
import type { RequiredFilterKey } from "@/lib/domain/data-access/pagination";
import type { DispatchWorkspaceId } from "@/lib/domain/workspaces/workspaces";

export type ReportAggregationGrain = "shift" | "day" | "watch" | "fuel_period" | "month" | "year";
export type ReportExportFormat = "xlsx" | "pdf" | "csv";
export type ReportExportStatus = "queued" | "building" | "ready" | "failed" | "expired";

export type PreparedReportAggregate = VersionedEntityReference & {
  workspaceId: DispatchWorkspaceId;
  metricKey: string;
  grain: ReportAggregationGrain;
  periodStart: string;
  periodEnd: string;
  dimensions: Record<string, string>;
  value: number;
  unit?: string;
  preparedAt: string;
  sourceVersion?: string;
};

export type ReportBuildPolicy = {
  reportKey: string;
  usesPreparedAggregates: boolean;
  maxDateRangeDays: number;
  requiredFilters: RequiredFilterKey[];
  allowedGrains: ReportAggregationGrain[];
};

export type ReportExportRequest = VersionedEntityReference & {
  reportKey: string;
  requestedBy: string;
  format: ReportExportFormat;
  filters: Record<string, string>;
  status: ReportExportStatus;
  fileId?: string;
  errorMessage?: string;
};

export const defaultDispatchReportBuildPolicy: ReportBuildPolicy = {
  reportKey: "dispatch-service-control",
  usesPreparedAggregates: true,
  maxDateRangeDays: 31,
  requiredFilters: ["date", "section_id", "status"],
  allowedGrains: ["shift", "day", "watch", "fuel_period", "month", "year"],
};
