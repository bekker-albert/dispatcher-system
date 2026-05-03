"use client";

import { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import { useAppAdminReportsScreenProps } from "@/features/app/useAppAdminReportsScreenProps";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppReportsModel } from "@/features/app/useAppReportsModel";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { AdminReportSettingsSection } from "@/features/app/lazySections";
import { defaultReportCustomers } from "@/lib/domain/reports/defaults";
import { reportCustomerUsesSummaryRows } from "@/lib/domain/reports/display";

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
  const activeAdminReportCustomer = reportCustomers.find((customer) => customer.id === adminReportCustomerId)
    ?? reportCustomers[0]
    ?? defaultReportCustomers[0];
  const activeAdminReportSettingsTab = reportCustomerUsesSummaryRows(activeAdminReportCustomer) || adminReportCustomerSettingsTab !== "summary"
    ? adminReportCustomerSettingsTab
    : "display";
  const adminReportTabNeedsAutoRows = activeAdminReportSettingsTab === "display";

  const reportsModel = useAppReportsModel({
    needsReportRows: true,
    needsReportIndexes: adminReportTabNeedsAutoRows,
    needsAutoReportRows: false,
    needsAdminReportAutoRows: adminReportTabNeedsAutoRows,
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
