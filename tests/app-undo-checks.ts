import assert from "node:assert/strict";
import { createAppUndoSnapshot, restoreAppUndoSnapshot } from "../features/app/appUndoSnapshots";
import { defaultDependencyLinkForm } from "../lib/domain/admin/structure";
import type { UndoSnapshot } from "../lib/domain/app/undo";
import { createDefaultSubTabs } from "../lib/domain/navigation/tabs";
import type { PtoBucketRow } from "../lib/domain/pto/buckets";
import { defaultVehicleForm } from "../lib/domain/vehicles/defaults";
import { normalizeVehicleRow } from "../lib/domain/vehicles/defaults";

const vehicle = normalizeVehicleRow({ ...defaultVehicleForm, id: 1, brand: "Howo" });
const ptoBucketManualRow: PtoBucketRow = {
  key: "area:structure",
  area: "Area",
  structure: "Structure",
  source: "manual",
};
const makePtoRow = (id: string, structure: string) => ({
  id,
  area: "Area",
  location: "",
  structure,
  unit: "m3",
  status: "",
  carryover: 0,
  dailyPlans: { "2026-01-01": 1 },
  years: ["2026"],
});
const snapshot: UndoSnapshot = {
  reportCustomers: [{
    id: "customer-1",
    label: "Customer",
    ptoCode: "C1",
    visible: true,
    autoShowRows: true,
    rowKeys: [],
    hiddenRowKeys: [],
    rowLabels: {},
    factSourceRowKeys: {},
    summaryRows: [],
    areaOrder: [],
    workOrder: {},
  }],
  reportAreaOrder: ["Area"],
  reportWorkOrder: { Area: ["Structure"] },
  reportHeaderLabels: { header: "Header" },
  reportColumnWidths: { header: 120 },
  reportReasons: { reason: "Reason" },
  areaShiftCutoffs: { Area: "20:00" },
  customTabs: [{ id: "custom", title: "Custom", description: "", items: [], visible: true }],
  topTabs: [{ id: "reports", label: "Reports", visible: true }],
  subTabs: createDefaultSubTabs([]),
  vehicleRows: [vehicle],
  ptoManualYears: ["2026"],
  expandedPtoMonths: { "2026-01": true },
  ptoPlanRows: [makePtoRow("plan-1", "Structure")],
  ptoSurveyRows: [makePtoRow("survey-1", "Survey")],
  ptoOperRows: [makePtoRow("oper-1", "Oper")],
  ptoColumnWidths: { area: 160 },
  ptoRowHeights: { "plan-1": 34 },
  ptoHeaderLabels: { area: "Area" },
  ptoBucketValues: { "area:structure::loader": 8.5 },
  ptoBucketManualRows: [ptoBucketManualRow],
  orgMembers: [{
    id: "member-1",
    name: "Member",
    position: "Role",
    department: "Department",
    area: "Area",
    linearManagerId: "",
    functionalManagerId: "",
    active: true,
  }],
  dependencyNodes: [{ id: "node-1", name: "Node", kind: "task", owner: "Owner", visible: true }],
  dependencyLinks: [{
    id: "link-1",
    fromNodeId: "node-1",
    toNodeId: "node-2",
    linkType: defaultDependencyLinkForm.linkType,
    rule: "",
    owner: "Owner",
    visible: true,
  }],
};

type SetterCalls = Record<string, unknown[]>;

function recordSetter(calls: SetterCalls, name: string) {
  return (value: unknown) => {
    calls[name] = [...(calls[name] ?? []), value];
  };
}

function lastCall<T>(calls: SetterCalls, name: string) {
  const values = calls[name] ?? [];
  assert.ok(values.length > 0, `${name} was not called`);
  return values[values.length - 1] as T;
}

function createRestoreTarget(databaseConfigured: boolean, ptoDatabaseLoaded: boolean) {
  const calls: SetterCalls = {};
  const adminLogs: unknown[] = [];
  const saveRevisions: number[] = [];

  const target = {
    databaseConfigured,
    ptoDatabaseLoadedRef: { current: ptoDatabaseLoaded },
    setPtoSaveRevision: (updater: unknown) => {
      saveRevisions.push(typeof updater === "function" ? (updater as (revision: number) => number)(4) : Number(updater));
    },
    addAdminLog: (entry: unknown) => {
      adminLogs.push(entry);
    },
    setReportCustomers: recordSetter(calls, "setReportCustomers"),
    setReportAreaOrder: recordSetter(calls, "setReportAreaOrder"),
    setReportWorkOrder: recordSetter(calls, "setReportWorkOrder"),
    setReportHeaderLabels: recordSetter(calls, "setReportHeaderLabels"),
    setReportColumnWidths: recordSetter(calls, "setReportColumnWidths"),
    setReportReasons: recordSetter(calls, "setReportReasons"),
    setAreaShiftCutoffs: recordSetter(calls, "setAreaShiftCutoffs"),
    setCustomTabs: recordSetter(calls, "setCustomTabs"),
    setTopTabs: recordSetter(calls, "setTopTabs"),
    setSubTabs: recordSetter(calls, "setSubTabs"),
    setVehicleRows: recordSetter(calls, "setVehicleRows"),
    setPtoManualYears: recordSetter(calls, "setPtoManualYears"),
    setExpandedPtoMonths: recordSetter(calls, "setExpandedPtoMonths"),
    setPtoPlanRows: recordSetter(calls, "setPtoPlanRows"),
    setPtoSurveyRows: recordSetter(calls, "setPtoSurveyRows"),
    setPtoOperRows: recordSetter(calls, "setPtoOperRows"),
    setPtoColumnWidths: recordSetter(calls, "setPtoColumnWidths"),
    setPtoRowHeights: recordSetter(calls, "setPtoRowHeights"),
    setPtoHeaderLabels: recordSetter(calls, "setPtoHeaderLabels"),
    setPtoBucketValues: recordSetter(calls, "setPtoBucketValues"),
    setPtoBucketManualRows: recordSetter(calls, "setPtoBucketManualRows"),
    setOrgMembers: recordSetter(calls, "setOrgMembers"),
    setDependencyNodes: recordSetter(calls, "setDependencyNodes"),
    setDependencyLinks: recordSetter(calls, "setDependencyLinks"),
    setEditingVehicleCell: recordSetter(calls, "setEditingVehicleCell"),
    setVehicleCellDraft: recordSetter(calls, "setVehicleCellDraft"),
    setVehicleCellInitialDraft: recordSetter(calls, "setVehicleCellInitialDraft"),
    setPtoInlineEditCell: recordSetter(calls, "setPtoInlineEditCell"),
    setPtoInlineEditInitialDraft: recordSetter(calls, "setPtoInlineEditInitialDraft"),
    setPtoFormulaDraft: recordSetter(calls, "setPtoFormulaDraft"),
    setEditingPtoHeaderKey: recordSetter(calls, "setEditingPtoHeaderKey"),
    setPtoHeaderDraft: recordSetter(calls, "setPtoHeaderDraft"),
    setEditingReportHeaderKey: recordSetter(calls, "setEditingReportHeaderKey"),
    setReportHeaderDraft: recordSetter(calls, "setReportHeaderDraft"),
    setOpenVehicleFilter: recordSetter(calls, "setOpenVehicleFilter"),
  };

  return {
    adminLogs,
    calls,
    saveRevisions,
    target: target as unknown as Parameters<typeof restoreAppUndoSnapshot>[1],
  };
}

const { adminLogs, calls, saveRevisions, target } = createRestoreTarget(true, true);
restoreAppUndoSnapshot(snapshot, target);

const restoredVehicleRows = lastCall<typeof snapshot.vehicleRows>(calls, "setVehicleRows");
assert.notEqual(restoredVehicleRows, snapshot.vehicleRows);
assert.notEqual(restoredVehicleRows[0], snapshot.vehicleRows[0]);
snapshot.vehicleRows[0].brand = "Changed";
assert.equal(restoredVehicleRows[0].brand, "Howo");

const { vehicleRows: omittedVehicleRows, ...snapshotSource } = snapshot;
assert.equal(omittedVehicleRows.length, 1);
const appSnapshot = createAppUndoSnapshot(snapshotSource);
assert.equal("vehicleRows" in appSnapshot, false);

const restoreWithoutVehicles = createRestoreTarget(true, true);
restoreAppUndoSnapshot(appSnapshot, restoreWithoutVehicles.target);
assert.equal(restoreWithoutVehicles.calls.setVehicleRows, undefined);

const reportOnlySnapshot = createAppUndoSnapshot(snapshotSource, "reports");
assert.equal("reportReasons" in reportOnlySnapshot, true);
assert.equal("ptoPlanRows" in reportOnlySnapshot, false);
assert.equal("orgMembers" in reportOnlySnapshot, false);

const ptoOnlySnapshot = createAppUndoSnapshot(snapshotSource, "pto");
assert.equal("ptoPlanRows" in ptoOnlySnapshot, true);
assert.equal("reportReasons" in ptoOnlySnapshot, false);

const restoreReportOnly = createRestoreTarget(true, true);
restoreAppUndoSnapshot(reportOnlySnapshot, restoreReportOnly.target);
assert.equal(restoreReportOnly.calls.setReportReasons?.length, 1);
assert.equal(restoreReportOnly.calls.setPtoPlanRows, undefined);
assert.deepEqual(restoreReportOnly.saveRevisions, []);

assert.deepEqual(lastCall(calls, "setPtoBucketValues"), { "area:structure::loader": 8.5 });
assert.deepEqual(lastCall(calls, "setPtoBucketManualRows"), [ptoBucketManualRow]);

assert.deepEqual(saveRevisions, [5]);
assert.equal(adminLogs.length, 1);
assert.match(String((adminLogs[0] as { details?: unknown }).details), /Ctrl\+Z/);

assert.deepEqual(lastCall(calls, "setEditingVehicleCell"), null);
assert.deepEqual(lastCall(calls, "setVehicleCellDraft"), "");
assert.deepEqual(lastCall(calls, "setVehicleCellInitialDraft"), "");
assert.deepEqual(lastCall(calls, "setPtoInlineEditCell"), null);
assert.deepEqual(lastCall(calls, "setPtoInlineEditInitialDraft"), "");
assert.deepEqual(lastCall(calls, "setPtoFormulaDraft"), "");
assert.deepEqual(lastCall(calls, "setEditingPtoHeaderKey"), null);
assert.deepEqual(lastCall(calls, "setPtoHeaderDraft"), "");
assert.deepEqual(lastCall(calls, "setEditingReportHeaderKey"), null);
assert.deepEqual(lastCall(calls, "setReportHeaderDraft"), "");
assert.deepEqual(lastCall(calls, "setOpenVehicleFilter"), null);

[
  { configured: false, loaded: true },
  { configured: true, loaded: false },
  { configured: false, loaded: false },
].forEach(({ configured, loaded }) => {
  const restore = createRestoreTarget(configured, loaded);
  restoreAppUndoSnapshot(snapshot, restore.target);
  assert.deepEqual(restore.saveRevisions, []);
  assert.equal(restore.adminLogs.length, 1);
});
