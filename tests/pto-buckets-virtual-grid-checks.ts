import assert from "node:assert/strict";
import {
  createPtoBucketsVirtualColumns,
  createPtoBucketsVirtualRows,
  ptoBucketsRenderedColumnSpan,
  ptoBucketsTableMinWidth,
} from "../features/pto/ptoBucketsVirtualGridModel";
import {
  bucketFrozenWidth,
  bucketOverscanColumns,
  bucketOverscanRows,
  bucketRowHeight,
  bucketValueColumnWidth,
} from "../features/pto/ptoBucketsConfig";

const rows = Array.from({ length: 50 }, (_, index) => `row-${index}`);
const columns = Array.from({ length: 20 }, (_, index) => `column-${index}`);
const bodyTechniqueColumnWidth = 230;

assert.equal(ptoBucketsTableMinWidth(0), bucketFrozenWidth + bucketValueColumnWidth);
assert.equal(ptoBucketsTableMinWidth(3), bucketFrozenWidth + bucketValueColumnWidth * 3);
assert.equal(ptoBucketsTableMinWidth(0, bodyTechniqueColumnWidth), bodyTechniqueColumnWidth + bucketValueColumnWidth);
assert.equal(ptoBucketsTableMinWidth(3, bodyTechniqueColumnWidth), bodyTechniqueColumnWidth + bucketValueColumnWidth * 3);

const firstRows = createPtoBucketsVirtualRows(rows, { height: bucketRowHeight * 5, scrollTop: 0 });
assert.deepEqual(firstRows.rows, rows.slice(0, 5 + bucketOverscanRows * 2));
assert.equal(firstRows.topSpacerHeight, 0);
assert.equal(firstRows.bottomSpacerHeight, (rows.length - firstRows.rows.length) * bucketRowHeight);

const middleRows = createPtoBucketsVirtualRows(rows, {
  height: bucketRowHeight * 5,
  scrollTop: bucketRowHeight * 20,
});
assert.equal(middleRows.rows[0], rows[20 - bucketOverscanRows]);
assert.equal(middleRows.topSpacerHeight, (20 - bucketOverscanRows) * bucketRowHeight);

const emptyColumns = createPtoBucketsVirtualColumns([], { scrollLeft: 0, width: 400 });
assert.deepEqual(emptyColumns.columns, []);
assert.equal(emptyColumns.leftSpacerWidth, 0);
assert.equal(emptyColumns.rightSpacerWidth, 0);
assert.equal(ptoBucketsRenderedColumnSpan(emptyColumns), 2);

const firstColumns = createPtoBucketsVirtualColumns(columns, { scrollLeft: 0, width: bucketFrozenWidth + bucketValueColumnWidth * 3 });
assert.deepEqual(firstColumns.columns, columns.slice(0, 3 + bucketOverscanColumns));
assert.equal(firstColumns.leftSpacerWidth, 0);
assert.equal(firstColumns.rightSpacerWidth, (columns.length - firstColumns.columns.length) * bucketValueColumnWidth);

const middleColumns = createPtoBucketsVirtualColumns(columns, {
  scrollLeft: bucketFrozenWidth + bucketValueColumnWidth * 10,
  width: bucketValueColumnWidth * 3,
});
assert.equal(middleColumns.columns[0], columns[10 - bucketOverscanColumns]);
assert.equal(middleColumns.leftSpacerWidth, (10 - bucketOverscanColumns) * bucketValueColumnWidth);
assert.equal(ptoBucketsRenderedColumnSpan(middleColumns), 2 + middleColumns.columns.length + 2);

const bodyColumns = createPtoBucketsVirtualColumns(columns, {
  scrollLeft: bodyTechniqueColumnWidth + bucketValueColumnWidth * 10,
  width: bucketValueColumnWidth * 3,
}, bodyTechniqueColumnWidth);
assert.equal(bodyColumns.columns[0], columns[10 - bucketOverscanColumns]);
assert.equal(bodyColumns.leftSpacerWidth, (10 - bucketOverscanColumns) * bucketValueColumnWidth);
assert.equal(ptoBucketsRenderedColumnSpan(bodyColumns, 1), 1 + bodyColumns.columns.length + 2);
