import type { PtoDateTableKey, PtoPlanRow } from "../../domain/pto/date-table";
import type { PtoPersistenceState } from "../../domain/pto/persistence-shared";

export type MysqlPtoTable = PtoDateTableKey;
export type MysqlPtoRow = PtoPlanRow;

export type MysqlPtoState = PtoPersistenceState;

export {
  deletePtoBucketRowFromMysql,
  deletePtoBucketValuesFromMysql,
  deletePtoRowsFromMysql,
  deletePtoYearFromMysql,
  savePtoBucketRowToMysql,
  savePtoBucketValueToMysql,
  savePtoDayValueToMysql,
  savePtoDayValueWithRowToMysql,
  savePtoDayValuesToMysql,
  savePtoDayValuesWithRowToMysql,
  savePtoStateToMysql,
  type PtoSnapshotWriteOptions,
  type PtoSnapshotWriteResult,
} from "./pto-commands";
export {
  loadPtoBucketsFromMysql,
  loadPtoStateFromMysql,
  loadPtoStateFromMysqlForYear,
  loadPtoUpdatedAtFromMysql,
} from "./pto-load";
