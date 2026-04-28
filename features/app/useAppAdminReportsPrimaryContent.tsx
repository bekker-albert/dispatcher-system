"use client";

import { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import { useAppAdminReportsScreenProps } from "@/features/app/useAppAdminReportsScreenProps";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppReportsModel } from "@/features/app/useAppReportsModel";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { AdminReportSettingsSection } from "@/features/app/lazySections";

type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;

type AdminReportsPrimaryContentProps = {
  appState: AppStateBundle;
  models: AppDerivedModels;
};

export function AdminReportsPrimaryContent({
  appState,
  models,
}: AdminReportsPrimaryContentProps) {
  const {
    deferredPtoPlanRows,
    deferredPtoSurveyRows,
    deferredPtoOperRows,
    deferredVehicleRows,
  } = models;

  const {
    setAdminReportCustomerId,
    setReportCustomerId,
    setEditingReportRowLabelKeys,
    setExpandedReportSummaryIds,
    reportCustomers,
    setReportCustomers,
    addAdminLog,
    reportDate,
    reportReasons,
    reportCustomerId,
    adminReportCustomerId,
    adminReportCustomerSettingsTab,
    reportArea,
    setReportArea,
    reportAreaOrder,
    reportWorkOrder,
    editingReportFactSourceRowKey,
    areaShiftCutoffs,
    reportHeaderLabels,
    reportColumnWidths,
  } = appState;

  const reportsModel = useAppReportsModel({
    needsReportRows: true,
    needsReportIndexes: true,
    needsAutoReportRows: true,
    needsAdminReportRows: true,
    needsDerivedReportRows: false,
    needsAreaShiftScheduleAreas: false,
    deferredPtoPlanRows,
    deferredPtoSurveyRows,
    deferredPtoOperRows,
    deferredVehicleRows,
    reportDate,
    reportReasons,
    reportCustomers,
    reportCustomerId,
    setReportCustomerId,
    adminReportCustomerId,
    adminReportCustomerSettingsTab,
    reportArea,
    setReportArea,
    reportAreaOrder,
    reportWorkOrder,
    editingReportFactSourceRowKey,
    areaShiftCutoffs,
    reportHeaderLabels,
    reportColumnWidths,
  });

  const adminReportEditors = useAppAdminReportEditors({
    activeAdminReportAreaOptions: reportsModel.activeAdminReportAreaOptions,
    activeAdminReportBaseRows: reportsModel.activeAdminReportBaseRows,
    activeAdminReportCustomer: reportsModel.activeAdminReportCustomer,
    activeAdminReportOrderRows: reportsModel.activeAdminReportOrderRows,
    activeAdminReportRowsByKey: reportsModel.activeAdminReportRowsByKey,
    activeAdminReportSummaryAreaOptions: reportsModel.activeAdminReportSummaryAreaOptions,
    addAdminLog,
    adminReportBaseRows: reportsModel.adminReportBaseRows,
    reportAutoRowKeysForCustomer: reportsModel.reportAutoRowKeysForCustomer,
    reportCustomers,
    setAdminReportCustomerId,
    setEditingReportRowLabelKeys,
    setExpandedReportSummaryIds,
    setReportCustomerId,
    setReportCustomers,
  });

  const adminReportsProps = useAppAdminReportsScreenProps({
    appState,
    models: reportsModel,
    adminReportEditors,
  });

  return <AdminReportSettingsSection {...adminReportsProps} />;
}
