import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createPtoBucketsVirtualColumns,
  createPtoBucketsVirtualRows,
  ptoBucketsRenderedColumnSpan,
} from "../features/pto/ptoBucketsVirtualGridModel";
import { bucketOverscanColumns, bucketOverscanRows, bucketRowHeight, bucketValueColumnWidth } from "../features/pto/ptoBucketsConfig";
import {
  performanceComputedColumnWidth,
  performanceFrozenColumnCount,
  performanceFrozenWidth,
  ptoPerformanceTableMinWidth,
} from "../features/pto/ptoPerformanceConfig";

const testDir = dirname(fileURLToPath(import.meta.url));
const performanceSectionSource = readFileSync(resolve(testDir, "../features/pto/PtoPerformanceSection.tsx"), "utf8");
const performanceTableSource = readFileSync(resolve(testDir, "../features/pto/PtoPerformanceTable.tsx"), "utf8");
const performanceTableRowSource = readFileSync(resolve(testDir, "../features/pto/PtoPerformanceTableRow.tsx"), "utf8");
const usePtoPerformanceVirtualGridSource = readFileSync(resolve(testDir, "../features/pto/usePtoPerformanceVirtualGrid.ts"), "utf8");
const commonMojibakeFragments = [
  "\u0420\u0408",
  "\u0420\u040b",
  "\u0420\u045f",
  "\u0421\u045a",
  "\u0432\u0402\u045e",
];

const rows = Array.from({ length: 50 }, (_, index) => `row-${index}`);
const columns = Array.from({ length: 20 }, (_, index) => `column-${index}`);

assert.equal(
  ptoPerformanceTableMinWidth(0),
  performanceFrozenWidth + bucketValueColumnWidth + performanceComputedColumnWidth,
);
assert.equal(
  ptoPerformanceTableMinWidth(3),
  performanceFrozenWidth + bucketValueColumnWidth * 3 + performanceComputedColumnWidth,
);

const middleRows = createPtoBucketsVirtualRows(rows, {
  height: bucketRowHeight * 5,
  scrollTop: bucketRowHeight * 20,
});
assert.equal(middleRows.rows[0], rows[20 - bucketOverscanRows]);
assert.equal(middleRows.topSpacerHeight, (20 - bucketOverscanRows) * bucketRowHeight);

const performanceColumns = createPtoBucketsVirtualColumns(columns, {
  scrollLeft: performanceFrozenWidth + bucketValueColumnWidth * 10,
  width: bucketValueColumnWidth * 3,
}, performanceFrozenWidth);
assert.equal(performanceColumns.columns[0], columns[10 - bucketOverscanColumns]);
assert.equal(performanceColumns.leftSpacerWidth, (10 - bucketOverscanColumns) * bucketValueColumnWidth);
assert.equal(
  ptoBucketsRenderedColumnSpan(performanceColumns, performanceFrozenColumnCount) + 1,
  performanceFrozenColumnCount + performanceColumns.columns.length + 3,
);

assert.match(performanceSectionSource, /frozenWidth: performanceFrozenWidth/);
assert.match(performanceSectionSource, /const handleScheduleViewportUpdate = useCallback\(\(\) => \{[\s\S]*commitActiveEdit\(\);[\s\S]*scheduleViewportUpdate\(\);[\s\S]*\}/);
assert.match(performanceSectionSource, /usePtoPerformanceVirtualGrid\(\{[\s\S]*rows,[\s\S]*columns,[\s\S]*viewport,[\s\S]*\}\)/);
assert.doesNotMatch(performanceSectionSource, /suspendVirtualization/);
assert.match(usePtoPerformanceVirtualGridSource, /createPtoBucketsVirtualColumns\(columns, \{ scrollLeft, width \}, performanceFrozenWidth\)/);
assert.match(usePtoPerformanceVirtualGridSource, /ptoBucketsRenderedColumnSpan\(virtualColumns, performanceFrozenColumnCount\) \+ 1/);
assert.match(performanceTableSource, /virtualRows\.rows\.map/);
assert.doesNotMatch(performanceTableSource, /\{rows\.map\(/);
assert.match(performanceTableSource, /virtualColumns\.columns\.map/);
assert.match(performanceTableSource, /virtualColumns\.rightSpacerWidth[\s\S]*ptoPerformanceCalculatedColumn/);
assert.doesNotMatch(performanceTableSource, /PtoBucketValueCell[\s\S]*ptoPerformanceCalculatedColumn/);
assert.match(performanceTableSource, /"\\u0423\\u0447\\u0430\\u0441\\u0442\\u043e\\u043a"/);
assert.match(performanceTableSource, /"\\u0421\\u0442\\u0440\\u0443\\u043a\\u0442\\u0443\\u0440\\u0430/);
assert.equal(commonMojibakeFragments.some((fragment) => performanceTableSource.includes(fragment)), false);
assert.match(performanceTableRowSource, /export const PtoPerformanceTableRow = memo\(function PtoPerformanceTableRow/);
assert.match(performanceTableRowSource, /function rowEditKeyStateEqual/);
assert.match(performanceTableRowSource, /editKey\?\.startsWith\(`\$\{rowKey\}::`\) \?\? false/);
assert.doesNotMatch(performanceTableRowSource, /previous\.editKey === next\.editKey/);
assert.match(performanceTableRowSource, /const workingTimeKey = ptoBucketCellKey\(next\.row\.key, "performance:working-time"\);/);
assert.match(performanceTableRowSource, /calculatePtoObrKio\(workingTime\)/);
