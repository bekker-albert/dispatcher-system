import type { PtoBucketRow } from "./buckets";
import type { PtoPlanRow } from "./date-table";
import type { PtoDateTableKey } from "./date-table-types";

export type PtoPersistenceTable = PtoDateTableKey;

export type PtoPersistenceUiState = {
  topTab?: string;
  ptoTab?: string;
  ptoPlanYear?: string;
  ptoAreaFilter?: string;
  expandedPtoMonths?: Record<string, boolean>;
  reportColumnWidths?: Record<string, number>;
  reportReasons?: Record<string, string>;
  ptoColumnWidths?: Record<string, number>;
  ptoRowHeights?: Record<string, number>;
  ptoHeaderLabels?: Record<string, string>;
};

export type PtoPersistenceState = {
  updatedAt?: string;
  manualYears: string[];
  planRows: PtoPlanRow[];
  operRows: PtoPlanRow[];
  surveyRows: PtoPlanRow[];
  bucketValues?: Record<string, number>;
  bucketRows?: PtoBucketRow[];
  uiState?: PtoPersistenceUiState;
};

export type PtoPersistenceRowRecord = {
  table_type: PtoPersistenceTable;
  row_id: string;
  area: string | null;
  location: string | null;
  structure: string | null;
  customer_code: string | null;
  unit: string | null;
  status: string | null;
  carryover: number | string | null;
  carryovers: unknown;
  carryover_manual_years: unknown;
  years: unknown;
  sort_index: number | null;
  updated_at?: string | null;
};

export type PtoPersistenceDayValueRecord = {
  table_type: PtoPersistenceTable;
  row_id: string;
  work_date: string;
  value: number | string | null;
  updated_at?: string | null;
};

export type PtoPersistenceBucketRowRecord = {
  row_key: string;
  area: string | null;
  structure: string | null;
  source: string | null;
  sort_index: number | null;
  updated_at?: string | null;
};

export type PtoPersistenceBucketValueRecord = {
  row_key: string;
  equipment_key: string;
  value: number | string | null;
  updated_at?: string | null;
};

export type PtoPersistenceDayValuePatch = {
  rowId: string;
  day: string;
  value: number | null;
};

export type PtoPersistenceDayValuePatchRecords = {
  upsertRecords: PtoPersistenceDayValueRecord[];
  deleteValues: PtoPersistenceDayValuePatch[];
};

export type PtoPersistenceSnapshotWriteOptions = {
  expectedUpdatedAt?: string | null;
  yearScope?: string | null;
};

export type PtoPersistenceSnapshotWriteResult = {
  updatedAt?: string | null;
};

export type PtoPersistenceLoadRecordGroups<SettingRecord extends { updated_at?: string | null }> = {
  rowRecords: PtoPersistenceRowRecord[];
  dayValueRecords: PtoPersistenceDayValueRecord[];
  settingRecords: SettingRecord[];
  bucketRowRecords: PtoPersistenceBucketRowRecord[];
  bucketValueRecords: PtoPersistenceBucketValueRecord[];
};

export type PtoPersistenceStateFromRecordsOptions<SettingRecord extends { updated_at?: string | null }> =
  PtoPersistenceLoadRecordGroups<SettingRecord> & {
    getSettingKey: (record: SettingRecord) => string;
    getSettingValue: (record: SettingRecord) => unknown;
    normalizeDate?: (value: string) => string | null;
    normalizeUpdatedAt?: (value: unknown) => string | null | undefined;
    parseStoredValue?: (value: unknown) => unknown;
  };

export const ptoManualYearsKey = "pto_manual_years";
export const ptoUiStateKey = "pto_ui_state";
