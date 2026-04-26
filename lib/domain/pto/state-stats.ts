import type { PtoPlanRow } from "./date-table";

export type PtoStateStatsSource = {
  planRows?: PtoPlanRow[];
  operRows?: PtoPlanRow[];
  surveyRows?: PtoPlanRow[];
  bucketRows?: unknown[];
  bucketValues?: Record<string, unknown>;
};

export function countFilledPtoDayValues(rows: PtoPlanRow[] = []) {
  return rows.reduce((sum, row) => (
    sum + Object.values(row.dailyPlans ?? {}).filter((value) => Number.isFinite(Number(value))).length
  ), 0);
}

export function countPtoStateData(state: PtoStateStatsSource) {
  const rows = (state.planRows?.length ?? 0) + (state.operRows?.length ?? 0) + (state.surveyRows?.length ?? 0);
  const dayValues = countFilledPtoDayValues(state.planRows)
    + countFilledPtoDayValues(state.operRows)
    + countFilledPtoDayValues(state.surveyRows);
  const bucketRows = state.bucketRows?.length ?? 0;
  const bucketValues = Object.values(state.bucketValues ?? {}).filter((value) => Number.isFinite(Number(value))).length;

  return {
    rows,
    dayValues,
    bucketRows,
    bucketValues,
    total: rows + dayValues + bucketRows + bucketValues,
  };
}
