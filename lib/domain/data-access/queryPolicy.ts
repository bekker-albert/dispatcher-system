import type { DispatchPageSize, RequiredFilterKey, ServerPageQuery, ServerSort } from "./pagination";
import { clampOffset, dispatchPageSizeOptions, normalizePageSize } from "./pagination";

export type DataAccessQueryPolicy = {
  id: string;
  requiredFilters: RequiredFilterKey[];
  maxDateRangeDays?: number;
  maxPageSize?: DispatchPageSize;
  allowSearchWithoutFilters: boolean;
  maxSearchLength?: number;
};

export type DataAccessQueryValidationCode =
  | "page_size_invalid"
  | "required_filter_missing"
  | "date_range_required"
  | "date_range_invalid"
  | "date_range_too_large"
  | "search_requires_filters"
  | "search_too_long";

export type DataAccessQueryValidationIssue = {
  code: DataAccessQueryValidationCode;
  message: string;
  field?: string;
};

export type ServerPageQueryDraft = {
  pageSize?: unknown;
  cursor?: string;
  offset?: unknown;
  filters?: Record<string, unknown>;
  sort?: ServerSort;
  search?: string;
};

export const defaultHeavyTableQueryPolicy: DataAccessQueryPolicy = {
  id: "heavy-table-default",
  requiredFilters: ["date", "section_id", "status"],
  maxDateRangeDays: 31,
  maxPageSize: 100,
  allowSearchWithoutFilters: false,
  maxSearchLength: 120,
};

export const shiftSectionStatusQueryPolicy: DataAccessQueryPolicy = {
  id: "shift-section-status",
  requiredFilters: ["date", "section_id", "shift", "status"],
  maxDateRangeDays: 31,
  maxPageSize: 100,
  allowSearchWithoutFilters: false,
  maxSearchLength: 120,
};

export const gpsEventsQueryPolicy: DataAccessQueryPolicy = {
  id: "gps-events",
  requiredFilters: ["date", "section_id", "vehicle_id"],
  maxDateRangeDays: 7,
  maxPageSize: 100,
  allowSearchWithoutFilters: false,
  maxSearchLength: 80,
};

export const datedSectionQueryPolicy: DataAccessQueryPolicy = {
  id: "dated-section",
  requiredFilters: ["date", "section_id"],
  maxDateRangeDays: 31,
  maxPageSize: 100,
  allowSearchWithoutFilters: false,
  maxSearchLength: 120,
};

export const periodSectionStatusQueryPolicy: DataAccessQueryPolicy = {
  id: "period-section-status",
  requiredFilters: ["section_id", "period_id", "status"],
  maxPageSize: 100,
  allowSearchWithoutFilters: false,
  maxSearchLength: 120,
};

export const vehicleScopedStatusQueryPolicy: DataAccessQueryPolicy = {
  id: "vehicle-scoped-status",
  requiredFilters: ["section_id", "vehicle_id", "status"],
  maxPageSize: 100,
  allowSearchWithoutFilters: false,
  maxSearchLength: 120,
};

export const vehicleStatusQueryPolicy: DataAccessQueryPolicy = {
  id: "vehicle-status",
  requiredFilters: ["vehicle_id", "status"],
  maxPageSize: 100,
  allowSearchWithoutFilters: false,
  maxSearchLength: 120,
};

export const adminMatrixQueryPolicy: DataAccessQueryPolicy = {
  id: "admin-matrix",
  requiredFilters: ["section_id", "status"],
  maxPageSize: 100,
  allowSearchWithoutFilters: false,
  maxSearchLength: 120,
};

const getFilterString = (
  filters: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = filters[key];
  return typeof value === "string" && value.trim() ? value : undefined;
};

const hasFilterValue = (
  filters: Record<string, unknown>,
  key: string,
): boolean => Boolean(getFilterString(filters, key));

const parseIsoDate = (value: string): number => Date.parse(`${value.slice(0, 10)}T00:00:00.000Z`);

export const getQueryDateRangeDays = (
  filters: Record<string, unknown>,
): number | undefined => {
  const singleDate = getFilterString(filters, "date");
  if (singleDate) {
    return 1;
  }

  const dateFrom = getFilterString(filters, "date_from") ?? getFilterString(filters, "dateFrom");
  const dateTo = getFilterString(filters, "date_to") ?? getFilterString(filters, "dateTo");

  if (!dateFrom && !dateTo) {
    return undefined;
  }

  if (!dateFrom || !dateTo) {
    return -1;
  }

  const start = parseIsoDate(dateFrom);
  const end = parseIsoDate(dateTo);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return -1;
  }

  return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
};

export const normalizeServerPageQueryDraft = (
  draft: ServerPageQueryDraft,
): ServerPageQuery => ({
  pageSize: normalizePageSize(draft.pageSize),
  cursor: draft.cursor,
  offset: clampOffset(draft.offset),
  filters: draft.filters ?? {},
  sort: draft.sort,
  search: draft.search,
});

export const validateServerPageQueryPolicy = (
  query: ServerPageQuery,
  policy: DataAccessQueryPolicy,
): DataAccessQueryValidationIssue[] => {
  const issues: DataAccessQueryValidationIssue[] = [];

  if (!dispatchPageSizeOptions.includes(query.pageSize)) {
    issues.push({
      code: "page_size_invalid",
      message: "Server query pageSize must be one of the allowed page sizes.",
      field: "pageSize",
    });
  }

  if (policy.maxPageSize && query.pageSize > policy.maxPageSize) {
    issues.push({
      code: "page_size_invalid",
      message: "Server query pageSize exceeds policy maxPageSize.",
      field: "pageSize",
    });
  }

  for (const requiredFilter of policy.requiredFilters) {
    if (requiredFilter === "date") {
      const dateRangeDays = getQueryDateRangeDays(query.filters);

      if (dateRangeDays === undefined) {
        issues.push({
          code: "date_range_required",
          message: "Server query requires a bounded date or date range.",
          field: "date",
        });
      } else if (dateRangeDays < 1) {
        issues.push({
          code: "date_range_invalid",
          message: "Server query date range is invalid.",
          field: "date",
        });
      } else if (policy.maxDateRangeDays && dateRangeDays > policy.maxDateRangeDays) {
        issues.push({
          code: "date_range_too_large",
          message: "Server query date range exceeds policy maxDateRangeDays.",
          field: "date",
        });
      }

      continue;
    }

    if (!hasFilterValue(query.filters, requiredFilter)) {
      issues.push({
        code: "required_filter_missing",
        message: "Server query is missing a required filter.",
        field: requiredFilter,
      });
    }
  }

  const hasAnyFilter = Object.values(query.filters).some((value) => (
    typeof value === "string" ? value.trim() : value !== undefined && value !== null
  ));

  if (query.search?.trim() && !policy.allowSearchWithoutFilters && !hasAnyFilter) {
    issues.push({
      code: "search_requires_filters",
      message: "Server search requires filters to avoid unbounded scans.",
      field: "search",
    });
  }

  if (policy.maxSearchLength && query.search && query.search.length > policy.maxSearchLength) {
    issues.push({
      code: "search_too_long",
      message: "Server search text exceeds policy maxSearchLength.",
      field: "search",
    });
  }

  return issues;
};

export const isServerPageQueryAllowed = (
  query: ServerPageQuery,
  policy: DataAccessQueryPolicy,
): boolean => validateServerPageQueryPolicy(query, policy).length === 0;
