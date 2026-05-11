import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type {
  PreparedReportAggregate,
  ReportAggregationGrain,
  ReportBuildPolicy,
  ReportExportFormat,
} from "./aggregation-contracts";

export type PreparedReportQuery = {
  workspaceId?: DispatchWorkspaceId;
  periodStart: string;
  periodEnd: string;
  grain: ReportAggregationGrain;
  filters: Record<string, string | undefined>;
};

export type PreparedReportValidationCode =
  | "prepared_aggregates_required"
  | "period_required"
  | "period_invalid"
  | "date_range_too_large"
  | "required_filter_missing"
  | "grain_not_allowed";

export type PreparedReportValidationIssue = {
  code: PreparedReportValidationCode;
  message: string;
  field?: string;
};

export type PreparedReportMetricSummary = {
  metricKey: string;
  unit?: string;
  value: number;
};

export type ReportExportCreateCommand = {
  entityType: "report_export_request";
  reportKey: string;
  requestedBy: string;
  format: ReportExportFormat;
  filters: Record<string, string>;
  status: "queued";
};

export type ReportExportCommandResult =
  | { ok: true; command: ReportExportCreateCommand }
  | {
      ok: false;
      rejection: {
        code: "query_not_ready";
        message: string;
        issues: PreparedReportValidationIssue[];
      };
    };

const millisecondsPerDay = 24 * 60 * 60 * 1000;

const parseIsoDate = (value: string): number => Date.parse(`${value}T00:00:00.000Z`);

export const getInclusiveDateRangeDays = (
  periodStart: string,
  periodEnd: string,
): number => {
  const start = parseIsoDate(periodStart);
  const end = parseIsoDate(periodEnd);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return -1;
  }

  return Math.floor((end - start) / millisecondsPerDay) + 1;
};

export const validatePreparedReportQuery = (
  policy: ReportBuildPolicy,
  query: PreparedReportQuery,
): PreparedReportValidationIssue[] => {
  const issues: PreparedReportValidationIssue[] = [];

  if (!policy.usesPreparedAggregates) {
    issues.push({
      code: "prepared_aggregates_required",
      message: "Report must use prepared aggregates instead of client-side recalculation.",
    });
  }

  if (!query.periodStart || !query.periodEnd) {
    issues.push({
      code: "period_required",
      message: "Report period start and end are required.",
      field: "period",
    });
  } else {
    const rangeDays = getInclusiveDateRangeDays(query.periodStart, query.periodEnd);

    if (rangeDays < 1) {
      issues.push({
        code: "period_invalid",
        message: "Report period is invalid.",
        field: "period",
      });
    } else if (rangeDays > policy.maxDateRangeDays) {
      issues.push({
        code: "date_range_too_large",
        message: "Report period exceeds allowed date range.",
        field: "period",
      });
    }
  }

  if (!policy.allowedGrains.includes(query.grain)) {
    issues.push({
      code: "grain_not_allowed",
      message: "Report grain is not allowed by policy.",
      field: "grain",
    });
  }

  for (const requiredFilter of policy.requiredFilters) {
    if (requiredFilter === "date") {
      continue;
    }

    if (!query.filters[requiredFilter]?.trim()) {
      issues.push({
        code: "required_filter_missing",
        message: "Required report filter is missing.",
        field: requiredFilter,
      });
    }
  }

  return issues;
};

export const selectPreparedReportAggregates = (
  aggregates: readonly PreparedReportAggregate[],
  query: PreparedReportQuery,
): PreparedReportAggregate[] => aggregates.filter((aggregate) => {
  if (query.workspaceId && aggregate.workspaceId !== query.workspaceId) {
    return false;
  }

  if (aggregate.grain !== query.grain) {
    return false;
  }

  if (aggregate.periodStart < query.periodStart || aggregate.periodEnd > query.periodEnd) {
    return false;
  }

  return Object.entries(query.filters).every(([key, value]) => (
    !value?.trim() || aggregate.dimensions[key] === value
  ));
});

export const summarizePreparedReportAggregates = (
  aggregates: readonly PreparedReportAggregate[],
): PreparedReportMetricSummary[] => {
  const summaryByKey = new Map<string, PreparedReportMetricSummary>();

  for (const aggregate of aggregates) {
    const key = `${aggregate.metricKey}|${aggregate.unit ?? ""}`;
    const current = summaryByKey.get(key);

    if (current) {
      current.value += aggregate.value;
      continue;
    }

    summaryByKey.set(key, {
      metricKey: aggregate.metricKey,
      unit: aggregate.unit,
      value: aggregate.value,
    });
  }

  return [...summaryByKey.values()].sort((left, right) => (
    left.metricKey.localeCompare(right.metricKey)
  ));
};

export const createReportExportRequestCommand = (
  policy: ReportBuildPolicy,
  query: PreparedReportQuery,
  requestedBy: string,
  format: ReportExportFormat,
): ReportExportCommandResult => {
  const issues = validatePreparedReportQuery(policy, query);

  if (issues.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "query_not_ready",
        message: "Report export query does not satisfy build policy.",
        issues,
      },
    };
  }

  return {
    ok: true,
    command: {
      entityType: "report_export_request",
      reportKey: policy.reportKey,
      requestedBy,
      format,
      filters: {
        ...Object.fromEntries(
          Object.entries(query.filters).flatMap(([key, value]) => (
            value?.trim() ? [[key, value]] : []
          )),
        ),
        periodStart: query.periodStart,
        periodEnd: query.periodEnd,
        grain: query.grain,
      },
      status: "queued",
    },
  };
};
