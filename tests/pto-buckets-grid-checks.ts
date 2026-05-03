import assert from "node:assert/strict";
import {
  createPtoBucketGridKeys,
  createPtoBucketSelectedKeysByRow,
  emptyPtoBucketSelectedKeysByRow,
  ptoBucketCellRangeKeys,
  ptoBucketKeyStartsInlineEdit,
  resolvePtoBucketCellByOffset,
  resolvePtoBucketKeyboardAction,
} from "../features/pto/ptoBucketsGridModel";
import {
  createPtoAreaAndBucketRowLookupSourceBundle,
  ptoAreaAndBucketRowGroupsSignature,
} from "../features/pto/ptoDateLookupModel";
import {
  createPtoBucketColumnsModel,
  createPtoBucketRowsModel,
} from "../lib/domain/pto/buckets";

const rowKeys = ["row-a", "row-b", "row-c"];
const columnKeys = ["eq-1", "eq-2", "eq-3"];

const bucketColumnsModel = createPtoBucketColumnsModel([
  {
    visible: true,
    vehicleType: "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440",
    brand: "CAT",
    model: "336",
    name: "CAT 336",
  },
  {
    visible: true,
    vehicleType: "\u041f\u043e\u0433\u0440\u0443\u0437\u0447\u0438\u043a",
    brand: "Liebherr",
    model: "566",
    name: "Liebherr 566",
  },
  {
    visible: true,
    vehicleType: "\u0421\u0430\u043c\u043e\u0441\u0432\u0430\u043b",
    brand: "Howo",
    model: "371",
    name: "Howo 371",
  },
] as never);
assert.deepEqual(bucketColumnsModel.columns.map((column) => column.label), ["CAT 336", "Liebherr 566"]);

assert.equal(
  createPtoBucketRowsModel(
    [{ area: "\u0410\u043a\u0441\u0443", structure: "\u041f\u043e\u0434\u0430\u0447\u0430 \u0440\u0443\u0434\u044b" }],
    [],
    "\u0412\u0441\u0435 \u0443\u0447\u0430\u0441\u0442\u043a\u0438",
  ).rows.length,
  1,
);

assert.deepEqual(createPtoBucketGridKeys(rowKeys, columnKeys), [
  ["row-a::eq-1", "row-a::eq-2", "row-a::eq-3"],
  ["row-b::eq-1", "row-b::eq-2", "row-b::eq-3"],
  ["row-c::eq-1", "row-c::eq-2", "row-c::eq-3"],
]);

const selectedKeysByRow = createPtoBucketSelectedKeysByRow(new Set([
  "row-a::eq-1",
  "row-a::eq-3",
  "row-c::eq-2",
  "bad-key",
]));
assert.deepEqual(Array.from(selectedKeysByRow.get("row-a") ?? []), ["row-a::eq-1", "row-a::eq-3"]);
assert.deepEqual(Array.from(selectedKeysByRow.get("row-c") ?? []), ["row-c::eq-2"]);
assert.equal(selectedKeysByRow.has("bad-key"), false);
assert.equal(createPtoBucketSelectedKeysByRow(new Set()), emptyPtoBucketSelectedKeysByRow);

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
assert.equal(
  ptoAreaAndBucketRowGroupsSignature([
    [
      { area: "A", structure: "S1" },
      { area: "A", structure: "S2" },
    ],
    [{ area: "B", structure: "S3" }],
  ]),
  "A\u001fS1\u001eA\u001fS2\u001dB\u001fS3",
);

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
