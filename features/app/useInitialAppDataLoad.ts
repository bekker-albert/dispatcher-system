"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  dependencyLinkFormNodePatch,
  normalizeStoredDependencyLinks,
  normalizeStoredDependencyNodes,
  normalizeStoredOrgMembers,
} from "@/features/admin/structure/adminStructurePersistence";
import { loadDefaultVehicleSeed } from "@/features/admin/vehicles/lib/defaultVehicleSeed";
import { readClientReportDateSelection } from "@/features/reports/lib/reportDateSelection";
import type { AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import { defaultAreaShiftScheduleArea, normalizeAreaShiftCutoffs } from "@/lib/domain/admin/area-schedule";
import type { DependencyLink, DependencyNode, OrgMember } from "@/lib/domain/admin/structure";
import { sharedAppSettingKeys } from "@/lib/domain/app/settings";
import { createDefaultDispatchSummaryRows, normalizeDispatchSummaryRows, type DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import { createDefaultSubTabs, normalizeStoredCustomTabs, normalizeStoredSubTabs, normalizeStoredTopTabs, type CustomTab, type EditableSubtabGroup, type SubTabConfig, type TopTabDefinition } from "@/lib/domain/navigation/tabs";
import { normalizePtoBucketManualRows, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { normalizePtoPlanRow, normalizeStoredPtoYears, type PtoPlanRow } from "@/lib/domain/pto/date-table";
import { normalizeStoredReportCustomers } from "@/lib/domain/reports/customers";
import { defaultReportCustomers } from "@/lib/domain/reports/defaults";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import { defaultVehicleSeedReplaceLimit, normalizeVehicleRow } from "@/lib/domain/vehicles/defaults";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { databaseConfigured } from "@/lib/data/config";
import { adminStorageKeys } from "@/lib/storage/keys";
import { isRecord, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringList, normalizeStringListRecord, normalizeStringRecord } from "@/lib/utils/normalizers";

type MutableRef<T> = {
  current: T;
};

type InitialAppDataLoadOptions = {
  defaultSubTabs: ReturnType<typeof createDefaultSubTabs>;
  saveClientSnapshotToDatabase: (reason: string) => Promise<void>;
  restoreAdminLogs: (storedLogs: unknown) => void;
  appDatabaseSaveSnapshotRef: MutableRef<string>;
  appSettingsDatabaseLoadedRef: MutableRef<boolean>;
  appSettingsDatabaseSaveSnapshotRef: MutableRef<string>;
  vehiclesDatabaseLoadedRef: MutableRef<boolean>;
  vehiclesDatabaseSaveSnapshotRef: MutableRef<string>;
  hasStoredPtoStateRef: MutableRef<boolean>;
  setAdminDataLoaded: Dispatch<SetStateAction<boolean>>;
  setReportCustomers: Dispatch<SetStateAction<ReportCustomerConfig[]>>;
  setReportAreaOrder: Dispatch<SetStateAction<string[]>>;
  setReportWorkOrder: Dispatch<SetStateAction<Record<string, string[]>>>;
  setReportHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setReportColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setReportReasons: Dispatch<SetStateAction<Record<string, string>>>;
  setAreaShiftCutoffs: Dispatch<SetStateAction<AreaShiftCutoffMap>>;
  setCustomTabs: Dispatch<SetStateAction<CustomTab[]>>;
  setTopTabs: Dispatch<SetStateAction<TopTabDefinition[]>>;
  setSubTabs: Dispatch<SetStateAction<Record<EditableSubtabGroup, SubTabConfig[]>>>;
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
  setDispatchSummaryRows: Dispatch<SetStateAction<DispatchSummaryRow[]>>;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoRowHeights: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  setOrgMembers: Dispatch<SetStateAction<OrgMember[]>>;
  setDependencyNodes: Dispatch<SetStateAction<DependencyNode[]>>;
  setDependencyLinks: Dispatch<SetStateAction<DependencyLink[]>>;
  setDependencyLinkForm: Dispatch<SetStateAction<DependencyLink>>;
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

export function useInitialAppDataLoad({
  defaultSubTabs,
  saveClientSnapshotToDatabase,
  restoreAdminLogs,
  appDatabaseSaveSnapshotRef,
  appSettingsDatabaseLoadedRef,
  appSettingsDatabaseSaveSnapshotRef,
  vehiclesDatabaseLoadedRef,
  vehiclesDatabaseSaveSnapshotRef,
  hasStoredPtoStateRef,
  setAdminDataLoaded,
  setReportCustomers,
  setReportAreaOrder,
  setReportWorkOrder,
  setReportHeaderLabels,
  setReportColumnWidths,
  setReportReasons,
  setAreaShiftCutoffs,
  setCustomTabs,
  setTopTabs,
  setSubTabs,
  setVehicleRows,
  setDispatchSummaryRows,
  setPtoManualYears,
  setPtoPlanRows,
  setPtoSurveyRows,
  setPtoOperRows,
  setPtoColumnWidths,
  setPtoRowHeights,
  setPtoHeaderLabels,
  setPtoBucketValues,
  setPtoBucketManualRows,
  setOrgMembers,
  setDependencyNodes,
  setDependencyLinks,
  setDependencyLinkForm,
}: InitialAppDataLoadOptions) {
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      try {
        const appStorageKeys = Object.values(adminStorageKeys);
        const hasLocalAppState = appStorageKeys.some((key) => (
          key !== adminStorageKeys.appLocalUpdatedAt
          && window.localStorage.getItem(key) !== null
        ));

        if (hasLocalAppState && databaseConfigured) {
          void saveClientSnapshotToDatabase("before-initial-database-load").catch((error) => {
            console.warn("Database client snapshot save failed:", error);
          });
        }

        if (databaseConfigured) {
          try {
            const { loadAppStateFromDatabase } = await import("@/lib/data/app-state");
            const databaseAppState = await loadAppStateFromDatabase();

            if (cancelled) return;

            const databaseStorage = databaseAppState?.storage ?? {};
            const localUpdatedAt = window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt);
            const localUpdatedTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
            const databaseUpdatedTime = databaseAppState?.updatedAt ? Date.parse(databaseAppState.updatedAt) : 0;
            const shouldUseDatabaseAppState = Object.keys(databaseStorage).length > 0
              && (
                !hasLocalAppState
                || (localUpdatedTime > 0 && databaseUpdatedTime > localUpdatedTime)
              );

            if (shouldUseDatabaseAppState) {
              appStorageKeys.forEach((key) => {
                const value = databaseStorage[key];
                if (typeof value === "string") {
                  window.localStorage.setItem(key, value);
                }
              });
              if (databaseAppState?.updatedAt) {
                window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, databaseAppState.updatedAt);
              }
              appDatabaseSaveSnapshotRef.current = JSON.stringify(databaseStorage);
            } else if (hasLocalAppState && !localUpdatedAt) {
              window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
            }
          } catch (error) {
            console.warn("Legacy app_state is not ready:", error);
          }

          try {
            const { loadAppSettingsFromDatabase } = await import("@/lib/data/settings");
            const databaseSettings = await loadAppSettingsFromDatabase([...sharedAppSettingKeys]);
            appSettingsDatabaseLoadedRef.current = true;

            if (cancelled) return;

            const databaseSettingsObject = Object.fromEntries(
              databaseSettings.map((setting) => [setting.key, setting.value]),
            );
            const databaseSettingsUpdatedTime = Math.max(
              0,
              ...databaseSettings.map((setting) => (
                setting.updated_at ? Date.parse(setting.updated_at) || 0 : 0
              )),
            );
            const currentLocalUpdatedAt = window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt);
            const currentLocalUpdatedTime = currentLocalUpdatedAt ? Date.parse(currentLocalUpdatedAt) : 0;
            const shouldUseDatabaseSettings = databaseSettings.length > 0
              && (
                !hasLocalAppState
                || (currentLocalUpdatedTime > 0 && databaseSettingsUpdatedTime > currentLocalUpdatedTime)
              );

            if (shouldUseDatabaseSettings) {
              databaseSettings.forEach((setting) => {
                window.localStorage.setItem(setting.key, JSON.stringify(setting.value));
              });
              if (databaseSettingsUpdatedTime > 0) {
                window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date(databaseSettingsUpdatedTime).toISOString());
              }
            }

            appSettingsDatabaseSaveSnapshotRef.current = JSON.stringify(databaseSettingsObject);
          } catch (error) {
            appSettingsDatabaseLoadedRef.current = false;
            console.warn("App settings table is not ready:", error);
          }
        }

        const savedReportCustomers = readStoredValue(adminStorageKeys.reportCustomers);
        const savedReportAreaOrder = readStoredValue(adminStorageKeys.reportAreaOrder);
        const savedReportWorkOrder = readStoredValue(adminStorageKeys.reportWorkOrder);
        const savedReportHeaderLabels = readStoredValue(adminStorageKeys.reportHeaderLabels);
        const savedReportColumnWidths = readStoredValue(adminStorageKeys.reportColumnWidths);
        const savedReportReasons = readStoredValue(adminStorageKeys.reportReasons);
        const savedAreaShiftCutoffs = readStoredValue(adminStorageKeys.areaShiftCutoffs);
        const savedCustomTabs = readStoredValue(adminStorageKeys.customTabs);
        const savedTopTabs = readStoredValue(adminStorageKeys.topTabs);
        const savedSubTabs = readStoredValue(adminStorageKeys.subTabs);
        let savedVehicles = readStoredValue(adminStorageKeys.vehicles);
        let loadedVehiclesFromDatabase = false;
        const savedDispatchSummaryRows = readStoredValue(adminStorageKeys.dispatchSummaryRows);
        const savedPtoYears = readStoredValue(adminStorageKeys.ptoYears);
        const savedPtoPlanRows = readStoredValue(adminStorageKeys.ptoPlanRows);
        const savedPtoSurveyRows = readStoredValue(adminStorageKeys.ptoSurveyRows);
        const savedPtoOperRows = readStoredValue(adminStorageKeys.ptoOperRows);
        const savedPtoColumnWidths = readStoredValue(adminStorageKeys.ptoColumnWidths);
        const savedPtoRowHeights = readStoredValue(adminStorageKeys.ptoRowHeights);
        const savedPtoHeaderLabels = readStoredValue(adminStorageKeys.ptoHeaderLabels);
        const savedPtoBucketValues = readStoredValue(adminStorageKeys.ptoBucketValues);
        const savedPtoBucketRows = readStoredValue(adminStorageKeys.ptoBucketRows);
        const savedOrgMembers = readStoredValue(adminStorageKeys.orgMembers);
        const savedDependencyNodes = readStoredValue(adminStorageKeys.dependencyNodes);
        const savedDependencyLinks = readStoredValue(adminStorageKeys.dependencyLinks);
        const savedAdminLogs = readStoredValue(adminStorageKeys.adminLogs);

        if (databaseConfigured) {
          try {
            const { loadVehiclesFromDatabase } = await import("@/lib/data/vehicles");
            const databaseVehicles = await loadVehiclesFromDatabase();
            vehiclesDatabaseLoadedRef.current = true;

            if (cancelled) return;

            if (databaseVehicles?.rows.length) {
              savedVehicles = databaseVehicles.rows;
              loadedVehiclesFromDatabase = true;
              vehiclesDatabaseSaveSnapshotRef.current = JSON.stringify(databaseVehicles.rows);
              window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(databaseVehicles.rows));
              if (databaseVehicles.updatedAt) {
                window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, databaseVehicles.updatedAt);
              }
            }
          } catch (error) {
            vehiclesDatabaseLoadedRef.current = false;
            console.warn("Vehicles table is not ready:", error);
          }
        }

        const hasSavedPtoState = Boolean(
          savedPtoYears
          || Array.isArray(savedPtoPlanRows)
          || Array.isArray(savedPtoSurveyRows)
          || Array.isArray(savedPtoOperRows)
          || savedPtoColumnWidths
          || savedPtoRowHeights
          || savedPtoHeaderLabels
          || savedPtoBucketValues
          || savedPtoBucketRows,
        );
        hasStoredPtoStateRef.current = hasSavedPtoState;
        if (hasSavedPtoState && !window.localStorage.getItem(adminStorageKeys.ptoLocalUpdatedAt)) {
          window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
        }

        const nextAreaShiftCutoffs = normalizeAreaShiftCutoffs(savedAreaShiftCutoffs);
        const preferredReportDate = readClientReportDateSelection(nextAreaShiftCutoffs, defaultAreaShiftScheduleArea);

        const nextReportAreaOrder = normalizeStringList(savedReportAreaOrder);
        const nextReportWorkOrder = normalizeStringListRecord(savedReportWorkOrder);
        const nextReportCustomers = normalizeStoredReportCustomers(savedReportCustomers, defaultReportCustomers).map((customer) => {
          const hasCustomerWorkOrder = Object.values(customer.workOrder).some((rowKeys) => rowKeys.length > 0);

          return {
            ...customer,
            areaOrder: customer.areaOrder.length > 0 ? customer.areaOrder : [...nextReportAreaOrder],
            workOrder: hasCustomerWorkOrder
              ? customer.workOrder
              : Object.fromEntries(Object.entries(nextReportWorkOrder).map(([area, rowKeys]) => [area, [...rowKeys]])),
          };
        });

        setReportCustomers(nextReportCustomers);
        setReportAreaOrder(nextReportAreaOrder);
        setReportWorkOrder(nextReportWorkOrder);
        setReportHeaderLabels(normalizeStringRecord(savedReportHeaderLabels));
        setReportColumnWidths(normalizeNumberRecord(savedReportColumnWidths, 42, 520));
        setReportReasons(normalizeStringRecord(savedReportReasons));
        setAreaShiftCutoffs(nextAreaShiftCutoffs);

        setCustomTabs(normalizeStoredCustomTabs(savedCustomTabs));

        if (savedTopTabs) {
          setTopTabs(normalizeStoredTopTabs(savedTopTabs));
        }

        if (savedSubTabs) {
          setSubTabs(normalizeStoredSubTabs(savedSubTabs, defaultSubTabs));
        }

        const savedVehicleSeedVersion = window.localStorage.getItem(adminStorageKeys.vehiclesSeedVersion);
        const needsVehicleSeed = !loadedVehiclesFromDatabase && (!Array.isArray(savedVehicles) || savedVehicles.length <= defaultVehicleSeedReplaceLimit);
        const defaultVehicleSeed = needsVehicleSeed ? await loadDefaultVehicleSeed() : null;
        if (cancelled) return;
        const shouldUseVehicleSeed = defaultVehicleSeed !== null && defaultVehicleSeed.rows.length > 0 && (
          !Array.isArray(savedVehicles)
          || savedVehicleSeedVersion !== defaultVehicleSeed.version
        );

        if (shouldUseVehicleSeed && defaultVehicleSeed) {
          setVehicleRows(defaultVehicleSeed.vehicles);
          window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(defaultVehicleSeed.vehicles));
          window.localStorage.setItem(adminStorageKeys.vehiclesSeedVersion, defaultVehicleSeed.version);
        } else if (Array.isArray(savedVehicles)) {
          setVehicleRows(savedVehicles.map((vehicle) => normalizeVehicleRow(vehicle)));
        }

        const parsedDispatchSummaryRows = normalizeDispatchSummaryRows(savedDispatchSummaryRows, preferredReportDate);
        if (parsedDispatchSummaryRows) {
          const hasEditableDispatchRows = parsedDispatchSummaryRows.some((row) => row.shift === "night" || row.shift === "day");
          setDispatchSummaryRows(hasEditableDispatchRows
            ? parsedDispatchSummaryRows
            : parsedDispatchSummaryRows.map((row) => (row.shift === "daily" ? { ...row, shift: "night" } : row)));
        } else if (shouldUseVehicleSeed) {
          setDispatchSummaryRows(createDefaultDispatchSummaryRows(defaultVehicleSeed.vehicles, preferredReportDate));
        }

        if (savedPtoYears) {
          setPtoManualYears(normalizeStoredPtoYears(savedPtoYears));
        }

        if (Array.isArray(savedPtoPlanRows)) {
          setPtoPlanRows(savedPtoPlanRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        if (Array.isArray(savedPtoSurveyRows)) {
          setPtoSurveyRows(savedPtoSurveyRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        if (Array.isArray(savedPtoOperRows)) {
          setPtoOperRows(savedPtoOperRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        setPtoColumnWidths(normalizeNumberRecord(savedPtoColumnWidths, 44, 800));
        setPtoRowHeights(normalizeNumberRecord(savedPtoRowHeights, 28, 180));
        setPtoHeaderLabels(normalizeStringRecord(savedPtoHeaderLabels));
        setPtoBucketValues(normalizeDecimalRecord(savedPtoBucketValues, 0, 100000));
        setPtoBucketManualRows(normalizePtoBucketManualRows(savedPtoBucketRows));

        const normalizedOrgMembers = normalizeStoredOrgMembers(savedOrgMembers);
        if (normalizedOrgMembers) {
          setOrgMembers(normalizedOrgMembers);
        }

        const normalizedDependencyNodes = normalizeStoredDependencyNodes(savedDependencyNodes);
        if (normalizedDependencyNodes) {
          setDependencyNodes(normalizedDependencyNodes);

          const dependencyLinkFormPatch = dependencyLinkFormNodePatch(normalizedDependencyNodes);
          if (dependencyLinkFormPatch) {
            setDependencyLinkForm((current) => ({
              ...current,
              ...dependencyLinkFormPatch,
            }));
          }
        }

        const normalizedDependencyLinks = normalizeStoredDependencyLinks(savedDependencyLinks);
        if (normalizedDependencyLinks) {
          setDependencyLinks(normalizedDependencyLinks);
        }

        restoreAdminLogs(savedAdminLogs);
      } finally {
        if (cancelled) return;
        setAdminDataLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    defaultSubTabs,
    hasStoredPtoStateRef,
    restoreAdminLogs,
    saveClientSnapshotToDatabase,
    setAdminDataLoaded,
    setAreaShiftCutoffs,
    setCustomTabs,
    setDependencyLinkForm,
    setDependencyLinks,
    setDependencyNodes,
    setDispatchSummaryRows,
    setOrgMembers,
    setPtoBucketManualRows,
    setPtoBucketValues,
    setPtoColumnWidths,
    setPtoHeaderLabels,
    setPtoManualYears,
    setPtoOperRows,
    setPtoPlanRows,
    setPtoRowHeights,
    setPtoSurveyRows,
    setReportAreaOrder,
    setReportColumnWidths,
    setReportCustomers,
    setReportHeaderLabels,
    setReportReasons,
    setReportWorkOrder,
    setSubTabs,
    setTopTabs,
    setVehicleRows,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
  ]);
}
