"use client";

import { useDeferredValue } from "react";

type UseAppDeferredDataOptions<TPtoRow, TVehicleRow> = {
  ptoPlanRows: TPtoRow[];
  ptoSurveyRows: TPtoRow[];
  ptoOperRows: TPtoRow[];
  vehicleRows: TVehicleRow[];
  topTab: string;
  adminSection: string;
};

export function useAppDeferredData<TPtoRow, TVehicleRow>({
  ptoPlanRows,
  ptoSurveyRows,
  ptoOperRows,
  vehicleRows,
  topTab,
  adminSection,
}: UseAppDeferredDataOptions<TPtoRow, TVehicleRow>) {
  const deferredPtoPlanRows = useDeferredValue(ptoPlanRows);
  const deferredPtoSurveyRows = useDeferredValue(ptoSurveyRows);
  const deferredPtoOperRows = useDeferredValue(ptoOperRows);
  const deferredVehicleRows = useDeferredValue(vehicleRows);
  const renderedTopTab = topTab;
  const needsReportRows = renderedTopTab === "reports"
    || (renderedTopTab === "admin" && adminSection === "reports");
  const needsDerivedReportRows = renderedTopTab === "reports";
  const needsAdminReportRows = renderedTopTab === "admin" && adminSection === "reports";
  const needsReportIndexes = needsDerivedReportRows || needsAdminReportRows;
  const needsAutoReportRows = needsDerivedReportRows || needsAdminReportRows;

  return {
    deferredPtoPlanRows,
    deferredPtoSurveyRows,
    deferredPtoOperRows,
    deferredVehicleRows,
    renderedTopTab,
    needsReportRows,
    needsDerivedReportRows,
    needsAdminReportRows,
    needsReportIndexes,
    needsAutoReportRows,
  };
}
