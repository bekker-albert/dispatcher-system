import type { DataPtoState } from "../../lib/data/pto";
import { removeYearFromPtoRows, type PtoDateTableKey } from "../../lib/domain/pto/date-table";
import type {
  PtoDatabaseInlineSavePatch,
  PtoDatabaseSaveBaseline,
  PtoDatabaseSaveMode,
} from "./ptoPersistenceTypes";

export function serializePtoDatabaseState(state: DataPtoState) {
  return JSON.stringify(state);
}

export function createPtoDatabaseSaveBaseline(snapshot: string, expectedUpdatedAt: string | null): string {
  return JSON.stringify({
    kind: "pto-database-save-baseline",
    snapshot,
    expectedUpdatedAt,
  } satisfies PtoDatabaseSaveBaseline);
}

export function readPtoDatabaseSaveBaseline(value: string): PtoDatabaseSaveBaseline {
  if (!value) {
    return {
      kind: "pto-database-save-baseline",
      snapshot: "",
      expectedUpdatedAt: null,
    };
  }

  try {
    const parsed = JSON.parse(value) as Partial<PtoDatabaseSaveBaseline>;
    if (
      parsed
      && parsed.kind === "pto-database-save-baseline"
      && typeof parsed.snapshot === "string"
    ) {
      return {
        kind: "pto-database-save-baseline",
        snapshot: parsed.snapshot,
        expectedUpdatedAt: typeof parsed.expectedUpdatedAt === "string" ? parsed.expectedUpdatedAt : null,
      };
    }
  } catch {
    // Older in-memory baselines were the raw serialized snapshot.
  }

  return {
    kind: "pto-database-save-baseline",
    snapshot: value,
    expectedUpdatedAt: null,
  };
}

function ptoRowsForInlinePatch(state: DataPtoState, table: PtoDateTableKey) {
  if (table === "plan") return state.planRows;
  if (table === "oper") return state.operRows;
  return state.surveyRows;
}

function applyPtoInlineSavePatch(state: DataPtoState, patch: PtoDatabaseInlineSavePatch): DataPtoState {
  if (patch.kind === "year") {
    return {
      ...state,
      manualYears: (state.manualYears ?? []).filter((year) => year !== patch.year),
      planRows: removeYearFromPtoRows(state.planRows, patch.year),
      operRows: removeYearFromPtoRows(state.operRows, patch.year),
      surveyRows: removeYearFromPtoRows(state.surveyRows, patch.year),
    };
  }

  if (patch.kind === "date-row") {
    const rowIds = new Set(patch.rowIds);
    if (patch.table === "plan") return { ...state, planRows: state.planRows.filter((row) => !rowIds.has(row.id)) };
    if (patch.table === "oper") return { ...state, operRows: state.operRows.filter((row) => !rowIds.has(row.id)) };
    return { ...state, surveyRows: state.surveyRows.filter((row) => !rowIds.has(row.id)) };
  }

  if (patch.kind === "bucket-values") {
    const bucketValues = { ...(state.bucketValues ?? {}) };
    patch.values.forEach(({ cellKey, value }) => {
      if (value === null) {
        delete bucketValues[cellKey];
      } else {
        bucketValues[cellKey] = value;
      }
    });
    return { ...state, bucketValues };
  }

  if (patch.kind === "bucket-row") {
    if (patch.action === "delete") {
      const bucketValues = { ...(state.bucketValues ?? {}) };
      const cellKeyPrefix = `${patch.rowKey}::`;
      Object.keys(bucketValues).forEach((cellKey) => {
        if (cellKey.startsWith(cellKeyPrefix)) delete bucketValues[cellKey];
      });
      return {
        ...state,
        bucketRows: (state.bucketRows ?? []).filter((row) => row.key !== patch.rowKey),
        bucketValues,
      };
    }

    const bucketRows = (state.bucketRows ?? []).filter((row) => row.key !== patch.row.key);
    const index = typeof patch.index === "number"
      ? Math.max(0, Math.min(patch.index, bucketRows.length))
      : bucketRows.length;
    bucketRows.splice(index, 0, patch.row);
    return { ...state, bucketRows };
  }

  const rows = ptoRowsForInlinePatch(state, patch.table);
  const patchedRows = rows.map((row) => {
    const rowPatches = patch.values.filter((value) => value.rowId === row.id);
    if (rowPatches.length === 0) return row;

    const dailyPlans = { ...row.dailyPlans };
    rowPatches.forEach(({ day, value }) => {
      if (value === null) {
        delete dailyPlans[day];
      } else {
        dailyPlans[day] = value;
      }
    });
    return { ...row, dailyPlans };
  });

  if (patch.table === "plan") return { ...state, planRows: patchedRows };
  if (patch.table === "oper") return { ...state, operRows: patchedRows };
  return { ...state, surveyRows: patchedRows };
}

export function patchPtoDatabaseSaveBaseline(
  baselineValue: string,
  updatedAt: string | null,
  patch: PtoDatabaseInlineSavePatch,
) {
  const baseline = readPtoDatabaseSaveBaseline(baselineValue);
  if (!baseline.snapshot) return createPtoDatabaseSaveBaseline(baseline.snapshot, updatedAt);

  try {
    const state = JSON.parse(baseline.snapshot) as DataPtoState;
    return createPtoDatabaseSaveBaseline(
      serializePtoDatabaseState(applyPtoInlineSavePatch(state, patch)),
      updatedAt,
    );
  } catch {
    return createPtoDatabaseSaveBaseline(baseline.snapshot, updatedAt);
  }
}

export function ptoDatabaseStateChanged(state: DataPtoState, savedSnapshot: string) {
  return serializePtoDatabaseState(state) !== readPtoDatabaseSaveBaseline(savedSnapshot).snapshot;
}

export function ptoDatabaseSaveShouldSkip(mode: PtoDatabaseSaveMode, snapshotToSave: string, savedSnapshot: string) {
  return mode === "auto" && snapshotToSave === readPtoDatabaseSaveBaseline(savedSnapshot).snapshot;
}
