import {
  ptoManualYearsKey,
  ptoPersistenceStateToRecords,
  ptoStateFromPersistenceRecords,
  ptoUiStateKey,
} from "../domain/pto/persistence-shared";
import type { SupabasePtoState } from "./pto-types";
import type {
  PtoBucketRowRecord,
  PtoBucketValueRecord,
  PtoDayValueRecord,
  PtoRowRecord,
} from "./pto-schema";

export type PtoSettingRecord = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

export type SupabasePtoRecordGroups = {
  rowRecords: PtoRowRecord[];
  dayRecords: PtoDayValueRecord[];
  bucketRowRecords: PtoBucketRowRecord[];
  bucketValueRecords: PtoBucketValueRecord[];
};

export type SupabasePtoLoadRecordGroups = {
  rowRecords: PtoRowRecord[];
  dayValueRecords: PtoDayValueRecord[];
  settingRecords: PtoSettingRecord[];
  bucketRowRecords: PtoBucketRowRecord[];
  bucketValueRecords: PtoBucketValueRecord[];
};

export function ptoSupabaseSettingsRecords(
  state: SupabasePtoState,
  updatedAt: string | null,
): PtoSettingRecord[] {
  return [
    {
      key: ptoManualYearsKey,
      value: state.manualYears,
      updated_at: updatedAt,
    },
    {
      key: ptoUiStateKey,
      value: state.uiState ?? {},
      updated_at: updatedAt,
    },
  ];
}

export function ptoSupabaseStateToRecords(
  state: SupabasePtoState,
  updatedAt: string | null = null,
): SupabasePtoRecordGroups & { settingRecords: PtoSettingRecord[] } {
  return {
    ...ptoPersistenceStateToRecords(state),
    settingRecords: ptoSupabaseSettingsRecords(state, updatedAt),
  };
}

export function ptoStateFromSupabaseRecords({
  rowRecords,
  dayValueRecords,
  settingRecords,
  bucketRowRecords,
  bucketValueRecords,
}: SupabasePtoLoadRecordGroups): SupabasePtoState | null {
  return ptoStateFromPersistenceRecords({
    rowRecords,
    dayValueRecords,
    settingRecords,
    bucketRowRecords,
    bucketValueRecords,
    getSettingKey: (setting) => setting.key,
    getSettingValue: (setting) => setting.value,
  });
}
