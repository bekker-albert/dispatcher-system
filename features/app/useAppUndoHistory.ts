"use client";

import { useCallback, useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { cloneUndoSnapshot, type UndoSnapshot } from "@/lib/domain/app/undo";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import { cloneVehicleRows } from "@/lib/domain/vehicles/filtering";
import type { VehicleFilterKey } from "@/lib/domain/vehicles/grid";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;
type SnapshotSetter<Key extends keyof UndoSnapshot> = Dispatch<SetStateAction<UndoSnapshot[Key]>>;

type AppUndoHistoryOptions = {
  adminDataLoaded: boolean;
  topTab: string;
  adminSection: string;
  databaseConfigured: boolean;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  vehicleRows: UndoSnapshot["vehicleRows"];
  vehicleRowsRef: RefObject<UndoSnapshot["vehicleRows"]>;
  setPtoSaveRevision: Dispatch<SetStateAction<number>>;
  addAdminLog: (entry: AdminLogInput) => void;
  reportCustomers: UndoSnapshot["reportCustomers"];
  reportAreaOrder: UndoSnapshot["reportAreaOrder"];
  reportWorkOrder: UndoSnapshot["reportWorkOrder"];
  reportHeaderLabels: UndoSnapshot["reportHeaderLabels"];
  reportColumnWidths: UndoSnapshot["reportColumnWidths"];
  reportReasons: UndoSnapshot["reportReasons"];
  areaShiftCutoffs: UndoSnapshot["areaShiftCutoffs"];
  customTabs: UndoSnapshot["customTabs"];
  topTabs: UndoSnapshot["topTabs"];
  subTabs: UndoSnapshot["subTabs"];
  ptoManualYears: UndoSnapshot["ptoManualYears"];
  expandedPtoMonths: UndoSnapshot["expandedPtoMonths"];
  ptoPlanRows: UndoSnapshot["ptoPlanRows"];
  ptoSurveyRows: UndoSnapshot["ptoSurveyRows"];
  ptoOperRows: UndoSnapshot["ptoOperRows"];
  ptoColumnWidths: UndoSnapshot["ptoColumnWidths"];
  ptoRowHeights: UndoSnapshot["ptoRowHeights"];
  ptoHeaderLabels: UndoSnapshot["ptoHeaderLabels"];
  ptoBucketValues: UndoSnapshot["ptoBucketValues"];
  ptoBucketManualRows: UndoSnapshot["ptoBucketManualRows"];
  orgMembers: UndoSnapshot["orgMembers"];
  dependencyNodes: UndoSnapshot["dependencyNodes"];
  dependencyLinks: UndoSnapshot["dependencyLinks"];
  setReportCustomers: SnapshotSetter<"reportCustomers">;
  setReportAreaOrder: SnapshotSetter<"reportAreaOrder">;
  setReportWorkOrder: SnapshotSetter<"reportWorkOrder">;
  setReportHeaderLabels: SnapshotSetter<"reportHeaderLabels">;
  setReportColumnWidths: SnapshotSetter<"reportColumnWidths">;
  setReportReasons: SnapshotSetter<"reportReasons">;
  setAreaShiftCutoffs: SnapshotSetter<"areaShiftCutoffs">;
  setCustomTabs: SnapshotSetter<"customTabs">;
  setTopTabs: SnapshotSetter<"topTabs">;
  setSubTabs: SnapshotSetter<"subTabs">;
  setVehicleRows: SnapshotSetter<"vehicleRows">;
  setPtoManualYears: SnapshotSetter<"ptoManualYears">;
  setExpandedPtoMonths: SnapshotSetter<"expandedPtoMonths">;
  setPtoPlanRows: SnapshotSetter<"ptoPlanRows">;
  setPtoSurveyRows: SnapshotSetter<"ptoSurveyRows">;
  setPtoOperRows: SnapshotSetter<"ptoOperRows">;
  setPtoColumnWidths: SnapshotSetter<"ptoColumnWidths">;
  setPtoRowHeights: SnapshotSetter<"ptoRowHeights">;
  setPtoHeaderLabels: SnapshotSetter<"ptoHeaderLabels">;
  setPtoBucketValues: SnapshotSetter<"ptoBucketValues">;
  setPtoBucketManualRows: SnapshotSetter<"ptoBucketManualRows">;
  setOrgMembers: SnapshotSetter<"orgMembers">;
  setDependencyNodes: SnapshotSetter<"dependencyNodes">;
  setDependencyLinks: SnapshotSetter<"dependencyLinks">;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  setVehicleCellInitialDraft: Dispatch<SetStateAction<string>>;
  setPtoInlineEditCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoInlineEditInitialDraft: Dispatch<SetStateAction<string>>;
  setPtoFormulaDraft: Dispatch<SetStateAction<string>>;
  setEditingPtoHeaderKey: Dispatch<SetStateAction<string | null>>;
  setPtoHeaderDraft: Dispatch<SetStateAction<string>>;
  setEditingReportHeaderKey: Dispatch<SetStateAction<string | null>>;
  setReportHeaderDraft: Dispatch<SetStateAction<string>>;
  setOpenVehicleFilter: Dispatch<SetStateAction<VehicleFilterKey | null>>;
};

export function useAppUndoHistory({
  adminDataLoaded,
  topTab,
  adminSection,
  databaseConfigured,
  ptoDatabaseLoadedRef,
  vehicleRows,
  vehicleRowsRef,
  setPtoSaveRevision,
  addAdminLog,
  reportCustomers,
  reportAreaOrder,
  reportWorkOrder,
  reportHeaderLabels,
  reportColumnWidths,
  reportReasons,
  areaShiftCutoffs,
  customTabs,
  topTabs,
  subTabs,
  ptoManualYears,
  expandedPtoMonths,
  ptoPlanRows,
  ptoSurveyRows,
  ptoOperRows,
  ptoColumnWidths,
  ptoRowHeights,
  ptoHeaderLabels,
  ptoBucketValues,
  ptoBucketManualRows,
  orgMembers,
  dependencyNodes,
  dependencyLinks,
  setReportCustomers,
  setReportAreaOrder,
  setReportWorkOrder,
  setReportHeaderLabels,
  setReportColumnWidths,
  setReportReasons,
  setAreaShiftCutoffs,
  setCustomTabs,
  setTopTabs,
  setSubTabs,
  setVehicleRows,
  setPtoManualYears,
  setExpandedPtoMonths,
  setPtoPlanRows,
  setPtoSurveyRows,
  setPtoOperRows,
  setPtoColumnWidths,
  setPtoRowHeights,
  setPtoHeaderLabels,
  setPtoBucketValues,
  setPtoBucketManualRows,
  setOrgMembers,
  setDependencyNodes,
  setDependencyLinks,
  setEditingVehicleCell,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  setPtoInlineEditCell,
  setPtoInlineEditInitialDraft,
  setPtoFormulaDraft,
  setEditingPtoHeaderKey,
  setPtoHeaderDraft,
  setEditingReportHeaderKey,
  setReportHeaderDraft,
  setOpenVehicleFilter,
}: AppUndoHistoryOptions) {
  const undoHistoryRef = useRef<UndoSnapshot[]>([]);
  const undoCurrentSnapshotRef = useRef<UndoSnapshot | null>(null);
  const undoSnapshotTimerRef = useRef<number | null>(null);
  const undoRestoringRef = useRef(false);
  const vehicleUndoHistoryRef = useRef<UndoSnapshot["vehicleRows"][]>([]);

  const createUndoSnapshot = useCallback((): UndoSnapshot => ({
    reportCustomers,
    reportAreaOrder,
    reportWorkOrder,
    reportHeaderLabels,
    reportColumnWidths,
    reportReasons,
    areaShiftCutoffs,
    customTabs,
    topTabs,
    subTabs,
    vehicleRows: cloneVehicleRows(vehicleRowsRef.current),
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoSurveyRows,
    ptoOperRows,
    ptoColumnWidths,
    ptoRowHeights,
    ptoHeaderLabels,
    ptoBucketValues,
    ptoBucketManualRows,
    orgMembers,
    dependencyNodes,
    dependencyLinks,
  }), [
    areaShiftCutoffs,
    customTabs,
    dependencyLinks,
    dependencyNodes,
    expandedPtoMonths,
    orgMembers,
    ptoBucketManualRows,
    ptoBucketValues,
    ptoColumnWidths,
    ptoHeaderLabels,
    ptoManualYears,
    ptoOperRows,
    ptoPlanRows,
    ptoRowHeights,
    ptoSurveyRows,
    reportAreaOrder,
    reportColumnWidths,
    reportCustomers,
    reportHeaderLabels,
    reportReasons,
    reportWorkOrder,
    subTabs,
    topTabs,
    vehicleRowsRef,
  ]);

  const pushVehicleUndoSnapshot = useCallback(() => {
    vehicleUndoHistoryRef.current = [
      ...vehicleUndoHistoryRef.current,
      cloneVehicleRows(vehicleRowsRef.current),
    ].slice(-10);
  }, [vehicleRowsRef]);

  const restoreUndoSnapshot = useCallback((snapshot: UndoSnapshot) => {
    setReportCustomers(snapshot.reportCustomers);
    setReportAreaOrder(snapshot.reportAreaOrder);
    setReportWorkOrder(snapshot.reportWorkOrder);
    setReportHeaderLabels(snapshot.reportHeaderLabels);
    setReportColumnWidths(snapshot.reportColumnWidths);
    setReportReasons(snapshot.reportReasons);
    setAreaShiftCutoffs(snapshot.areaShiftCutoffs);
    setCustomTabs(snapshot.customTabs);
    setTopTabs(snapshot.topTabs);
    setSubTabs(snapshot.subTabs);
    setVehicleRows(snapshot.vehicleRows);
    setPtoManualYears(snapshot.ptoManualYears);
    setExpandedPtoMonths(snapshot.expandedPtoMonths);
    setPtoPlanRows(snapshot.ptoPlanRows);
    setPtoSurveyRows(snapshot.ptoSurveyRows);
    setPtoOperRows(snapshot.ptoOperRows);
    setPtoColumnWidths(snapshot.ptoColumnWidths);
    setPtoRowHeights(snapshot.ptoRowHeights);
    setPtoHeaderLabels(snapshot.ptoHeaderLabels);
    setPtoBucketValues(snapshot.ptoBucketValues);
    setPtoBucketManualRows(snapshot.ptoBucketManualRows);
    setOrgMembers(snapshot.orgMembers);
    setDependencyNodes(snapshot.dependencyNodes);
    setDependencyLinks(snapshot.dependencyLinks);

    setEditingVehicleCell(null);
    setVehicleCellDraft("");
    setVehicleCellInitialDraft("");
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoFormulaDraft("");
    setEditingPtoHeaderKey(null);
    setPtoHeaderDraft("");
    setEditingReportHeaderKey(null);
    setReportHeaderDraft("");
    setOpenVehicleFilter(null);

    if (databaseConfigured && ptoDatabaseLoadedRef.current) {
      setPtoSaveRevision((revision) => revision + 1);
    }

    addAdminLog({
      action: "\u041e\u0442\u043c\u0435\u043d\u0430",
      section: "\u0421\u0438\u0441\u0442\u0435\u043c\u0430",
      details: "\u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d \u0432\u043e\u0437\u0432\u0440\u0430\u0442 \u043d\u0430 \u0448\u0430\u0433 \u043d\u0430\u0437\u0430\u0434 \u0447\u0435\u0440\u0435\u0437 Ctrl+Z.",
    });
  }, [
    addAdminLog,
    databaseConfigured,
    ptoDatabaseLoadedRef,
    setAreaShiftCutoffs,
    setCustomTabs,
    setDependencyLinks,
    setDependencyNodes,
    setEditingPtoHeaderKey,
    setEditingReportHeaderKey,
    setEditingVehicleCell,
    setExpandedPtoMonths,
    setOpenVehicleFilter,
    setOrgMembers,
    setPtoBucketManualRows,
    setPtoBucketValues,
    setPtoColumnWidths,
    setPtoFormulaDraft,
    setPtoHeaderDraft,
    setPtoHeaderLabels,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoManualYears,
    setPtoOperRows,
    setPtoPlanRows,
    setPtoRowHeights,
    setPtoSaveRevision,
    setPtoSurveyRows,
    setReportAreaOrder,
    setReportColumnWidths,
    setReportCustomers,
    setReportHeaderDraft,
    setReportHeaderLabels,
    setReportReasons,
    setReportWorkOrder,
    setSubTabs,
    setTopTabs,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setVehicleRows,
  ]);

  const restoreVehicleUndoSnapshot = useCallback(() => {
    const previousVehicleRows = vehicleUndoHistoryRef.current.pop();
    if (!previousVehicleRows) return;

    setVehicleRows(cloneVehicleRows(previousVehicleRows));
    setEditingVehicleCell(null);
    setVehicleCellDraft("");
    setVehicleCellInitialDraft("");
    setOpenVehicleFilter(null);
    addAdminLog({
      action: "\u041e\u0442\u043c\u0435\u043d\u0430",
      section: "\u0422\u0435\u0445\u043d\u0438\u043a\u0430",
      details: "\u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d \u0432\u043e\u0437\u0432\u0440\u0430\u0442 \u0441\u043f\u0438\u0441\u043a\u0430 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u043d\u0430 \u0448\u0430\u0433 \u043d\u0430\u0437\u0430\u0434 \u0447\u0435\u0440\u0435\u0437 Ctrl+Z.",
    });
  }, [addAdminLog, setEditingVehicleCell, setOpenVehicleFilter, setVehicleCellDraft, setVehicleCellInitialDraft, setVehicleRows]);

  const resetUndoHistoryForExternalRestore = useCallback(() => {
    undoHistoryRef.current = [];
    undoRestoringRef.current = true;
  }, []);

  useEffect(() => {
    vehicleRowsRef.current = vehicleRows;
    if (undoCurrentSnapshotRef.current) {
      undoCurrentSnapshotRef.current = {
        ...undoCurrentSnapshotRef.current,
        vehicleRows: cloneVehicleRows(vehicleRows),
      };
    }
  }, [vehicleRows, vehicleRowsRef]);

  useEffect(() => {
    if (undoSnapshotTimerRef.current !== null) {
      window.clearTimeout(undoSnapshotTimerRef.current);
    }

    undoSnapshotTimerRef.current = window.setTimeout(() => {
      const nextSnapshot = cloneUndoSnapshot(createUndoSnapshot());

      if (!adminDataLoaded) {
        undoHistoryRef.current = [];
        undoCurrentSnapshotRef.current = nextSnapshot;
        undoRestoringRef.current = false;
        undoSnapshotTimerRef.current = null;
        return;
      }

      if (!undoCurrentSnapshotRef.current) {
        undoCurrentSnapshotRef.current = nextSnapshot;
        undoSnapshotTimerRef.current = null;
        return;
      }

      if (undoRestoringRef.current) {
        undoRestoringRef.current = false;
        undoCurrentSnapshotRef.current = nextSnapshot;
        undoSnapshotTimerRef.current = null;
        return;
      }

      undoHistoryRef.current = [
        ...undoHistoryRef.current,
        cloneUndoSnapshot(undoCurrentSnapshotRef.current),
      ].slice(-10);
      undoCurrentSnapshotRef.current = nextSnapshot;

      undoSnapshotTimerRef.current = null;
    }, 700);

    return () => {
      if (undoSnapshotTimerRef.current !== null) {
        window.clearTimeout(undoSnapshotTimerRef.current);
        undoSnapshotTimerRef.current = null;
      }
    };
  }, [adminDataLoaded, createUndoSnapshot]);

  useEffect(() => {
    const handleGlobalUndo = (event: KeyboardEvent) => {
      const isUndo = (event.ctrlKey || event.metaKey)
        && !event.shiftKey
        && (event.key.toLowerCase() === "z" || event.code === "KeyZ");

      const canUndoVehicleRows = topTab === "admin" && adminSection === "vehicles" && vehicleUndoHistoryRef.current.length > 0;
      if (!isUndo || (!canUndoVehicleRows && undoHistoryRef.current.length === 0)) return;

      const target = event.target;
      const targetElement = target instanceof HTMLElement ? target : null;
      const isNativeEditable = Boolean(targetElement?.closest("input, textarea, select, [contenteditable='true']"));
      if (isNativeEditable) return;

      event.preventDefault();

      if (canUndoVehicleRows) {
        restoreVehicleUndoSnapshot();
        return;
      }

      const previousSnapshot = undoHistoryRef.current.pop();
      if (!previousSnapshot) return;

      undoRestoringRef.current = true;
      undoCurrentSnapshotRef.current = cloneUndoSnapshot(previousSnapshot);
      restoreUndoSnapshot(previousSnapshot);
    };

    window.addEventListener("keydown", handleGlobalUndo);
    return () => window.removeEventListener("keydown", handleGlobalUndo);
  }, [adminSection, restoreUndoSnapshot, restoreVehicleUndoSnapshot, topTab]);

  return {
    pushVehicleUndoSnapshot,
    restoreVehicleUndoSnapshot,
    resetUndoHistoryForExternalRestore,
  };
}
