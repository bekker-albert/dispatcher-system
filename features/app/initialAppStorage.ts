"use client";

import { adminStorageKeys } from "@/lib/storage/keys";

export const initialPtoStorageKeys = [
  adminStorageKeys.ptoYears,
  adminStorageKeys.ptoPlanRows,
  adminStorageKeys.ptoSurveyRows,
  adminStorageKeys.ptoOperRows,
  adminStorageKeys.ptoColumnWidths,
  adminStorageKeys.ptoRowHeights,
  adminStorageKeys.ptoHeaderLabels,
  adminStorageKeys.ptoBucketValues,
  adminStorageKeys.ptoBucketRows,
  adminStorageKeys.ptoLocalUpdatedAt,
];

const initialPtoStorageKeySet = new Set(initialPtoStorageKeys);

export const initialAppStorageKeys = Object.values(adminStorageKeys).filter((key) => !initialPtoStorageKeySet.has(key));

type ReadInitialStoredAppStateOptions = {
  includePto?: boolean;
};

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

export function readInitialStoredAppState({
  includePto = true,
}: ReadInitialStoredAppStateOptions = {}) {
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
    savedPtoYears: includePto ? readStoredValue(adminStorageKeys.ptoYears) : null,
    savedPtoPlanRows: includePto ? readStoredValue(adminStorageKeys.ptoPlanRows) : null,
    savedPtoSurveyRows: includePto ? readStoredValue(adminStorageKeys.ptoSurveyRows) : null,
    savedPtoOperRows: includePto ? readStoredValue(adminStorageKeys.ptoOperRows) : null,
    savedPtoColumnWidths: includePto ? readStoredValue(adminStorageKeys.ptoColumnWidths) : null,
    savedPtoRowHeights: includePto ? readStoredValue(adminStorageKeys.ptoRowHeights) : null,
    savedPtoHeaderLabels: includePto ? readStoredValue(adminStorageKeys.ptoHeaderLabels) : null,
    savedPtoBucketValues: includePto ? readStoredValue(adminStorageKeys.ptoBucketValues) : null,
    savedPtoBucketRows: includePto ? readStoredValue(adminStorageKeys.ptoBucketRows) : null,
    savedOrgMembers: readStoredValue(adminStorageKeys.orgMembers),
    savedDependencyNodes: readStoredValue(adminStorageKeys.dependencyNodes),
    savedDependencyLinks: readStoredValue(adminStorageKeys.dependencyLinks),
    savedAdminLogs: readStoredValue(adminStorageKeys.adminLogs),
  };
}
