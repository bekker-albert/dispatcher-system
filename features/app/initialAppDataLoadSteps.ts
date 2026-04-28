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
import { hasInitialLocalAppState, readInitialStoredAppState, readInitialStoredPtoState } from "@/features/app/initialAppStorage";

type MutableRef<T> = {
  current: T;
};

type InitialAppDatabaseRefs = {
  appDatabaseSaveSnapshotRef: MutableRef<string>;
  appSettingsDatabaseLoadedRef: MutableRef<boolean>;
  appSettingsDatabaseSaveSnapshotRef: MutableRef<string>;
  vehiclesDatabaseLoadedRef: MutableRef<boolean>;
  vehiclesDatabaseSaveSnapshotRef: MutableRef<string>;
};

type InitialAppLoadFlags = {
  setPtoDatabaseLoadStarted: Dispatch<SetStateAction<boolean>>;
  setPtoBootstrapLoaded: Dispatch<SetStateAction<boolean>>;
  setAdminDataLoaded: Dispatch<SetStateAction<boolean>>;
};

export type InitialAppDataLoadOptions = {
  defaultSubTabs: ReturnType<typeof createDefaultSubTabs>;
  restoreAdminLogs: (storedLogs: unknown) => void;
  databaseRefs: InitialAppDatabaseRefs;
  loadFlags: InitialAppLoadFlags;
  reportSetters: InitialReportStateSetters;
  ptoSetters: InitialPtoStateSetters;
  adminStructureSetters: InitialAdminStructureStateSetters;
  navigationSetters: InitialNavigationStateSetters;
  vehicleSetters: InitialVehicleRowsSetters;
  dispatchSetters: InitialDispatchSummaryStateSetters;
};

export async function runInitialAppDataLoad(
  options: InitialAppDataLoadOptions & {
    isCancelled: () => boolean;
  },
) {
  const {
    defaultSubTabs,
    restoreAdminLogs,
    databaseRefs,
    loadFlags,
    reportSetters,
    ptoSetters,
    adminStructureSetters,
    navigationSetters,
    vehicleSetters,
    dispatchSetters,
    isCancelled,
  } = options;
  const {
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
  } = databaseRefs;
  const {
    setPtoDatabaseLoadStarted,
    setPtoBootstrapLoaded,
    setAdminDataLoaded,
  } = loadFlags;
  const {
    hasStoredPtoStateRef,
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
  } = {
    ...reportSetters,
    ...ptoSetters,
    ...adminStructureSetters,
    ...navigationSetters,
    ...vehicleSetters,
    ...dispatchSetters,
  };

  try {
    const hasLocalAppState = hasInitialLocalAppState();
    let storedState = readInitialStoredAppState({ includePto: !databaseConfigured });

    const applySharedState = (state: typeof storedState) => {
      const initialReportState = buildInitialReportState(state);

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
        savedCustomTabs: state.savedCustomTabs,
        savedTopTabs: state.savedTopTabs,
        savedSubTabs: state.savedSubTabs,
        defaultSubTabs,
      }), {
        setCustomTabs,
        setTopTabs,
        setSubTabs,
      });

      applyInitialAdminStructureState(buildInitialAdminStructureState(state), {
        setOrgMembers,
        setDependencyNodes,
        setDependencyLinks,
        setDependencyLinkForm,
      });

      restoreAdminLogs(state.savedAdminLogs);

      return initialReportState;
    };

    let initialReportState = applySharedState(storedState);
    const localInitialPtoState = buildInitialPtoState(databaseConfigured ? readInitialStoredPtoState() : storedState);

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

    if (databaseConfigured) {
      const databaseBootstrapCompleted = await loadInitialAppDatabaseBootstrap({
        hasLocalAppState,
        isCancelled,
        appDatabaseSaveSnapshotRef,
        appSettingsDatabaseLoadedRef,
        appSettingsDatabaseSaveSnapshotRef,
      });
      if (!databaseBootstrapCompleted) return;

      storedState = readInitialStoredAppState({ includePto: false });
      initialReportState = applySharedState(storedState);
      if (!isCancelled()) setPtoDatabaseLoadStarted(true);
    } else if (!isCancelled()) {
      setPtoBootstrapLoaded(true);
    }

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
