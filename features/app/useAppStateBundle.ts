"use client";

import { useClientSnapshotsPanel } from "@/features/admin/database/useClientSnapshotsPanel";
import { useAdminLogsState } from "@/features/admin/logs/useAdminLogsState";
import { useAdminStructureState } from "@/features/admin/structure/useAdminStructureState";
import { useVehicleUiState } from "@/features/admin/vehicles/useVehicleUiState";
import { useDispatchFilterState } from "@/features/dispatch/useDispatchFilterState";
import { useDispatchSummaryState } from "@/features/dispatch/useDispatchSummaryState";
import { useAppDataLoadState } from "@/features/app/useAppDataLoadState";
import { useAppReportDateControls } from "@/features/app/useAppReportDateControls";
import { defaultSubTabs, defaultVehicles } from "@/features/app/appDefaults";
import { useAppTabsState } from "@/features/navigation/useAppTabsState";
import { useNavigationSelectionHandlers } from "@/features/navigation/useNavigationSelectionHandlers";
import { useSectionSelectionState } from "@/features/navigation/useSectionSelectionState";
import { usePtoDatabaseUiState } from "@/features/pto/usePtoDatabaseUiState";
import { usePtoPersistentState } from "@/features/pto/usePtoPersistentState";
import { usePtoUiState } from "@/features/pto/usePtoUiState";
import { useReportUiState } from "@/features/reports/useReportUiState";
import { useSaveStatus } from "@/shared/ui/useSaveStatus";

export function useAppStateBundle() {
  const tabsState = useAppTabsState({ defaultSubTabs });
  const sectionState = useSectionSelectionState();
  const dispatchSummaryState = useDispatchSummaryState(defaultVehicles);
  const vehicleState = useVehicleUiState(defaultVehicles);
  const dataLoadState = useAppDataLoadState();
  const ptoUiState = usePtoUiState();
  const reportUiState = useReportUiState();
  const ptoPersistentState = usePtoPersistentState();
  const adminStructureState = useAdminStructureState();
  const reportDateControls = useAppReportDateControls({
    topTab: tabsState.topTab,
    adminSection: sectionState.adminSection,
    reportArea: reportUiState.reportArea,
    ptoAreaFilter: ptoPersistentState.ptoAreaFilter,
    areaShiftCutoffs: reportUiState.areaShiftCutoffs,
    setAreaShiftCutoffs: reportUiState.setAreaShiftCutoffs,
  });
  const adminLogsState = useAdminLogsState();
  const ptoDatabaseUiState = usePtoDatabaseUiState();
  const saveStatusState = useSaveStatus();
  const clientSnapshotsState = useClientSnapshotsPanel({
    active: tabsState.topTab === "admin" && sectionState.adminSection === "database",
    showSaveStatus: saveStatusState.showSaveStatus,
  });
  const dispatchFilterState = useDispatchFilterState();
  const navigationSelectionHandlers = useNavigationSelectionHandlers({
    setTopTab: tabsState.setTopTab,
    setPtoTab: sectionState.setPtoTab,
    setPtoPlanYear: ptoPersistentState.setPtoPlanYear,
    setPtoAreaFilter: ptoPersistentState.setPtoAreaFilter,
  });

  return {
    ...tabsState,
    ...sectionState,
    ...dispatchSummaryState,
    ...vehicleState,
    ...dataLoadState,
    ...ptoUiState,
    ...reportUiState,
    ...ptoPersistentState,
    ...adminStructureState,
    ...reportDateControls,
    ...adminLogsState,
    ...ptoDatabaseUiState,
    ...saveStatusState,
    ...clientSnapshotsState,
    ...dispatchFilterState,
    ...navigationSelectionHandlers,
  };
}
