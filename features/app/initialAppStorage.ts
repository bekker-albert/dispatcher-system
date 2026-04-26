"use client";

import { adminStorageKeys } from "@/lib/storage/keys";

export const initialAppStorageKeys = Object.values(adminStorageKeys);

function readStoredValue(key: string) {
  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) return null;

  try {
    return JSON.parse(storedValue) as unknown;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function hasInitialLocalAppState() {
  return initialAppStorageKeys.some((key) => (
    key !== adminStorageKeys.appLocalUpdatedAt
    && window.localStorage.getItem(key) !== null
  ));
}

export function readInitialStoredAppState() {
  return {
    savedReportCustomers: readStoredValue(adminStorageKeys.reportCustomers),
    savedReportAreaOrder: readStoredValue(adminStorageKeys.reportAreaOrder),
    savedReportWorkOrder: readStoredValue(adminStorageKeys.reportWorkOrder),
    savedReportHeaderLabels: readStoredValue(adminStorageKeys.reportHeaderLabels),
    savedReportColumnWidths: readStoredValue(adminStorageKeys.reportColumnWidths),
    savedReportReasons: readStoredValue(adminStorageKeys.reportReasons),
    savedAreaShiftCutoffs: readStoredValue(adminStorageKeys.areaShiftCutoffs),
    savedCustomTabs: readStoredValue(adminStorageKeys.customTabs),
    savedTopTabs: readStoredValue(adminStorageKeys.topTabs),
    savedSubTabs: readStoredValue(adminStorageKeys.subTabs),
    savedVehicles: readStoredValue(adminStorageKeys.vehicles),
    savedDispatchSummaryRows: readStoredValue(adminStorageKeys.dispatchSummaryRows),
    savedPtoYears: readStoredValue(adminStorageKeys.ptoYears),
    savedPtoPlanRows: readStoredValue(adminStorageKeys.ptoPlanRows),
    savedPtoSurveyRows: readStoredValue(adminStorageKeys.ptoSurveyRows),
    savedPtoOperRows: readStoredValue(adminStorageKeys.ptoOperRows),
    savedPtoColumnWidths: readStoredValue(adminStorageKeys.ptoColumnWidths),
    savedPtoRowHeights: readStoredValue(adminStorageKeys.ptoRowHeights),
    savedPtoHeaderLabels: readStoredValue(adminStorageKeys.ptoHeaderLabels),
    savedPtoBucketValues: readStoredValue(adminStorageKeys.ptoBucketValues),
    savedPtoBucketRows: readStoredValue(adminStorageKeys.ptoBucketRows),
    savedOrgMembers: readStoredValue(adminStorageKeys.orgMembers),
    savedDependencyNodes: readStoredValue(adminStorageKeys.dependencyNodes),
    savedDependencyLinks: readStoredValue(adminStorageKeys.dependencyLinks),
    savedAdminLogs: readStoredValue(adminStorageKeys.adminLogs),
  };
}
