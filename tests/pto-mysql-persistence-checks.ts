import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  loadPtoStateFromMysqlForYear,
  deletePtoYearFromMysql,
  savePtoDayValueWithRowToMysql,
  savePtoDayValuesWithRowToMysql,
  savePtoStateToMysql,
} from "../lib/server/mysql/pto";
import { dbTransaction } from "../lib/server/mysql/pool";

const mysqlTransactionSource = dbTransaction.toString();
assert.match(mysqlTransactionSource, /ensureMysqlSchema[\s\S]*beginTransaction/);
assert.match(mysqlTransactionSource, /commit\(\)/);
assert.match(mysqlTransactionSource, /rollback\(\)/);
assert.match(mysqlTransactionSource, /release\(\)/);

const mysqlFullSaveSource = savePtoStateToMysql.toString();
const mysqlBucketWritesSource = readFileSync(new URL("../lib/server/mysql/pto-bucket-writes.ts", import.meta.url), "utf8");
const mysqlPtoWritesSource = readFileSync(new URL("../lib/server/mysql/pto-writes.ts", import.meta.url), "utf8");
assert.match(mysqlFullSaveSource, /writePtoTransaction/);
assert.match(mysqlFullSaveSource, /assertMysqlPtoMatchesExpectedUpdatedAt\(state,\s*options\.expectedUpdatedAt,\s*\{[\s\S]*yearScope: options\.yearScope[\s\S]*\}\)/);
assert.match(mysqlFullSaveSource, /if \(options\.yearScope\) \{[\s\S]*upsertPtoRowsForYearScope\(rowRecords,\s*options\.yearScope,\s*execute\);[\s\S]*\} else \{[\s\S]*upsertPtoRows\(rowRecords,\s*execute\);[\s\S]*\}/);
assert.match(mysqlFullSaveSource, /deletePtoDayValuesMissingFromState\("plan",\s*planRows,\s*execute,\s*\{ yearScope: options\.yearScope \}\)/);
assert.match(mysqlFullSaveSource, /const isYearScopedSave = Boolean\(options\.yearScope\)/);
assert.match(mysqlFullSaveSource, /if \(options\.yearScope\) \{[\s\S]*deletePtoDayValuesForRowsMissingFromYearState\("plan",\s*planRows,\s*options\.yearScope,\s*execute\);[\s\S]*deletePtoDayValuesForRowsMissingFromYearState\("oper",\s*operRows,\s*options\.yearScope,\s*execute\);[\s\S]*deletePtoDayValuesForRowsMissingFromYearState\("survey",\s*surveyRows,\s*options\.yearScope,\s*execute\);/);
assert.match(mysqlFullSaveSource, /if \(options\.yearScope\) \{[\s\S]*prunePtoYearFromRows\(options\.yearScope,\s*execute,\s*\{[\s\S]*excludeRowIdsByTable:[\s\S]*ptoPlanRowIds\)\(planRows\)[\s\S]*ptoPlanRowIds\)\(operRows\)[\s\S]*ptoPlanRowIds\)\(surveyRows\)[\s\S]*\}\);[\s\S]*deletePtoRowsWithoutData\(execute\);[\s\S]*\}/);
assert.match(mysqlFullSaveSource, /if \(!isYearScopedSave\) \{[\s\S]*deletePtoRowsMissingFromState\("plan",\s*planRows,\s*execute\)[\s\S]*\}/);
assert.match(mysqlFullSaveSource, /if \(!isYearScopedSave\) \{[\s\S]*deletePtoBucketValuesMissingFromState\(bucketValueRecords,\s*execute\)[\s\S]*deletePtoBucketRowsMissingFromState\(bucketRowRecords,\s*execute\)[\s\S]*\}/);
assert.match(mysqlFullSaveSource, /deletePtoBucketRowsMissingFromState\(bucketRowRecords,\s*execute\)/);
assert.match(mysqlPtoWritesSource, /export async function upsertPtoRowsForYearScope/);
assert.match(mysqlPtoWritesSource, /selectPtoRowsWithYearMetadataByRecords\(records,\s*execute\)/);
assert.match(mysqlPtoWritesSource, /mergePtoYearList\(existingMetadata\.years,\s*record\.years,\s*year\)/);
assert.match(mysqlPtoWritesSource, /mergePtoCarryovers\(existingMetadata\.carryovers,\s*record\.carryovers,\s*year\)/);
assert.match(mysqlPtoWritesSource, /export async function deletePtoDayValuesForRowsMissingFromYearState/);
assert.match(mysqlPtoWritesSource, /SELECT DISTINCT row_id[\s\S]*FROM pto_day_values[\s\S]*WHERE table_type = \?[\s\S]*AND work_date >= \?[\s\S]*AND work_date <= \?/);
assert.match(mysqlPtoWritesSource, /const staleRowIds = existingRows[\s\S]*filter\(\(rowId\) => !rowIds\.has\(rowId\)\)/);
assert.match(mysqlPtoWritesSource, /DELETE FROM pto_day_values[\s\S]*AND row_id IN/);
assert.match(mysqlBucketWritesSource, /for \(const batch of chunkValues\(records\)\) \{[\s\S]*INSERT INTO pto_bucket_rows/);
assert.match(mysqlBucketWritesSource, /SELECT row_key FROM pto_bucket_rows[\s\S]*DELETE FROM pto_bucket_rows[\s\S]*WHERE row_key IN/);
assert.match(mysqlBucketWritesSource, /SELECT row_key, equipment_key FROM pto_bucket_values[\s\S]*DELETE FROM pto_bucket_values[\s\S]*WHERE \(row_key, equipment_key\) IN/);

const mysqlDeleteYearSource = deletePtoYearFromMysql.toString();
assert.match(mysqlDeleteYearSource, /DELETE FROM pto_day_values WHERE work_date >= \? AND work_date <= \?/);
assert.match(mysqlDeleteYearSource, /prunePtoYearFromRows\(year,\s*execute\)/);
assert.match(mysqlDeleteYearSource, /deletePtoRowsWithoutData\(execute\)/);

const mysqlDayWithRowSaveSource = savePtoDayValueWithRowToMysql.toString();
assert.match(mysqlDayWithRowSaveSource, /writePtoTransaction/);
assert.ok(mysqlDayWithRowSaveSource.indexOf("insertPtoRowsIfMissing") < mysqlDayWithRowSaveSource.indexOf("upsertPtoDayValues"));
assert.doesNotMatch(mysqlDayWithRowSaveSource, /upsertPtoRows/);

const mysqlDaysWithRowSaveSource = savePtoDayValuesWithRowToMysql.toString();
assert.match(mysqlDaysWithRowSaveSource, /writePtoTransaction/);
assert.ok(mysqlDaysWithRowSaveSource.indexOf("insertPtoRowsIfMissing") < mysqlDaysWithRowSaveSource.indexOf("upsertPtoDayValues"));
assert.doesNotMatch(mysqlDaysWithRowSaveSource, /upsertPtoRows/);

const mysqlYearLoadSource = loadPtoStateFromMysqlForYear.toString();
assert.match(mysqlYearLoadSource, /ptoYearDateRange/);
assert.match(mysqlYearLoadSource, /WITH values_for_year AS \([\s\S]*SELECT DISTINCT table_type, row_id[\s\S]*FROM pto_day_values[\s\S]*WHERE work_date >= \? AND work_date <= \?/);
assert.match(mysqlYearLoadSource, /FROM pto_rows AS rows_for_year/);
assert.match(mysqlYearLoadSource, /LEFT JOIN values_for_year[\s\S]*values_for_year\.table_type = rows_for_year\.table_type[\s\S]*values_for_year\.row_id = rows_for_year\.row_id/);
assert.match(mysqlYearLoadSource, /WHERE values_for_year\.row_id IS NOT NULL/);
assert.match(mysqlYearLoadSource, /JSON_CONTAINS\(COALESCE\(rows_for_year\.years, JSON_ARRAY\(\)\), JSON_QUOTE\(\?\)\)/);
assert.match(mysqlYearLoadSource, /JSON_EXTRACT\(COALESCE\(rows_for_year\.carryovers, JSON_OBJECT\(\)\), \?\) IS NOT NULL/);
assert.doesNotMatch(mysqlYearLoadSource, /EXISTS \([\s\S]*FROM pto_day_values AS values_for_year/);
assert.match(mysqlYearLoadSource, /SELECT \* FROM pto_day_values[\s\S]*WHERE work_date >= \? AND work_date <= \?/);
assert.match(mysqlYearLoadSource, /\[start,\s*end,\s*year,\s*year,\s*carryoverJsonPath\]/);
assert.doesNotMatch(mysqlYearLoadSource, /ptoDayValueRecordsForYear/);
assert.match(mysqlYearLoadSource, /SELECT \* FROM pto_bucket_rows ORDER BY sort_index ASC/);
