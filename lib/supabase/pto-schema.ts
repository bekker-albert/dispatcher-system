import type { PtoDateTableKey } from "../domain/pto/date-table";
import type {
  PtoPersistenceBucketRowRecord,
  PtoPersistenceBucketValueRecord,
  PtoPersistenceDayValueRecord,
  PtoPersistenceRowRecord,
} from "../domain/pto/persistence-shared";
import { supabase, supabaseConfigured } from "./client";

export type SupabasePtoTable = PtoDateTableKey;
export type SupabasePtoClient = NonNullable<typeof supabase> | {
  from: NonNullable<typeof supabase>["from"];
};

export type PtoRowRecord = PtoPersistenceRowRecord;
export type PtoDayValueRecord = PtoPersistenceDayValueRecord;
export type PtoBucketRowRecord = PtoPersistenceBucketRowRecord;
export type PtoBucketValueRecord = PtoPersistenceBucketValueRecord;

export const ptoRowsTable = "pto_rows";
export const ptoDayValuesTable = "pto_day_values";
export const ptoSettingsTable = "pto_settings";
export const ptoBucketRowsTable = "pto_bucket_rows";
export const ptoBucketValuesTable = "pto_bucket_values";

export function requireSupabase(): SupabasePtoClient {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}
