"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { applyInitialAdminStructureState, type InitialAdminStructureStateSetters } from "@/features/admin/structure/applyInitialAdminStructureState";
import { buildInitialAdminStructureState } from "@/features/admin/structure/initialAdminStructureState";
import { loadInitialVehicleRows } from "@/features/admin/vehicles/initialVehicleRows";
import { buildInitialDispatchSummaryRows } from "@/features/dispatch/initialDispatchSummaryState";
import { buildInitialNavigationState } from "@/features/navigation/initialNavigationState";
import { applyInitialPtoState, type InitialPtoStateSetters } from "@/features/pto/applyInitialPtoState";
import { buildInitialPtoState } from "@/features/pto/initialPtoState";
import { applyInitialReportState, type InitialReportStateSetters } from "@/features/reports/applyInitialReportState";
import { buildInitialReportState } from "@/features/reports/initialReportState";
import type { DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import { createDefaultSubTabs, type CustomTab, type EditableSubtabGroup, type SubTabConfig, type TopTabDefinition } from "@/lib/domain/navigation/tabs";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { databaseConfigured } from "@/lib/data/config";
import { loadInitialAppDatabaseBootstrap } from "@/features/app/initialAppDatabaseBootstrap";
import { hasInitialLocalAppState, readInitialStoredAppState } from "@/features/app/initialAppStorage";

type MutableRef<T> = {
  current: T;
};

type InitialAppDataLoadOptions = InitialReportStateSetters & InitialPtoStateSetters & InitialAdminStructureStateSetters & {
  defaultSubTabs: ReturnType<typeof createDefaultSubTabs>;
  saveClientSnapshotToDatabase: (reason: string) => Promise<void>;
  restoreAdminLogs: (storedLogs: unknown) => void;
  appDatabaseSaveSnapshotRef: MutableRef<string>;
  appSettingsDatabaseLoadedRef: MutableRef<boolean>;
  appSettingsDatabaseSaveSnapshotRef: MutableRef<string>;
  vehiclesDatabaseLoadedRef: MutableRef<boolean>;
  vehiclesDatabaseSaveSnapshotRef: MutableRef<string>;
  setAdminDataLoaded: Dispatch<SetStateAction<boolean>>;
  setCustomTabs: Dispatch<SetStateAction<CustomTab[]>>;
  setTopTabs: Dispatch<SetStateAction<TopTabDefinition[]>>;
  setSubTabs: Dispatch<SetStateAction<Record<EditableSubtabGroup, SubTabConfig[]>>>;
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
  setDispatchSummaryRows: Dispatch<SetStateAction<DispatchSummaryRow[]>>;
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

        const initialReportState = buildInitialReportState(storedState);
        applyInitialReportState(initialReportState, {
          setReportCustomers,
          setReportAreaOrder,
          setReportWorkOrder,
          setReportHeaderLabels,
          setReportColumnWidths,
          setReportReasons,
          setAreaShiftCutoffs,
        });

        const initialNavigationState = buildInitialNavigationState({
          savedCustomTabs: storedState.savedCustomTabs,
          savedTopTabs: storedState.savedTopTabs,
          savedSubTabs: storedState.savedSubTabs,
          defaultSubTabs,
        });

        setCustomTabs(initialNavigationState.customTabs);
        if (initialNavigationState.topTabs) setTopTabs(initialNavigationState.topTabs);
        if (initialNavigationState.subTabs) setSubTabs(initialNavigationState.subTabs);

        if (initialVehicleRows.rows) {
          setVehicleRows(initialVehicleRows.rows);
        }

        const initialDispatchSummaryRows = buildInitialDispatchSummaryRows({
          savedDispatchSummaryRows: storedState.savedDispatchSummaryRows,
          preferredReportDate: initialReportState.preferredReportDate,
          seedVehicleRows: initialVehicleRows.usedSeed ? initialVehicleRows.rows : null,
        });
        if (initialDispatchSummaryRows) {
          setDispatchSummaryRows(initialDispatchSummaryRows);
        }

        applyInitialPtoState(initialPtoState, {
          hasStoredPtoStateRef,
          setPtoManualYears,
          setPtoPlanRows,
          setPtoSurveyRows,
          setPtoOperRows,
          setPtoColumnWidths,
          setPtoRowHeights,
          setPtoHeaderLabels,
          setPtoBucketValues,
          setPtoBucketManualRows,
        });

        const initialAdminStructureState = buildInitialAdminStructureState(storedState);
        applyInitialAdminStructureState(initialAdminStructureState, {
          setOrgMembers,
          setDependencyNodes,
          setDependencyLinks,
          setDependencyLinkForm,
        });

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
