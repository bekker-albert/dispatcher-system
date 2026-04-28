import type { DataPtoState } from "../../lib/data/pto";
import type { PtoBucketRow } from "../../lib/domain/pto/buckets";
import type { PtoDateTableKey, PtoPlanRow } from "../../lib/domain/pto/date-table";
import type { PtoPersistenceDayValuePatch } from "../../lib/domain/pto/persistence-shared";

export type CreatePtoDatabaseStateOptions = {
  manualYears: string[];
  planRows: PtoPlanRow[];
  operRows: PtoPlanRow[];
  surveyRows: PtoPlanRow[];
  bucketValues: Record<string, number>;
  bucketRows: PtoBucketRow[];
  uiState: NonNullable<DataPtoState["uiState"]>;
};

export type PtoDatabaseState = DataPtoState & {
  uiState: NonNullable<DataPtoState["uiState"]>;
};

export type PtoDatabaseSaveMode = "auto" | "manual";

export type PtoDatabaseSaveBaseline = {
  kind: "pto-database-save-baseline";
  snapshot: string;
  expectedUpdatedAt: string | null;
};

export type PtoDatabaseInlineSavePatch =
  | {
    kind: "day-values";
    table: PtoDateTableKey;
    values: PtoPersistenceDayValuePatch[];
  }
  | {
    kind: "bucket-values";
    values: Array<{ cellKey: string; value: number | null }>;
  };

export type PtoDatabaseLoadResolution =
  | {
    kind: "empty-save-local";
    message: string;
  }
  | {
    kind: "empty-ready";
    message: string;
  }
  | {
    kind: "restore-local";
    backupReason: string;
    message: string;
  }
  | {
    kind: "keep-local";
    backupReason: string;
    message: string;
  }
  | {
    kind: "use-database";
    backupReason?: string;
  };

export type NormalizedPtoDatabaseLoadState = {
  manualYears: string[];
  planRows: PtoPlanRow[];
  operRows: PtoPlanRow[];
  surveyRows: PtoPlanRow[];
  bucketValues: Record<string, number>;
  bucketRows: PtoBucketRow[];
  uiState: {
    ptoTab?: string;
    ptoPlanYear?: string;
    ptoAreaFilter?: string;
    expandedPtoMonths: Record<string, boolean>;
    ptoColumnWidths: Record<string, number>;
    ptoRowHeights: Record<string, number>;
    ptoHeaderLabels: Record<string, string>;
  };
  reportFallbackState: {
    reportColumnWidths: Record<string, number>;
    reportReasons: Record<string, string>;
  };
  snapshotState: PtoDatabaseState;
};
