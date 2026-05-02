"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { useAppReportsModel } from "@/features/app/useAppReportsModel";
import { useAppReportsScreenProps } from "@/features/app/useAppReportsScreenProps";
import ReportsSection from "@/features/reports/ReportsSection";
import { databaseConfigured } from "@/lib/data/config";

type ReportsPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime">;

export function ReportsPrimaryContent({
  appState,
  models,
  runtime,
}: ReportsPrimaryContentProps) {
  const {
    deferredPtoPlanRows,
    deferredPtoSurveyRows,
    deferredPtoOperRows,
    deferredVehicleRows,
  } = models;

  const {
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
  } = appState;

  const reportsModel = useAppReportsModel({
    needsReportRows: true,
    needsReportIndexes: true,
    needsAutoReportRows: true,
    needsAdminReportAutoRows: false,
    needsAdminReportRows: false,
    needsDerivedReportRows: true,
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

  const reportsProps = useAppReportsScreenProps({
    appState,
    models: reportsModel,
    runtime,
  });

  return (
    <ReportsSection
      {...reportsProps}
      databaseSyncMessage={databaseConfigured && !appState.ptoDatabaseReady ? appState.ptoDatabaseMessage : ""}
    />
  );
}
