"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { buildInitialAdminStructureState } from "@/features/admin/structure/initialAdminStructureState";
import { loadInitialVehicleRows } from "@/features/admin/vehicles/initialVehicleRows";
import { buildInitialPtoState } from "@/features/pto/initialPtoState";
import { buildInitialReportState } from "@/features/reports/initialReportState";
import type { AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import type { DependencyLink, DependencyNode, OrgMember } from "@/lib/domain/admin/structure";
import { createDefaultDispatchSummaryRows, normalizeDispatchSummaryRows, type DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import { createDefaultSubTabs, normalizeStoredCustomTabs, normalizeStoredSubTabs, normalizeStoredTopTabs, type CustomTab, type EditableSubtabGroup, type SubTabConfig, type TopTabDefinition } from "@/lib/domain/navigation/tabs";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { databaseConfigured } from "@/lib/data/config";
import { loadInitialAppDatabaseBootstrap } from "@/features/app/initialAppDatabaseBootstrap";
import { hasInitialLocalAppState, readInitialStoredAppState } from "@/features/app/initialAppStorage";

type MutableRef<T> = {
  current: T;
};

type InitialAppDataLoadOptions = {
  defaultSubTabs: ReturnType<typeof createDefaultSubTabs>;
  saveClientSnapshotToDatabase: (reason: string) => Promise<void>;
  restoreAdminLogs: (storedLogs: unknown) => void;
  appDatabaseSaveSnapshotRef: MutableRef<string>;
  appSettingsDatabaseLoadedRef: MutableRef<boolean>;
  appSettingsDatabaseSaveSnapshotRef: MutableRef<string>;
  vehiclesDatabaseLoadedRef: MutableRef<boolean>;
  vehiclesDatabaseSaveSnapshotRef: MutableRef<string>;
  hasStoredPtoStateRef: MutableRef<boolean>;
  setAdminDataLoaded: Dispatch<SetStateAction<boolean>>;
  setReportCustomers: Dispatch<SetStateAction<ReportCustomerConfig[]>>;
  setReportAreaOrder: Dispatch<SetStateAction<string[]>>;
  setReportWorkOrder: Dispatch<SetStateAction<Record<string, string[]>>>;
  setReportHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setReportColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setReportReasons: Dispatch<SetStateAction<Record<string, string>>>;
  setAreaShiftCutoffs: Dispatch<SetStateAction<AreaShiftCutoffMap>>;
  setCustomTabs: Dispatch<SetStateAction<CustomTab[]>>;
  setTopTabs: Dispatch<SetStateAction<TopTabDefinition[]>>;
  setSubTabs: Dispatch<SetStateAction<Record<EditableSubtabGroup, SubTabConfig[]>>>;
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
  setDispatchSummaryRows: Dispatch<SetStateAction<DispatchSummaryRow[]>>;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoRowHeights: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  setOrgMembers: Dispatch<SetStateAction<OrgMember[]>>;
  setDependencyNodes: Dispatch<SetStateAction<DependencyNode[]>>;
  setDependencyLinks: Dispatch<SetStateAction<DependencyLink[]>>;
  setDependencyLinkForm: Dispatch<SetStateAction<DependencyLink>>;
};

export function useInitialAppDataLoad({
  defaultSubTabs,
  saveClientSnapshotToDatabase,
  restoreAdminLogs,
  appDatabaseSaveSnapshotRef,
  appSettingsDatabaseLoadedRef,
  appSettingsDatabaseSaveSnapshotRef,
  vehiclesDatabaseLoadedRef,
  vehiclesDatabaseSaveSnapshotRef,
  hasStoredPtoStateRef,
  setAdminDataLoaded,
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
  setDispatchSummaryRows,
  setPtoManualYears,
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
  setDependencyLinkForm,
}: InitialAppDataLoadOptions) {
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      try {
        const hasLocalAppState = hasInitialLocalAppState();

        if (hasLocalAppState && databaseConfigured) {
          void saveClientSnapshotToDatabase("before-initial-database-load").catch((error) => {
            console.warn("Database client snapshot save failed:", error);
          });
        }

        if (databaseConfigured) {
          const databaseBootstrapCompleted = await loadInitialAppDatabaseBootstrap({
            hasLocalAppState,
            isCancelled: () => cancelled,
            appDatabaseSaveSnapshotRef,
            appSettingsDatabaseLoadedRef,
            appSettingsDatabaseSaveSnapshotRef,
          });
          if (!databaseBootstrapCompleted) return;
        }

        const storedState = readInitialStoredAppState();
        const initialVehicleRows = await loadInitialVehicleRows({
          savedVehicles: storedState.savedVehicles,
          isCancelled: () => cancelled,
          vehiclesDatabaseLoadedRef,
          vehiclesDatabaseSaveSnapshotRef,
        });
        if (!initialVehicleRows.completed) return;

        const initialPtoState = buildInitialPtoState(storedState);
        hasStoredPtoStateRef.current = initialPtoState.hasSavedPtoState;

        const initialReportState = buildInitialReportState(storedState);
        setReportCustomers(initialReportState.reportCustomers);
        setReportAreaOrder(initialReportState.reportAreaOrder);
        setReportWorkOrder(initialReportState.reportWorkOrder);
        setReportHeaderLabels(initialReportState.reportHeaderLabels);
        setReportColumnWidths(initialReportState.reportColumnWidths);
        setReportReasons(initialReportState.reportReasons);
        setAreaShiftCutoffs(initialReportState.areaShiftCutoffs);

        setCustomTabs(normalizeStoredCustomTabs(storedState.savedCustomTabs));

        if (storedState.savedTopTabs) {
          setTopTabs(normalizeStoredTopTabs(storedState.savedTopTabs));
        }

        if (storedState.savedSubTabs) {
          setSubTabs(normalizeStoredSubTabs(storedState.savedSubTabs, defaultSubTabs));
        }

        if (initialVehicleRows.rows) {
          setVehicleRows(initialVehicleRows.rows);
        }

        const parsedDispatchSummaryRows = normalizeDispatchSummaryRows(storedState.savedDispatchSummaryRows, initialReportState.preferredReportDate);
        if (parsedDispatchSummaryRows) {
          const hasEditableDispatchRows = parsedDispatchSummaryRows.some((row) => row.shift === "night" || row.shift === "day");
          setDispatchSummaryRows(hasEditableDispatchRows
            ? parsedDispatchSummaryRows
            : parsedDispatchSummaryRows.map((row) => (row.shift === "daily" ? { ...row, shift: "night" } : row)));
        } else if (initialVehicleRows.usedSeed && initialVehicleRows.rows) {
          setDispatchSummaryRows(createDefaultDispatchSummaryRows(initialVehicleRows.rows, initialReportState.preferredReportDate));
        }

        if (initialPtoState.manualYears) {
          setPtoManualYears(initialPtoState.manualYears);
        }

        if (initialPtoState.planRows) {
          setPtoPlanRows(initialPtoState.planRows);
        }

        if (initialPtoState.surveyRows) {
          setPtoSurveyRows(initialPtoState.surveyRows);
        }

        if (initialPtoState.operRows) {
          setPtoOperRows(initialPtoState.operRows);
        }

        setPtoColumnWidths(initialPtoState.columnWidths);
        setPtoRowHeights(initialPtoState.rowHeights);
        setPtoHeaderLabels(initialPtoState.headerLabels);
        setPtoBucketValues(initialPtoState.bucketValues);
        setPtoBucketManualRows(initialPtoState.bucketRows);

        const initialAdminStructureState = buildInitialAdminStructureState(storedState);
        if (initialAdminStructureState.orgMembers) {
          setOrgMembers(initialAdminStructureState.orgMembers);
        }

        if (initialAdminStructureState.dependencyNodes) {
          setDependencyNodes(initialAdminStructureState.dependencyNodes);
          if (initialAdminStructureState.dependencyLinkFormPatch) {
            setDependencyLinkForm((current) => ({
              ...current,
              ...initialAdminStructureState.dependencyLinkFormPatch,
            }));
          }
        }

        if (initialAdminStructureState.dependencyLinks) {
          setDependencyLinks(initialAdminStructureState.dependencyLinks);
        }

        restoreAdminLogs(storedState.savedAdminLogs);
      } finally {
        if (cancelled) return;
        setAdminDataLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    defaultSubTabs,
    hasStoredPtoStateRef,
    restoreAdminLogs,
    saveClientSnapshotToDatabase,
    setAdminDataLoaded,
    setAreaShiftCutoffs,
    setCustomTabs,
    setDependencyLinkForm,
    setDependencyLinks,
    setDependencyNodes,
    setDispatchSummaryRows,
    setOrgMembers,
    setPtoBucketManualRows,
    setPtoBucketValues,
    setPtoColumnWidths,
    setPtoHeaderLabels,
    setPtoManualYears,
    setPtoOperRows,
    setPtoPlanRows,
    setPtoRowHeights,
    setPtoSurveyRows,
    setReportAreaOrder,
    setReportColumnWidths,
    setReportCustomers,
    setReportHeaderLabels,
    setReportReasons,
    setReportWorkOrder,
    setSubTabs,
    setTopTabs,
    setVehicleRows,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
  ]);
}
