export const dispatchPageSizeOptions = [25, 50, 100] as const;

export type DispatchPageSize = typeof dispatchPageSizeOptions[number];
export type SortDirection = "asc" | "desc";
export type PageCursor = string;

export type ServerSort = {
  field: string;
  direction: SortDirection;
};

export type ServerPageQuery<Filters extends Record<string, unknown> = Record<string, unknown>> = {
  pageSize: DispatchPageSize;
  cursor?: PageCursor;
  offset?: number;
  filters: Filters;
  sort?: ServerSort;
  search?: string;
};

export type ServerPageResult<Row> = {
  rows: Row[];
  pageSize: DispatchPageSize;
  nextCursor?: PageCursor;
  totalCount?: number;
};

export type RequiredFilterKey =
  | "date"
  | "section_id"
  | "shift"
  | "vehicle_id"
  | "driver_id"
  | "status"
  | "created_at"
  | "updated_at"
  | "contractor_id"
  | "period_id"
  | "terminal_id";

export const recommendedDatabaseIndexes: Array<RequiredFilterKey | `${RequiredFilterKey}+${RequiredFilterKey}`> = [
  "date",
  "section_id",
  "shift",
  "vehicle_id",
  "driver_id",
  "status",
  "created_at",
  "updated_at",
  "contractor_id",
  "period_id",
  "terminal_id",
  "date+section_id",
  "vehicle_id+date",
  "contractor_id+period_id",
];

export function normalizePageSize(value: unknown): DispatchPageSize {
  return dispatchPageSizeOptions.includes(value as DispatchPageSize) ? value as DispatchPageSize : 50;
}

export function clampOffset(value: unknown) {
  const offset = Number(value);
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
}
