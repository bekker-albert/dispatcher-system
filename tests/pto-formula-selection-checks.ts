import assert from "node:assert/strict";
import { createPtoDateFormulaModel, createPtoDateFormulaSelectionModel, ptoFormulaCellMatches } from "../features/pto/ptoDateFormulaModel";
import { createPtoDateFormulaSelectionActions } from "../features/pto/ptoDateFormulaSelectionActions";
import type { PtoFormulaCell, PtoFormulaCellWithoutScope } from "../features/pto/ptoDateFormulaTypes";
import {
  resolvePtoFormulaMoveTarget,
  selectedPtoFormulaCells,
  togglePtoFormulaSelectionKeys,
} from "../features/pto/ptoDateFormulaSelectionModel";

function applyState<T>(currentValue: T, value: T | ((previous: T) => T)) {
  return typeof value === "function" ? (value as (previous: T) => T)(currentValue) : value;
}

function createState() {
  return {
    formulaCell: null as PtoFormulaCell | null,
    formulaDraft: "",
    inlineEditCell: null as PtoFormulaCell | null,
    inlineEditInitialDraft: "",
    selectedCellKeys: [] as string[],
    selectionAnchorCell: null as PtoFormulaCell | null,
  };
}

function createActions(state: ReturnType<typeof createState>, editing = true) {
  const scope = "plan:2026:";
  const formulaSelectionKey = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => (
    `${scope}${cell.rowId}:${cell.kind}:${cell.month ?? cell.day ?? ""}`
  );

  return createPtoDateFormulaSelectionActions({
    activeFormulaCell: state.formulaCell,
    formulaRangeKeys: (anchor, target) => [formulaSelectionKey(anchor), formulaSelectionKey(target)],
    formulaSelectionKey,
    formulaSelectionScope: scope,
    ptoDateEditing: editing,
    ptoInlineEditInitialDraft: state.inlineEditInitialDraft,
    ptoPlanYear: "2026",
    ptoSelectionAnchorCell: state.selectionAnchorCell,
    ptoTab: "plan",
    setPtoFormulaCell: (value) => { state.formulaCell = applyState(state.formulaCell, value); },
    setPtoFormulaDraft: (value) => { state.formulaDraft = applyState(state.formulaDraft, value); },
    setPtoInlineEditCell: (value) => { state.inlineEditCell = applyState(state.inlineEditCell, value); },
    setPtoInlineEditInitialDraft: (value) => { state.inlineEditInitialDraft = applyState(state.inlineEditInitialDraft, value); },
    setPtoSelectedCellKeys: (value) => { state.selectedCellKeys = applyState(state.selectedCellKeys, value); },
    setPtoSelectionAnchorCell: (value) => { state.selectionAnchorCell = applyState(state.selectionAnchorCell, value); },
  });
}

const firstCell: PtoFormulaCellWithoutScope = {
  rowId: "row-1",
  kind: "day",
  label: "01",
  day: "2026-01-01",
};
const secondCell: PtoFormulaCellWithoutScope = {
  rowId: "row-2",
  kind: "day",
  label: "02",
  day: "2026-01-02",
};

const state = createState();
createActions(state).selectFormulaCell(firstCell, 5);
assert.deepEqual(state.formulaCell, { ...firstCell, table: "plan", year: "2026" });
assert.equal(state.formulaDraft, "5");
assert.deepEqual(state.selectedCellKeys, ["plan:2026:row-1:day:2026-01-01"]);

createActions(state).selectFormulaRange(secondCell, 7);
assert.deepEqual(state.selectedCellKeys, [
  "plan:2026:row-1:day:2026-01-01",
  "plan:2026:row-2:day:2026-01-02",
]);

createActions(state).toggleFormulaCell(firstCell, 5);
assert.deepEqual(state.selectedCellKeys, [
  "plan:2026:row-2:day:2026-01-02",
]);

createActions(state).startInlineFormulaEdit(firstCell, 5, "9");
assert.deepEqual(state.inlineEditCell, { ...firstCell, table: "plan", year: "2026" });
assert.equal(state.formulaDraft, "9");
assert.equal(state.inlineEditInitialDraft, "9");

state.formulaDraft = "123";
createActions(state).cancelInlineFormulaEdit();
assert.equal(state.formulaDraft, "9");
assert.equal(state.inlineEditCell, null);
assert.equal(state.inlineEditInitialDraft, "");

const sameRenderState = createState();
const sameRenderActions = createActions(sameRenderState);
sameRenderActions.startInlineFormulaEdit(firstCell, 5, "11");
sameRenderState.formulaDraft = "999";
sameRenderActions.cancelInlineFormulaEdit();
assert.equal(sameRenderState.formulaDraft, "11");
assert.equal(sameRenderState.inlineEditCell, null);
assert.equal(sameRenderState.inlineEditInitialDraft, "");

const disabledState = createState();
createActions(disabledState, false).collapseFormulaSelection(firstCell);
assert.equal(disabledState.formulaCell, null);
assert.deepEqual(disabledState.selectedCellKeys, []);

assert.deepEqual(togglePtoFormulaSelectionKeys([
  "plan:2026:row-1:day:2026-01-01",
  "oper:2026:row-1:day:2026-01-01",
], "plan:2026:", "plan:2026:row-2:day:2026-01-02"), [
  "plan:2026:row-1:day:2026-01-01",
  "plan:2026:row-2:day:2026-01-02",
]);

assert.deepEqual(
  selectedPtoFormulaCells(new Set([
    "plan:2026:row-1:day:2026-01-01",
    "plan:2026:missing:day:2026-01-01",
  ]), (key) => (key.includes("missing") ? null : firstCell)),
  [firstCell],
);

const moveTarget = resolvePtoFormulaMoveTarget({
  activeCell: { ...firstCell, table: "plan", year: "2026" },
  key: "ArrowDown",
  templateIndexByKey: new Map([["day:2026-01-01", 0]]),
  templates: [firstCell],
  filteredRows: [{ id: "row-1" }, { id: "row-2" }] as never,
  formulaCellFromTemplate: (rowId, template) => ({ ...template, rowId }),
});
assert.deepEqual(moveTarget, { ...firstCell, rowId: "row-2" });

const clampedMoveTarget = resolvePtoFormulaMoveTarget({
  activeCell: { ...firstCell, table: "plan", year: "2026" },
  key: "ArrowUp",
  templateIndexByKey: new Map([["day:2026-01-01", 0]]),
  templates: [firstCell],
  filteredRows: [{ id: "row-1" }, { id: "row-2" }] as never,
  formulaCellFromTemplate: (rowId, template) => ({ ...template, rowId }),
});
assert.deepEqual(clampedMoveTarget, firstCell);

assert.equal(resolvePtoFormulaMoveTarget({
  activeCell: { ...firstCell, table: "plan", year: "2026" },
  key: "ArrowDown",
  templateIndexByKey: new Map(),
  templates: [],
  filteredRows: [],
  formulaCellFromTemplate: (rowId, template) => ({ ...template, rowId }),
}), null);

const formulaModel = createPtoDateFormulaModel({
  table: "plan",
  year: "2026",
  renderedRows: [{ id: "row-1" }, { id: "row-2" }] as never,
  filteredRows: [{ id: "row-1" }, { id: "row-2" }] as never,
  displayMonthGroups: [{
    month: "2026-01",
    label: "January",
    days: ["2026-01-01"],
    expanded: true,
  }] as never,
  editableMonthTotal: true,
  carryoverHeader: "Carryover",
});
const formulaSelectionModel = createPtoDateFormulaSelectionModel({
  formulaSelectionKey: formulaModel.formulaSelectionKey,
  formulaSelectionScope: formulaModel.formulaSelectionScope,
  selectedCellKeys: ["plan:2026:row-1:day:2026-01-01"],
});
assert.equal(
  formulaModel.formulaSelectionKey({ rowId: "row-1", kind: "day", day: "2026-01-01" }),
  "plan:2026:row-1:day:2026-01-01",
);
assert.equal(formulaSelectionModel.formulaCellSelected("row-1", "day", "2026-01-01"), true);
assert.deepEqual(
  formulaModel.formulaRangeKeys(
    { rowId: "row-2", kind: "day", day: "2026-01-01", label: "01", table: "plan", year: "2026" },
    { rowId: "row-1", kind: "month", month: "2026-01", label: "January", table: "plan", year: "2026" },
  ),
  [
    "plan:2026:row-1:month:2026-01",
    "plan:2026:row-1:day:2026-01-01",
    "plan:2026:row-2:month:2026-01",
    "plan:2026:row-2:day:2026-01-01",
  ],
);
assert.deepEqual(
  formulaModel.formulaRangeKeys(
    { rowId: "missing", kind: "day", day: "2026-01-01", label: "01", table: "plan", year: "2026" },
    { rowId: "row-1", kind: "day", day: "2026-01-01", label: "01", table: "plan", year: "2026" },
  ),
  ["plan:2026:row-1:day:2026-01-01"],
);
assert.equal(
  ptoFormulaCellMatches({ ...firstCell, table: "plan", year: "2026" }, "plan", "2026", "row-1", "day", "2026-01-01"),
  true,
);
