import type {
  PreparedReportAggregate,
  ReportBuildPolicy,
} from "./aggregation-contracts";
import {
  selectPreparedReportAggregates,
  validatePreparedReportQuery,
  type PreparedReportQuery,
  type PreparedReportValidationIssue,
} from "./preparedReports";

export type PreparedReportReadinessIssueCode =
  | "query_policy_failed"
  | "aggregate_missing"
  | "aggregate_stale"
  | "aggregate_source_version_missing";

export type PreparedReportReadinessIssue = {
  code: PreparedReportReadinessIssueCode;
  severity: "blocker" | "warning";
  message: string;
  aggregateId?: string;
  queryIssues?: PreparedReportValidationIssue[];
};

export type PreparedReportReadinessInput = {
  policy: ReportBuildPolicy;
  query: PreparedReportQuery;
  aggregates: readonly PreparedReportAggregate[];
  currentTime: string;
  maxAggregateAgeMinutes?: number;
  requireSourceVersion?: boolean;
};

export type PreparedReportReadiness = {
  canBuild: boolean;
  canExport: boolean;
  selectedAggregateCount: number;
  selectedAggregateIds: string[];
  issues: PreparedReportReadinessIssue[];
};

const defaultMaxAggregateAgeMinutes = 24 * 60;

export function createPreparedReportReadiness(input: PreparedReportReadinessInput): PreparedReportReadiness {
  const queryIssues = validatePreparedReportQuery(input.policy, input.query);
  const selectedAggregates = queryIssues.length === 0
    ? selectPreparedReportAggregates(input.aggregates, input.query)
    : [];
  const issues: PreparedReportReadinessIssue[] = [];

  if (queryIssues.length > 0) {
    issues.push({
      code: "query_policy_failed",
      severity: "blocker",
      message: "Prepared report query does not satisfy build policy.",
      queryIssues,
    });
  }

  if (queryIssues.length === 0 && selectedAggregates.length === 0) {
    issues.push({
      code: "aggregate_missing",
      severity: "blocker",
      message: "Prepared aggregates are missing for the selected report period and filters.",
    });
  }

  issues.push(...createAggregateFreshnessIssues(
    selectedAggregates,
    input.currentTime,
    input.maxAggregateAgeMinutes ?? defaultMaxAggregateAgeMinutes,
  ));

  if (input.requireSourceVersion) {
    issues.push(...selectedAggregates.flatMap((aggregate) => (
      aggregate.sourceVersion?.trim()
        ? []
        : [{
            code: "aggregate_source_version_missing" as const,
            severity: "blocker" as const,
            aggregateId: aggregate.id,
            message: "Prepared aggregate must reference a source version before export.",
          }]
    )));
  }

  return {
    canBuild: queryIssues.length === 0 && selectedAggregates.length > 0,
    canExport: issues.every((issue) => issue.severity !== "blocker"),
    selectedAggregateCount: selectedAggregates.length,
    selectedAggregateIds: selectedAggregates.map((aggregate) => aggregate.id),
    issues,
  };
}

function createAggregateFreshnessIssues(
  aggregates: readonly PreparedReportAggregate[],
  currentTime: string,
  maxAggregateAgeMinutes: number,
): PreparedReportReadinessIssue[] {
  const currentTimestamp = Date.parse(currentTime);
  const maxAgeMilliseconds = maxAggregateAgeMinutes * 60 * 1000;

  return aggregates.flatMap((aggregate) => {
    const preparedTimestamp = Date.parse(aggregate.preparedAt);
    if (
      !Number.isFinite(currentTimestamp)
      || !Number.isFinite(preparedTimestamp)
      || currentTimestamp - preparedTimestamp > maxAgeMilliseconds
    ) {
      return [{
        code: "aggregate_stale" as const,
        severity: "blocker" as const,
        aggregateId: aggregate.id,
        message: "Prepared aggregate is stale and must be refreshed before report export.",
      }];
    }

    return [];
  });
}
