"use client";

import { useAppHeaderEditors } from "@/features/app/useAppHeaderEditors";
import { useAppInitialDataLoadController } from "@/features/app/useAppInitialDataLoadController";
import { useAppPtoPersistenceController } from "@/features/app/useAppPtoPersistenceController";
import { useAppReportReasonEditing } from "@/features/app/useAppReportReasonEditing";
import { useAppSharedPersistenceController } from "@/features/app/useAppSharedPersistenceController";
import { useAppTableInteractionEffects } from "@/features/app/useAppTableInteractionEffects";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppUndoController } from "@/features/app/useAppUndoController";
import { useAppVehicleFocusController } from "@/features/app/useAppVehicleFocusController";


type UseAppRuntimeControllersArgs = {
  appState: AppStateBundle;
  databaseConfigured: boolean;
};

export function useAppRuntimeControllers({
  appState,
  databaseConfigured,
}: UseAppRuntimeControllersArgs) {
  const {
    reportDate,
    setReportReasons,
    ptoHeaderLabels,
    ptoHeaderDraft,
    setPtoHeaderLabels,
    setEditingPtoHeaderKey,
    setPtoHeaderDraft,
    reportHeaderLabels,
    reportHeaderDraft,
    editingReportHeaderKey,
    setReportHeaderLabels,
    setEditingReportHeaderKey,
    setReportHeaderDraft,
    planFactEditing,
    addAdminLog,
    ptoRowHeights,
    setPtoColumnWidths,
    setPtoRowHeights,
    setReportColumnWidths,
    ptoSelectionDraggingRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectionAnchorCell,
    setPtoSelectedCellKeys,
    ptoPendingFieldFocus,
    setPtoPendingFieldFocus,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    topTab,
    ptoDateEditing,
    adminSection,
    fleetTab,
    adminVehiclesEditing,
  } = appState;

  const {
    pushVehicleUndoSnapshot,
    resetUndoHistoryForExternalRestore,
  } = useAppUndoController({
    appState,
    databaseConfigured,
  });

  useAppVehicleFocusController({ appState });
  useAppInitialDataLoadController({ appState });

  const {
    markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt,
    savePtoDatabaseChanges,
    flushPtoDatabasePendingSave,
    requestPtoDatabaseSave,
    savePtoLocalState,
  } = useAppPtoPersistenceController({
    appState,
    resetUndoHistoryForExternalRestore,
  });

  useAppSharedPersistenceController({ appState, databaseConfigured });

  const reportReasonEditing = useAppReportReasonEditing({
    reportDate,
    setReportReasons,
    requestPtoDatabaseSave,
  });

  const headerEditors = useAppHeaderEditors({
    ptoHeaderLabels,
    ptoHeaderDraft,
    setPtoHeaderLabels,
    setEditingPtoHeaderKey,
    setPtoHeaderDraft,
    reportHeaderLabels,
    reportHeaderDraft,
    editingReportHeaderKey,
    reportEditing: planFactEditing,
    setReportHeaderLabels,
    setEditingReportHeaderKey,
    setReportHeaderDraft,
    requestPtoDatabaseSave,
    addAdminLog,
  });

  const tableResizeActive = (topTab === "pto" && ptoDateEditing)
    || (topTab === "reports" && planFactEditing);
  const vehicleSelectionActive = (topTab === "admin" && adminSection === "vehicles")
    || (topTab === "fleet" && fleetTab === "directory" && adminVehiclesEditing);

  const tableInteractionEffects = useAppTableInteractionEffects({
    resizeActive: tableResizeActive,
    ptoSelectionActive: topTab === "pto" && ptoDateEditing,
    vehicleSelectionActive,
    ptoRowHeights,
    setPtoColumnWidths,
    setPtoRowHeights,
    setReportColumnWidths,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
    ptoSelectionDraggingRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectionAnchorCell,
    setPtoSelectedCellKeys,
    pendingFieldFocus: ptoPendingFieldFocus,
    setPendingFieldFocus: setPtoPendingFieldFocus,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
  });

  return {
    pushVehicleUndoSnapshot,
    resetUndoHistoryForExternalRestore,
    markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt,
    savePtoDatabaseChanges,
    flushPtoDatabasePendingSave,
    requestPtoDatabaseSave,
    savePtoLocalState,
    ...reportReasonEditing,
    ...headerEditors,
    ...tableInteractionEffects,
  };
}
