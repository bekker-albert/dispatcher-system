import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  loadPtoStateFromMysqlForYear,
  deletePtoYearFromMysql,
  savePtoDayValueWithRowToMysql,
  savePtoDayValuesWithRowToMysql,
  savePtoStateToMysql,
} from "../lib/server/mysql/pto";
import { createPrunedPtoRowYearMetadata } from "../lib/server/mysql/pto-row-writes";
import { dbTransaction } from "../lib/server/mysql/pool";

const mysqlTransactionSource = dbTransaction.toString();
assert.match(mysqlTransactionSource, /ensureMysqlSchema[\s\S]*beginTransaction/);
assert.match(mysqlTransactionSource, /commit\(\)/);
assert.match(mysqlTransactionSource, /rollback\(\)/);
assert.match(mysqlTransactionSource, /release\(\)/);

const mysqlFullSaveSource = savePtoStateToMysql.toString();
const mysqlBucketWritesSource = readFileSync(new URL("../lib/server/mysql/pto-bucket-writes.ts", import.meta.url), "utf8");
const mysqlPtoWritesSource = readFileSync(new URL("../lib/server/mysql/pto-writes.ts", import.meta.url), "utf8");
const mysqlPtoRowWritesSource = readFileSync(new URL("../lib/server/mysql/pto-row-writes.ts", import.meta.url), "utf8");
const mysqlPtoDayValueWritesSource = readFileSync(new URL("../lib/server/mysql/pto-day-value-writes.ts", import.meta.url), "utf8");
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
assert.match(mysqlPtoWritesSource, /from "\.\/pto-row-writes"/);
assert.match(mysqlPtoWritesSource, /from "\.\/pto-day-value-writes"/);
assert.match(mysqlPtoRowWritesSource, /export async function upsertPtoRowsForYearScope/);
assert.match(mysqlPtoRowWritesSource, /selectPtoRowsWithYearMetadataByRecords\(records,\s*execute\)/);
assert.match(mysqlPtoRowWritesSource, /mergePtoYearList\(existingMetadata\.years,\s*record\.years,\s*year\)/);
assert.match(mysqlPtoRowWritesSource, /mergePtoCarryovers\(existingMetadata\.carryovers,\s*record\.carryovers,\s*year\)/);
assert.match(mysqlPtoRowWritesSource, /createPrunedPtoRowYearMetadata\(record,\s*year\)/);
assert.match(mysqlPtoRowWritesSource, /if \(!prunedMetadata\) continue;/);
assert.match(mysqlPtoRowWritesSource, /JSON_CONTAINS\(COALESCE\(years, JSON_ARRAY\(\)\), JSON_QUOTE\(\?\)\)/);
assert.match(mysqlPtoRowWritesSource, /JSON_EXTRACT\(COALESCE\(carryovers, JSON_OBJECT\(\)\), \?\) IS NOT NULL/);
assert.match(mysqlPtoDayValueWritesSource, /export async function deletePtoDayValuesForRowsMissingFromYearState/);
assert.match(mysqlPtoDayValueWritesSource, /SELECT DISTINCT row_id[\s\S]*FROM pto_day_values[\s\S]*WHERE table_type = \?[\s\S]*AND work_date >= \?[\s\S]*AND work_date <= \?/);
assert.match(mysqlPtoDayValueWritesSource, /const staleRowIds = existingRows[\s\S]*filter\(\(rowId\) => !rowIds\.has\(rowId\)\)/);
assert.match(mysqlPtoDayValueWritesSource, /DELETE FROM pto_day_values[\s\S]*AND row_id IN/);
assert.match(mysqlBucketWritesSource, /import \{ chunkValues \} from "\.\/pto-write-utils";/);
assert.doesNotMatch(mysqlBucketWritesSource, /const batchSize = 250/);
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
assert.match(mysqlYearLoadSource, /SELECT \$\{ptoDayValueSelectColumns\} FROM pto_day_values[\s\S]*WHERE work_date >= \? AND work_date <= \?/);
assert.match(mysqlYearLoadSource, /\[start,\s*end,\s*year,\s*year,\s*carryoverJsonPath\]/);
assert.doesNotMatch(mysqlYearLoadSource, /ptoDayValueRecordsForYear/);
assert.match(mysqlYearLoadSource, /SELECT \$\{ptoBucketRowSelectColumns\} FROM pto_bucket_rows ORDER BY sort_index ASC/);
assert.doesNotMatch(mysqlYearLoadSource, /SELECT rows_for_year\.\*/);
assert.doesNotMatch(mysqlYearLoadSource, /SELECT \* FROM pto_day_values/);

assert.equal(
  createPrunedPtoRowYearMetadata(
    { years: "[\"2025\"]", carryover_manual_years: "[]", carryovers: "{}" },
    "2026",
  ),
  null,
);

assert.deepEqual(
  createPrunedPtoRowYearMetadata(
    {
      years: "[\"2025\",\"2026\"]",
      carryover_manual_years: "[\"2024\",\"2026\"]",
      carryovers: "{\"2024\":10,\"2026\":15}",
    },
    "2026",
  ),
  {
    years: ["2025"],
    carryoverManualYears: ["2024"],
    carryovers: { "2024": 10 },
  },
);
