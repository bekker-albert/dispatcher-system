import type { PtoPlanRow } from "../domain/pto/date-table";
import type {
  PtoPersistenceDayValuePatch,
  PtoPersistenceSnapshotWriteOptions,
  PtoPersistenceSnapshotWriteResult,
  PtoPersistenceState,
} from "../domain/pto/persistence-shared";

export type SupabasePtoRow = PtoPlanRow;

export type SupabasePtoState = PtoPersistenceState;

export type PtoSnapshotWriteOptions = PtoPersistenceSnapshotWriteOptions;
export type PtoSnapshotWriteResult = PtoPersistenceSnapshotWriteResult;

export type PtoDayValuePatch = PtoPersistenceDayValuePatch;
