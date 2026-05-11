import {
  clampOffset,
  normalizePageSize,
  type ServerPageQuery,
  type ServerPageResult,
  type ServerSort,
} from "../data-access/pagination";
import type { MiningShift, MiningShiftReport, MiningShiftReportStatus } from "./service-contracts";

export type MiningShiftReportListFilters = {
  dateFrom?: string;
  dateTo?: string;
  sectionId?: string;
  shift?: MiningShift;
  status?: MiningShiftReportStatus;
  submittedBy?: string;
  acceptedBy?: string;
};

export type MiningShiftReportServerFilters = {
  date_from?: string;
  date_to?: string;
  section_id?: string;
  shift?: MiningShift;
  status?: MiningShiftReportStatus;
  submitted_by?: string;
  accepted_by?: string;
};

export type MiningShiftReportListQuery = ServerPageQuery<MiningShiftReportListFilters>;
export type MiningShiftReportListResult = ServerPageResult<MiningShiftReport>;

export const miningShiftReportListDefaultSort: ServerSort = {
  field: "reportDate",
  direction: "desc",
};

export const miningShiftReportListServerIndexes = [
  "date+section_id+shift",
  "section_id+status",
  "updated_at",
] as const;

export const createDefaultMiningShiftReportListQuery = (): MiningShiftReportListQuery => ({
  pageSize: 50,
  offset: 0,
  filters: {},
  sort: miningShiftReportListDefaultSort,
});

const normalizeStringFilter = (value: unknown): string | undefined => (
  typeof value === "string" && value.trim() ? value.trim() : undefined
);

const normalizeMiningShift = (value: unknown): MiningShift | undefined => (
  value === "day" || value === "night" ? value : undefined
);

const normalizeMiningShiftReportStatus = (value: unknown): MiningShiftReportStatus | undefined => (
  value === "draft"
    || value === "submitted"
    || value === "reviewing"
    || value === "returned"
    || value === "accepted"
    || value === "closed"
    ? value
    : undefined
);

export const normalizeMiningShiftReportListQuery = (
  query: Partial<MiningShiftReportListQuery>,
): MiningShiftReportListQuery => ({
  pageSize: normalizePageSize(query.pageSize),
  cursor: normalizeStringFilter(query.cursor),
  offset: clampOffset(query.offset),
  search: normalizeStringFilter(query.search),
  sort: query.sort ?? miningShiftReportListDefaultSort,
  filters: {
    dateFrom: normalizeStringFilter(query.filters?.dateFrom),
    dateTo: normalizeStringFilter(query.filters?.dateTo),
    sectionId: normalizeStringFilter(query.filters?.sectionId),
    shift: normalizeMiningShift(query.filters?.shift),
    status: normalizeMiningShiftReportStatus(query.filters?.status),
    submittedBy: normalizeStringFilter(query.filters?.submittedBy),
    acceptedBy: normalizeStringFilter(query.filters?.acceptedBy),
  },
});

export const toMiningShiftReportServerFilters = (
  filters: MiningShiftReportListFilters,
): MiningShiftReportServerFilters => ({
  date_from: filters.dateFrom,
  date_to: filters.dateTo,
  section_id: filters.sectionId,
  shift: filters.shift,
  status: filters.status,
  submitted_by: filters.submittedBy,
  accepted_by: filters.acceptedBy,
});

export const hasBoundedMiningShiftReportPeriod = (query: MiningShiftReportListQuery): boolean => (
  Boolean(query.filters.dateFrom && query.filters.dateTo)
);
