import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { createPtoDateEditableProps } from "../features/pto/ptoDateEditablePropsModel";
import type { createPtoDateReadonlyProps } from "../features/pto/ptoDateReadonlyPropsModel";
import type { createPtoDateFormulaBarProps } from "../features/pto/ptoDateFormulaBarModel";
import type { createPtoDateEditableRowModel } from "../features/pto/PtoDateEditableRowModel";
import {
  createPtoAreaAndBucketRowLookupSourceBundle,
  createPtoBucketRowLookupSources,
  createPtoDateLookupSourceBundle,
  ptoBucketRowLookupSourcesSignature,
} from "../features/pto/ptoDateLookupModel";
import { createPtoDateVisibleRowHeightsModel } from "../features/pto/ptoDateVirtualRowsViewModel";
import type { usePtoDateRowsColumnsModel } from "../features/pto/ptoDateRowsColumnsModel";
import type { usePtoDateViewportRefresh } from "../features/pto/ptoDateViewportModel";

const testDir = dirname(fileURLToPath(import.meta.url));
const ptoDateTableModelSource = readFileSync(resolve(testDir, "../features/pto/ptoDateTableModel.ts"), "utf8");
const ptoDateRowsColumnsModelSource = readFileSync(resolve(testDir, "../features/pto/ptoDateRowsColumnsModel.ts"), "utf8");
const ptoDateReadonlyTableSource = readFileSync(resolve(testDir, "../features/pto/PtoDateReadonlyTable.tsx"), "utf8");

type PtoDateContainerModelCoverage = {
  editableProps: typeof createPtoDateEditableProps;
  editableRow: typeof createPtoDateEditableRowModel;
  formulaBar: typeof createPtoDateFormulaBarProps;
  readonlyProps: typeof createPtoDateReadonlyProps;
  rowsColumns: typeof usePtoDateRowsColumnsModel;
  viewport: typeof usePtoDateViewportRefresh;
};

const coveredModules: Record<keyof PtoDateContainerModelCoverage, string> = {
  editableProps: "ptoDateEditablePropsModel",
  editableRow: "PtoDateEditableRowModel",
  formulaBar: "ptoDateFormulaBarModel",
  readonlyProps: "ptoDateReadonlyPropsModel",
  rowsColumns: "ptoDateRowsColumnsModel",
  viewport: "ptoDateViewportModel",
};

assert.deepEqual(Object.values(coveredModules), [
  "ptoDateEditablePropsModel",
  "PtoDateEditableRowModel",
  "ptoDateFormulaBarModel",
  "ptoDateReadonlyPropsModel",
  "ptoDateRowsColumnsModel",
  "ptoDateViewportModel",
]);

const lookupBaseRows = [{
  id: "row-1",
  area: "Аксу",
  location: "Карьер",
  structure: "Перевозка",
  unit: "м3",
  status: "",
  carryover: 0,
  dailyPlans: {
    "2026-04-01": 10,
    "2026-04-02": 20,
  },
  years: [],
}];
const lookupChangedValueRows = [{
  ...lookupBaseRows[0],
  dailyPlans: {
    "2026-04-01": 999,
    "2026-04-02": 20,
  },
}];
const lookupChangedDateRows = [{
  ...lookupBaseRows[0],
  dailyPlans: {
    ...lookupBaseRows[0].dailyPlans,
    "2027-01-01": 1,
  },
}];
const lookupChangedStructureRows = [{
  ...lookupBaseRows[0],
  structure: "Погрузка",
}];

const lookupBaseBundle = createPtoDateLookupSourceBundle(lookupBaseRows);
const lookupChangedValueBundle = createPtoDateLookupSourceBundle(lookupChangedValueRows);
const lookupChangedDateBundle = createPtoDateLookupSourceBundle(lookupChangedDateRows);
const lookupChangedStructureBundle = createPtoDateLookupSourceBundle(lookupChangedStructureRows);

assert.equal(lookupBaseBundle.signature, lookupChangedValueBundle.signature);
assert.notEqual(lookupBaseBundle.signature, lookupChangedDateBundle.signature);
assert.notEqual(lookupBaseBundle.signature, lookupChangedStructureBundle.signature);
assert.equal(
  ptoBucketRowLookupSourcesSignature(createPtoBucketRowLookupSources(lookupBaseRows)),
  ptoBucketRowLookupSourcesSignature(createPtoBucketRowLookupSources(lookupChangedValueRows)),
);
assert.notEqual(
  ptoBucketRowLookupSourcesSignature(createPtoBucketRowLookupSources(lookupBaseRows)),
  ptoBucketRowLookupSourcesSignature(createPtoBucketRowLookupSources(lookupChangedStructureRows)),
);
const combinedLookupBundle = createPtoAreaAndBucketRowLookupSourceBundle([lookupBaseRows, lookupChangedStructureRows]);
assert.deepEqual(combinedLookupBundle.areaSources.map((source) => source.area), [lookupBaseRows[0].area]);
assert.deepEqual(combinedLookupBundle.bucketRowSources.map((source) => source.structure), [lookupBaseRows[0].structure, lookupChangedStructureRows[0].structure]);

const visibleHeights = createPtoDateVisibleRowHeightsModel(lookupBaseRows, {
  "plan:row-1": 56,
  "oper:row-1": 88,
  "plan:missing": 120,
}, "plan");
assert.deepEqual(visibleHeights.rowHeights, { "plan:row-1": 56 });
assert.equal(visibleHeights.signature, "row-1:56");

assert.match(ptoDateTableModelSource, /const rowsByYearAndSignature = new Map<string, Map<string, PtoPlanRow\[]>>\(\);/);
assert.match(ptoDateTableModelSource, /const cache = new WeakMap<PtoPlanRow, PtoRowDateTotals>\(\);/);
assert.match(ptoDateTableModelSource, /const indexedRowsForYear = \(targetYear: string\) => \{/);
assert.match(ptoDateTableModelSource, /const totalWithCarryover = \(row: PtoPlanRow, targetYear: string\): number => \{/);
assert.match(ptoDateRowsColumnsModelSource, /createPtoDateVisibleRowHeightsModel\(filteredRows, ptoRowHeights, ptoTab\)/);
assert.match(ptoDateRowsColumnsModelSource, /rowHeights: visibleRowHeights\.rowHeights/);
assert.match(ptoDateRowsColumnsModelSource, /visibleRowHeights\.signature/);
assert.match(ptoDateRowsColumnsModelSource, /\[filteredRows, ptoTab, visibleRowHeights\.signature\]/);
assert.match(ptoDateRowsColumnsModelSource, /const virtualRowsModel = useMemo\(\(\) => createPtoDateVirtualRowsViewModel\(\{/);
assert.match(ptoDateReadonlyTableSource, /const PtoDateReadonlyRow = memo\(function PtoDateReadonlyRow/);
assert.match(ptoDateReadonlyTableSource, /<PtoDateReadonlyRow[\s\S]*row=\{row\}/);
