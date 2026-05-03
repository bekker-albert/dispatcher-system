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

const initialMeaningfulAppStorageKeys = initialAppStorageKeys.filter((key) => (
  key !== adminStorageKeys.appLocalUpdatedAt
  && key !== adminStorageKeys.vehiclesLocalUpdatedAt
  && key !== adminStorageKeys.vehiclesSeedVersion
));

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
  return initialMeaningfulAppStorageKeys.some((key) => window.localStorage.getItem(key) !== null);
}

function readInitialSharedStoredState() {
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
    savedOrgMembers: readStoredValue(adminStorageKeys.orgMembers),
    savedDependencyNodes: readStoredValue(adminStorageKeys.dependencyNodes),
    savedDependencyLinks: readStoredValue(adminStorageKeys.dependencyLinks),
    savedAdminLogs: readStoredValue(adminStorageKeys.adminLogs),
  };
}

export function readInitialStoredPtoState() {
  return {
    savedPtoYears: readStoredValue(adminStorageKeys.ptoYears),
    savedPtoPlanRows: readStoredValue(adminStorageKeys.ptoPlanRows),
    savedPtoSurveyRows: readStoredValue(adminStorageKeys.ptoSurveyRows),
    savedPtoOperRows: readStoredValue(adminStorageKeys.ptoOperRows),
    savedPtoColumnWidths: readStoredValue(adminStorageKeys.ptoColumnWidths),
    savedPtoRowHeights: readStoredValue(adminStorageKeys.ptoRowHeights),
    savedPtoHeaderLabels: readStoredValue(adminStorageKeys.ptoHeaderLabels),
    savedPtoBucketValues: readStoredValue(adminStorageKeys.ptoBucketValues),
    savedPtoBucketRows: readStoredValue(adminStorageKeys.ptoBucketRows),
  };
}

export function readInitialStoredAppState({
  includePto = true,
}: ReadInitialStoredAppStateOptions = {}) {
  return {
    ...readInitialSharedStoredState(),
    ...(includePto
      ? readInitialStoredPtoState()
      : {
          savedPtoYears: null,
          savedPtoPlanRows: null,
          savedPtoSurveyRows: null,
          savedPtoOperRows: null,
          savedPtoColumnWidths: null,
          savedPtoRowHeights: null,
          savedPtoHeaderLabels: null,
          savedPtoBucketValues: null,
          savedPtoBucketRows: null,
        }),
  };
}
