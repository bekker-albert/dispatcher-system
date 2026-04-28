import { assertSupabasePtoMatchesExpectedUpdatedAt } from "./pto-freshness";
import { ptoSupabaseStateToRecords } from "./pto-records";
import {
  ptoDatabaseRequest,
  shouldRoutePtoThroughServerDatabase,
} from "./pto-routing";
import {
  deletePtoBucketRowsMissingFromState,
  deletePtoBucketValuesMissingFromState,
  deletePtoDayValuesMissingFromState,
  deletePtoRowsMissingFromState,
  ptoSettingsTable,
  requireSupabase,
  upsertPtoBucketRows,
  upsertPtoBucketValues,
  upsertPtoDayValues,
  upsertPtoRows,
  type SupabasePtoClient,
} from "./pto-storage";
import type {
  PtoSnapshotWriteOptions,
  PtoSnapshotWriteResult,
  SupabasePtoState,
} from "./pto-types";

export async function savePtoStateToSupabase(
  state: SupabasePtoState,
  options: PtoSnapshotWriteOptions = {},
): Promise<PtoSnapshotWriteResult> {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("save", {
      state,
      expectedUpdatedAt: options.expectedUpdatedAt,
      yearScope: options.yearScope,
    });
  }

  return savePtoStateToSupabaseClient(state, requireSupabase(), options);
}

export async function savePtoStateToSupabaseClient(
  state: SupabasePtoState,
  client: SupabasePtoClient,
  options: PtoSnapshotWriteOptions = {},
): Promise<PtoSnapshotWriteResult> {
  const updatedAt = new Date().toISOString();
  const {
    rowRecords,
    dayRecords,
    bucketRowRecords,
    bucketValueRecords,
    settingRecords,
  } = ptoSupabaseStateToRecords(state, updatedAt);

  await assertSupabasePtoMatchesExpectedUpdatedAt(state, options.expectedUpdatedAt, client, {
    yearScope: options.yearScope,
  });

  const isYearScopedSave = Boolean(options.yearScope);

  await upsertPtoRows(rowRecords, client);
  await upsertPtoDayValues(dayRecords, client);
  if (!isYearScopedSave) {
    await upsertPtoBucketRows(bucketRowRecords, client);
    await upsertPtoBucketValues(bucketValueRecords, client);
  }

  const { error: settingsError } = await client
    .from(ptoSettingsTable)
    .upsert(settingRecords, { onConflict: "key" });

  if (settingsError) throw settingsError;

  await assertSupabasePtoMatchesExpectedUpdatedAt(state, options.expectedUpdatedAt, client, {
    yearScope: options.yearScope,
  });

  await deletePtoDayValuesMissingFromState(dayRecords, client, { yearScope: options.yearScope });
  if (!isYearScopedSave) {
    await deletePtoRowsMissingFromState(rowRecords, client);
    await deletePtoBucketValuesMissingFromState(bucketValueRecords, client);
    await deletePtoBucketRowsMissingFromState(bucketRowRecords, client);
  }

  return { updatedAt };
}
