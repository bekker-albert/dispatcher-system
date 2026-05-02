import assert from "node:assert/strict";
import {
  createPtoBucketGridKeys,
  ptoBucketCellRangeKeys,
  ptoBucketKeyStartsInlineEdit,
  resolvePtoBucketCellByOffset,
  resolvePtoBucketKeyboardAction,
} from "../features/pto/ptoBucketsGridModel";
import { createPtoAreaAndBucketRowLookupSourceBundle } from "../features/pto/ptoDateLookupModel";

const rowKeys = ["row-a", "row-b", "row-c"];
const columnKeys = ["eq-1", "eq-2", "eq-3"];

assert.deepEqual(createPtoBucketGridKeys(rowKeys, columnKeys), [
  ["row-a::eq-1", "row-a::eq-2", "row-a::eq-3"],
  ["row-b::eq-1", "row-b::eq-2", "row-b::eq-3"],
  ["row-c::eq-1", "row-c::eq-2", "row-c::eq-3"],
]);

const lookupBundle = createPtoAreaAndBucketRowLookupSourceBundle([
  [
    { area: "Аксу", structure: "Подача руды" },
    { area: "Аксу", structure: "Подача руды" },
  ],
  [
    { area: "Аксу", structure: "Подача руды" },
    { area: "Аксу", structure: "Отсыпка" },
  ],
]);

assert.deepEqual(lookupBundle.areaSources, [{ area: "Аксу" }]);
assert.deepEqual(lookupBundle.bucketRowSources, [
  { area: "Аксу", structure: "Подача руды" },
  { area: "Аксу", structure: "Отсыпка" },
]);

assert.deepEqual(
  ptoBucketCellRangeKeys(
    rowKeys,
    columnKeys,
    { rowKey: "row-a", equipmentKey: "eq-2" },
    { rowKey: "row-c", equipmentKey: "eq-3" },
  ),
  [
    "row-a::eq-2",
    "row-a::eq-3",
    "row-b::eq-2",
    "row-b::eq-3",
    "row-c::eq-2",
    "row-c::eq-3",
  ],
);
assert.deepEqual(
  ptoBucketCellRangeKeys(
    rowKeys,
    columnKeys,
    { rowKey: "row-c", equipmentKey: "eq-3" },
    { rowKey: "row-b", equipmentKey: "eq-1" },
  ),
  [
    "row-b::eq-1",
    "row-b::eq-2",
    "row-b::eq-3",
    "row-c::eq-1",
    "row-c::eq-2",
    "row-c::eq-3",
  ],
);
assert.deepEqual(
  ptoBucketCellRangeKeys(
    rowKeys,
    columnKeys,
    { rowKey: "row-a", equipmentKey: "eq-1" },
    { rowKey: "missing-row", equipmentKey: "eq-1" },
  ),
  ["missing-row::eq-1"],
);

assert.deepEqual(
  resolvePtoBucketCellByOffset(rowKeys, columnKeys, { rowKey: "row-a", equipmentKey: "eq-2" }, 1, 1),
  {
    cell: { rowKey: "row-b", equipmentKey: "eq-3" },
    rowIndex: 1,
    columnIndex: 2,
  },
);

assert.deepEqual(
  resolvePtoBucketCellByOffset(rowKeys, columnKeys, { rowKey: "row-a", equipmentKey: "eq-1" }, -1, -1),
  {
    cell: { rowKey: "row-a", equipmentKey: "eq-1" },
    rowIndex: 0,
    columnIndex: 0,
  },
);
assert.deepEqual(
  resolvePtoBucketCellByOffset(rowKeys, columnKeys, { rowKey: "row-c", equipmentKey: "eq-3" }, 1, 1),
  {
    cell: { rowKey: "row-c", equipmentKey: "eq-3" },
    rowIndex: 2,
    columnIndex: 2,
  },
);
assert.deepEqual(
  resolvePtoBucketCellByOffset(rowKeys, columnKeys, { rowKey: "row-b", equipmentKey: "eq-2" }, -1, -1),
  {
    cell: { rowKey: "row-a", equipmentKey: "eq-1" },
    rowIndex: 0,
    columnIndex: 0,
  },
);
assert.equal(
  resolvePtoBucketCellByOffset(rowKeys, columnKeys, { rowKey: "missing-row", equipmentKey: "eq-1" }, 1, 0),
  null,
);

assert.equal(
  resolvePtoBucketCellByOffset([], columnKeys, { rowKey: "row-a", equipmentKey: "eq-1" }, 1, 0),
  null,
);
assert.equal(
  resolvePtoBucketCellByOffset(rowKeys, [], { rowKey: "row-a", equipmentKey: "eq-1" }, 1, 0),
  null,
);

assert.equal(ptoBucketKeyStartsInlineEdit("1"), true);
assert.equal(ptoBucketKeyStartsInlineEdit(","), true);
assert.equal(ptoBucketKeyStartsInlineEdit("-"), true);
assert.equal(ptoBucketKeyStartsInlineEdit("A"), false);
assert.equal(ptoBucketKeyStartsInlineEdit("Enter"), false);
assert.equal(ptoBucketKeyStartsInlineEdit("12"), false);
assert.equal(ptoBucketKeyStartsInlineEdit("+"), false);
assert.equal(ptoBucketKeyStartsInlineEdit(""), false);

assert.deepEqual(resolvePtoBucketKeyboardAction("ArrowDown", false), {
  type: "move",
  rowOffset: 1,
  columnOffset: 0,
  commitEditing: false,
});
assert.deepEqual(resolvePtoBucketKeyboardAction("ArrowRight", true), {
  type: "move",
  rowOffset: 0,
  columnOffset: 1,
  commitEditing: true,
});
assert.deepEqual(resolvePtoBucketKeyboardAction("ArrowLeft", true), {
  type: "move",
  rowOffset: 0,
  columnOffset: -1,
  commitEditing: true,
});
assert.deepEqual(resolvePtoBucketKeyboardAction("ArrowUp", false), {
  type: "move",
  rowOffset: -1,
  columnOffset: 0,
  commitEditing: false,
});
assert.deepEqual(resolvePtoBucketKeyboardAction("Enter", true), { type: "commit-edit" });
assert.deepEqual(resolvePtoBucketKeyboardAction("Enter", false), { type: "start-edit" });
assert.deepEqual(resolvePtoBucketKeyboardAction("Escape", true), { type: "cancel-edit" });
assert.deepEqual(resolvePtoBucketKeyboardAction("Escape", false), { type: "clear-selection" });
assert.deepEqual(resolvePtoBucketKeyboardAction("Delete", false), { type: "clear-cells" });
assert.deepEqual(resolvePtoBucketKeyboardAction("7", false), { type: "start-edit-with-draft", draft: "7" });
assert.deepEqual(resolvePtoBucketKeyboardAction(",", false), { type: "start-edit-with-draft", draft: "," });
assert.deepEqual(resolvePtoBucketKeyboardAction("7", true), { type: "none" });
assert.deepEqual(resolvePtoBucketKeyboardAction("Backspace", false), { type: "none" });
assert.deepEqual(resolvePtoBucketKeyboardAction("A", false), { type: "none" });
