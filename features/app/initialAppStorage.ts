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
const initialPtoDataStorageKeys = initialPtoStorageKeys.filter((key) => key !== adminStorageKeys.ptoLocalUpdatedAt);

export const initialAppStorageKeys = Object.values(adminStorageKeys).filter((key) => !initialPtoStorageKeySet.has(key));

const initialMeaningfulAppStorageKeys = initialAppStorageKeys.filter((key) => (
  key !== adminStorageKeys.appLocalUpdatedAt
  && key !== adminStorageKeys.vehiclesLocalUpdatedAt
  && key !== adminStorageKeys.vehiclesSeedVersion
));

type ReadInitialStoredAppStateOptions = {
  includePto?: boolean;
};

export type InitialStoredAppState = ReturnType<typeof readInitialStoredAppState>;

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

function parseStoredValue(value: string | null | undefined) {
  if (!value) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function initialStorageKeysForOptions({ includePto = true }: ReadInitialStoredAppStateOptions = {}) {
  return includePto ? [...initialAppStorageKeys, ...initialPtoStorageKeys] : initialAppStorageKeys;
}

export function hasInitialLocalAppState() {
  return initialMeaningfulAppStorageKeys.some((key) => window.localStorage.getItem(key) !== null);
}

export function hasInitialStoredPtoState() {
  return initialPtoDataStorageKeys.some((key) => window.localStorage.getItem(key) !== null);
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

function parseInitialSharedStoredState(storage: Record<string, string>) {
  return {
    savedReportCustomers: parseStoredValue(storage[adminStorageKeys.reportCustomers]),
    savedReportAreaOrder: parseStoredValue(storage[adminStorageKeys.reportAreaOrder]),
    savedReportWorkOrder: parseStoredValue(storage[adminStorageKeys.reportWorkOrder]),
    savedReportHeaderLabels: parseStoredValue(storage[adminStorageKeys.reportHeaderLabels]),
    savedReportColumnWidths: parseStoredValue(storage[adminStorageKeys.reportColumnWidths]),
    savedReportReasons: parseStoredValue(storage[adminStorageKeys.reportReasons]),
    savedAreaShiftCutoffs: parseStoredValue(storage[adminStorageKeys.areaShiftCutoffs]),
    savedCustomTabs: parseStoredValue(storage[adminStorageKeys.customTabs]),
    savedTopTabs: parseStoredValue(storage[adminStorageKeys.topTabs]),
    savedSubTabs: parseStoredValue(storage[adminStorageKeys.subTabs]),
    savedVehicles: parseStoredValue(storage[adminStorageKeys.vehicles]),
    savedDispatchSummaryRows: parseStoredValue(storage[adminStorageKeys.dispatchSummaryRows]),
    savedOrgMembers: parseStoredValue(storage[adminStorageKeys.orgMembers]),
    savedDependencyNodes: parseStoredValue(storage[adminStorageKeys.dependencyNodes]),
    savedDependencyLinks: parseStoredValue(storage[adminStorageKeys.dependencyLinks]),
    savedAdminLogs: parseStoredValue(storage[adminStorageKeys.adminLogs]),
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

function parseInitialStoredPtoState(storage: Record<string, string>) {
  return {
    savedPtoYears: parseStoredValue(storage[adminStorageKeys.ptoYears]),
    savedPtoPlanRows: parseStoredValue(storage[adminStorageKeys.ptoPlanRows]),
    savedPtoSurveyRows: parseStoredValue(storage[adminStorageKeys.ptoSurveyRows]),
    savedPtoOperRows: parseStoredValue(storage[adminStorageKeys.ptoOperRows]),
    savedPtoColumnWidths: parseStoredValue(storage[adminStorageKeys.ptoColumnWidths]),
    savedPtoRowHeights: parseStoredValue(storage[adminStorageKeys.ptoRowHeights]),
    savedPtoHeaderLabels: parseStoredValue(storage[adminStorageKeys.ptoHeaderLabels]),
    savedPtoBucketValues: parseStoredValue(storage[adminStorageKeys.ptoBucketValues]),
    savedPtoBucketRows: parseStoredValue(storage[adminStorageKeys.ptoBucketRows]),
  };
}

export function collectInitialStoredAppStorage(options: ReadInitialStoredAppStateOptions = {}) {
  return Object.fromEntries(
    initialStorageKeysForOptions(options).flatMap((key) => {
      const value = window.localStorage.getItem(key);
      return value === null ? [] : [[key, value] as const];
    }),
  );
}

export function parseInitialStoredAppStateFromStorage(
  storage: Record<string, string>,
  {
    includePto = true,
  }: ReadInitialStoredAppStateOptions = {},
) {
  return {
    ...parseInitialSharedStoredState(storage),
    ...(includePto
      ? parseInitialStoredPtoState(storage)
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
