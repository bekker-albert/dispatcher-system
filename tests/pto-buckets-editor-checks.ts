import assert from "node:assert/strict";
import {
  applyPtoBucketValueDraft,
  clearPtoBucketValueKeys,
  createPtoBucketManualRowDraft,
  normalizePtoBucketDraftValue,
  removePtoBucketManualRowValues,
} from "../features/pto/ptoBucketsEditorModel";
import { allAreasLabel } from "../features/pto/ptoBucketsConfig";

const fallbackManualRow = createPtoBucketManualRowDraft("", "  Temporary work  ", " Mine A ", []);
assert.deepEqual(fallbackManualRow, {
  key: "minea:temporarywork",
  area: "Mine A",
  structure: "Temporary work",
  source: "manual",
});
assert.equal(createPtoBucketManualRowDraft("", "Temporary work", allAreasLabel, []), null);
assert.equal(createPtoBucketManualRowDraft("Mine A", "Temporary work", allAreasLabel, [fallbackManualRow!]), null);

assert.equal(normalizePtoBucketDraftValue("12,345"), 12.35);
assert.equal(normalizePtoBucketDraftValue(" 1 234,567 "), 1234.57);
assert.equal(normalizePtoBucketDraftValue("-1.235"), -1.24);
assert.equal(normalizePtoBucketDraftValue(""), null);
assert.equal(normalizePtoBucketDraftValue("-"), null);
assert.equal(normalizePtoBucketDraftValue("abc"), null);

const currentValues = { keep: 1, "row::eq": 5 };
assert.deepEqual(applyPtoBucketValueDraft(currentValues, "row::eq", "2,345"), {
  values: { keep: 1, "row::eq": 2.35 },
  value: 2.35,
});
assert.deepEqual(applyPtoBucketValueDraft({ keep: 1, "row::eq": 2 }, "row::eq", ""), {
  values: { keep: 1 },
  value: null,
});
assert.deepEqual(currentValues, { keep: 1, "row::eq": 5 });

const valuesToClear = { a: 1, b: 2, c: 3 };
assert.deepEqual(clearPtoBucketValueKeys(valuesToClear, ["a", "c", "missing", "a"]), { b: 2 });
assert.deepEqual(valuesToClear, { a: 1, b: 2, c: 3 });
assert.deepEqual(
  removePtoBucketManualRowValues({ "row::eq-1": 1, "row::eq-2": 2, "row-extra::eq-1": 4, other: 3 }, "row"),
  { "row-extra::eq-1": 4, other: 3 },
);

const manualRow = createPtoBucketManualRowDraft(" Аксу ", " Временная работа ", "Все участки", []);
assert.deepEqual(manualRow, {
  key: "аксу:временнаяработа",
  area: "Аксу",
  structure: "Временная работа",
  source: "manual",
});
assert.equal(createPtoBucketManualRowDraft("", "Структура", "Акбакай", [])?.area, "Акбакай");
assert.equal(createPtoBucketManualRowDraft("", "Структура", "Все участки", []), null);
assert.equal(createPtoBucketManualRowDraft("Аксу", "Временная работа", "Все участки", [manualRow!]), null);
