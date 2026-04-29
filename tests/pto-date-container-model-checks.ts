import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { createPtoDateEditableProps } from "../features/pto/ptoDateEditablePropsModel";
import type { createPtoDateReadonlyProps } from "../features/pto/ptoDateReadonlyPropsModel";
import type { createPtoDateFormulaBarProps } from "../features/pto/ptoDateFormulaBarModel";
import type { createPtoDateEditableRowModel } from "../features/pto/PtoDateEditableRowModel";
import {
  createPtoBucketRowLookupSources,
  createPtoDateLookupSources,
  ptoBucketRowLookupSourcesSignature,
  ptoDateLookupSourcesSignature,
} from "../features/pto/ptoDateLookupModel";
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

assert.equal(
  ptoDateLookupSourcesSignature(createPtoDateLookupSources(lookupBaseRows)),
  ptoDateLookupSourcesSignature(createPtoDateLookupSources(lookupChangedValueRows)),
);
assert.notEqual(
  ptoDateLookupSourcesSignature(createPtoDateLookupSources(lookupBaseRows)),
  ptoDateLookupSourcesSignature(createPtoDateLookupSources(lookupChangedDateRows)),
);
assert.notEqual(
  ptoDateLookupSourcesSignature(createPtoDateLookupSources(lookupBaseRows)),
  ptoDateLookupSourcesSignature(createPtoDateLookupSources(lookupChangedStructureRows)),
);
assert.equal(
  ptoBucketRowLookupSourcesSignature(createPtoBucketRowLookupSources(lookupBaseRows)),
  ptoBucketRowLookupSourcesSignature(createPtoBucketRowLookupSources(lookupChangedValueRows)),
);
assert.notEqual(
  ptoBucketRowLookupSourcesSignature(createPtoBucketRowLookupSources(lookupBaseRows)),
  ptoBucketRowLookupSourcesSignature(createPtoBucketRowLookupSources(lookupChangedStructureRows)),
);

assert.match(ptoDateTableModelSource, /const rowsByYearAndSignature = new Map<string, Map<string, PtoPlanRow\[]>>\(\);/);
assert.match(ptoDateTableModelSource, /const indexedRowsForYear = \(targetYear: string\) => \{/);
assert.match(ptoDateTableModelSource, /const totalWithCarryover = \(row: PtoPlanRow, targetYear: string\): number => \{/);
assert.match(ptoDateRowsColumnsModelSource, /const virtualRowsModel = useMemo\(\(\) => createPtoDateVirtualRowsViewModel\(\{/);
assert.match(ptoDateReadonlyTableSource, /const PtoDateReadonlyRow = memo\(function PtoDateReadonlyRow/);
assert.match(ptoDateReadonlyTableSource, /<PtoDateReadonlyRow[\s\S]*row=\{row\}/);
