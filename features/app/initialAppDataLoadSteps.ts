import type { Dispatch, SetStateAction } from "react";
import { applyInitialAdminStructureState, type InitialAdminStructureStateSetters } from "@/features/admin/structure/applyInitialAdminStructureState";
import { buildInitialAdminStructureState } from "@/features/admin/structure/initialAdminStructureState";
import { applyInitialVehicleRows, type InitialVehicleRowsSetters } from "@/features/admin/vehicles/applyInitialVehicleRows";
import { loadInitialVehicleRows } from "@/features/admin/vehicles/initialVehicleRows";
import { applyInitialDispatchSummaryRows, type InitialDispatchSummaryStateSetters } from "@/features/dispatch/applyInitialDispatchSummaryState";
import { buildInitialDispatchSummaryRows } from "@/features/dispatch/initialDispatchSummaryState";
import { applyInitialNavigationState, type InitialNavigationStateSetters } from "@/features/navigation/applyInitialNavigationState";
import { buildInitialNavigationState } from "@/features/navigation/initialNavigationState";
import { applyInitialPtoState, type InitialPtoStateSetters } from "@/features/pto/applyInitialPtoState";
import { buildInitialPtoState } from "@/features/pto/initialPtoState";
import { applyInitialReportState, type InitialReportStateSetters } from "@/features/reports/applyInitialReportState";
import { buildInitialReportState } from "@/features/reports/initialReportState";
import { databaseConfigured } from "@/lib/data/config";
import { createDefaultSubTabs } from "@/lib/domain/navigation/tabs";
import { loadInitialAppDatabaseBootstrap } from "@/features/app/initialAppDatabaseBootstrap";
import { hasInitialLocalAppState, readInitialStoredAppState } from "@/features/app/initialAppStorage";

type MutableRef<T> = {
  current: T;
};

export type InitialAppDataLoadOptions = InitialReportStateSetters
  & InitialPtoStateSetters
  & InitialAdminStructureStateSetters
  & InitialNavigationStateSetters
  & InitialVehicleRowsSetters
  & InitialDispatchSummaryStateSetters
  & {
  defaultSubTabs: ReturnType<typeof createDefaultSubTabs>;
  restoreAdminLogs: (storedLogs: unknown) => void;
  appDatabaseSaveSnapshotRef: MutableRef<string>;
  appSettingsDatabaseLoadedRef: MutableRef<boolean>;
  appSettingsDatabaseSaveSnapshotRef: MutableRef<string>;
  vehiclesDatabaseLoadedRef: MutableRef<boolean>;
  vehiclesDatabaseSaveSnapshotRef: MutableRef<string>;
  setPtoDatabaseLoadStarted: Dispatch<SetStateAction<boolean>>;
  setPtoBootstrapLoaded: Dispatch<SetStateAction<boolean>>;
  setAdminDataLoaded: Dispatch<SetStateAction<boolean>>;
};

export async function runInitialAppDataLoad(
  options: InitialAppDataLoadOptions & {
    isCancelled: () => boolean;
  },
) {
  const {
    defaultSubTabs,
    restoreAdminLogs,
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
    hasStoredPtoStateRef,
    setPtoDatabaseLoadStarted,
    setPtoBootstrapLoaded,
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
    isCancelled,
  } = options;

  try {
    const hasLocalAppState = hasInitialLocalAppState();
    const localStoredPtoState = databaseConfigured ? readInitialStoredAppState({ includePto: true }) : null;

    if (databaseConfigured) {
      if (!isCancelled()) {
        setPtoDatabaseLoadStarted(true);
      }

      const databaseBootstrapCompleted = await loadInitialAppDatabaseBootstrap({
        hasLocalAppState,
        isCancelled,
        appDatabaseSaveSnapshotRef,
        appSettingsDatabaseLoadedRef,
        appSettingsDatabaseSaveSnapshotRef,
      });
      if (!databaseBootstrapCompleted) return;
    }

    const storedState = readInitialStoredAppState({ includePto: !databaseConfigured });
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

    applyInitialNavigationState(buildInitialNavigationState({
      savedCustomTabs: storedState.savedCustomTabs,
      savedTopTabs: storedState.savedTopTabs,
      savedSubTabs: storedState.savedSubTabs,
      defaultSubTabs,
    }), {
      setCustomTabs,
      setTopTabs,
      setSubTabs,
    });

    const localInitialPtoState = buildInitialPtoState(localStoredPtoState ?? storedState);

    if (!databaseConfigured || localInitialPtoState.hasSavedPtoState) {
      applyInitialPtoState(localInitialPtoState, {
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
    } else {
      hasStoredPtoStateRef.current = false;
    }

    if (!databaseConfigured) {
      if (!isCancelled()) {
        setPtoBootstrapLoaded(true);
      }
    }

    applyInitialAdminStructureState(buildInitialAdminStructureState(storedState), {
      setOrgMembers,
      setDependencyNodes,
      setDependencyLinks,
      setDependencyLinkForm,
    });

    restoreAdminLogs(storedState.savedAdminLogs);

    const initialVehicleRows = await loadInitialVehicleRows({
      savedVehicles: storedState.savedVehicles,
      isCancelled,
      vehiclesDatabaseLoadedRef,
      vehiclesDatabaseSaveSnapshotRef,
    });
    if (!initialVehicleRows.completed) return;

    applyInitialVehicleRows(initialVehicleRows.rows, { setVehicleRows });

    applyInitialDispatchSummaryRows(buildInitialDispatchSummaryRows({
      savedDispatchSummaryRows: storedState.savedDispatchSummaryRows,
      preferredReportDate: initialReportState.preferredReportDate,
      seedVehicleRows: initialVehicleRows.usedSeed ? initialVehicleRows.rows : null,
    }), { setDispatchSummaryRows });
  } finally {
    if (isCancelled()) return;
    setPtoBootstrapLoaded(true);
    setAdminDataLoaded(true);
  }
}
