import type { PtoPlanRow } from "../pto/date-table";

export type ReportPtoIndexEntry = {
  matched: number;
  rows: PtoPlanRow[];
  dailyTotals: Map<string, number>;
  prefixTotals: Array<{ date: string; value: number }>;
  carryoverTotals: Map<string, number>;
};

export type ReportPtoIndex = Map<string, ReportPtoIndexEntry>;
