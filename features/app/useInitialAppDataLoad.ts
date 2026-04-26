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
import { loadInitialAppDatabaseBootstrap } from "@/features/app/initialAppDatabaseBootstrap";
import { hasInitialLocalAppState, readInitialStoredAppState } from "@/features/app/initialAppStorage";

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
        const hasLocalAppState = hasInitialLocalAppState();

        if (hasLocalAppState && databaseConfigured) {
          void saveClientSnapshotToDatabase("before-initial-database-load").catch((error) => {
            console.warn("Database client snapshot save failed:", error);
          });
        }

        if (databaseConfigured) {
          const databaseBootstrapCompleted = await loadInitialAppDatabaseBootstrap({
            hasLocalAppState,
            isCancelled: () => cancelled,
            appDatabaseSaveSnapshotRef,
            appSettingsDatabaseLoadedRef,
            appSettingsDatabaseSaveSnapshotRef,
          });
          if (!databaseBootstrapCompleted) return;
        }

        const storedState = readInitialStoredAppState();
        let savedVehicles = storedState.savedVehicles;
        let loadedVehiclesFromDatabase = false;

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
          storedState.savedPtoYears
          || Array.isArray(storedState.savedPtoPlanRows)
          || Array.isArray(storedState.savedPtoSurveyRows)
          || Array.isArray(storedState.savedPtoOperRows)
          || storedState.savedPtoColumnWidths
          || storedState.savedPtoRowHeights
          || storedState.savedPtoHeaderLabels
          || storedState.savedPtoBucketValues
          || storedState.savedPtoBucketRows,
        );
        hasStoredPtoStateRef.current = hasSavedPtoState;
        if (hasSavedPtoState && !window.localStorage.getItem(adminStorageKeys.ptoLocalUpdatedAt)) {
          window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
        }

        const nextAreaShiftCutoffs = normalizeAreaShiftCutoffs(storedState.savedAreaShiftCutoffs);
        const preferredReportDate = readClientReportDateSelection(nextAreaShiftCutoffs, defaultAreaShiftScheduleArea);

        const nextReportAreaOrder = normalizeStringList(storedState.savedReportAreaOrder);
        const nextReportWorkOrder = normalizeStringListRecord(storedState.savedReportWorkOrder);
        const nextReportCustomers = normalizeStoredReportCustomers(storedState.savedReportCustomers, defaultReportCustomers).map((customer) => {
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
        setReportHeaderLabels(normalizeStringRecord(storedState.savedReportHeaderLabels));
        setReportColumnWidths(normalizeNumberRecord(storedState.savedReportColumnWidths, 42, 520));
        setReportReasons(normalizeStringRecord(storedState.savedReportReasons));
        setAreaShiftCutoffs(nextAreaShiftCutoffs);

        setCustomTabs(normalizeStoredCustomTabs(storedState.savedCustomTabs));

        if (storedState.savedTopTabs) {
          setTopTabs(normalizeStoredTopTabs(storedState.savedTopTabs));
        }

        if (storedState.savedSubTabs) {
          setSubTabs(normalizeStoredSubTabs(storedState.savedSubTabs, defaultSubTabs));
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

        const parsedDispatchSummaryRows = normalizeDispatchSummaryRows(storedState.savedDispatchSummaryRows, preferredReportDate);
        if (parsedDispatchSummaryRows) {
          const hasEditableDispatchRows = parsedDispatchSummaryRows.some((row) => row.shift === "night" || row.shift === "day");
          setDispatchSummaryRows(hasEditableDispatchRows
            ? parsedDispatchSummaryRows
            : parsedDispatchSummaryRows.map((row) => (row.shift === "daily" ? { ...row, shift: "night" } : row)));
        } else if (shouldUseVehicleSeed) {
          setDispatchSummaryRows(createDefaultDispatchSummaryRows(defaultVehicleSeed.vehicles, preferredReportDate));
        }

        if (storedState.savedPtoYears) {
          setPtoManualYears(normalizeStoredPtoYears(storedState.savedPtoYears));
        }

        if (Array.isArray(storedState.savedPtoPlanRows)) {
          setPtoPlanRows(storedState.savedPtoPlanRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        if (Array.isArray(storedState.savedPtoSurveyRows)) {
          setPtoSurveyRows(storedState.savedPtoSurveyRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        if (Array.isArray(storedState.savedPtoOperRows)) {
          setPtoOperRows(storedState.savedPtoOperRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        setPtoColumnWidths(normalizeNumberRecord(storedState.savedPtoColumnWidths, 44, 800));
        setPtoRowHeights(normalizeNumberRecord(storedState.savedPtoRowHeights, 28, 180));
        setPtoHeaderLabels(normalizeStringRecord(storedState.savedPtoHeaderLabels));
        setPtoBucketValues(normalizeDecimalRecord(storedState.savedPtoBucketValues, 0, 100000));
        setPtoBucketManualRows(normalizePtoBucketManualRows(storedState.savedPtoBucketRows));

        const normalizedOrgMembers = normalizeStoredOrgMembers(storedState.savedOrgMembers);
        if (normalizedOrgMembers) {
          setOrgMembers(normalizedOrgMembers);
        }

        const normalizedDependencyNodes = normalizeStoredDependencyNodes(storedState.savedDependencyNodes);
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

        const normalizedDependencyLinks = normalizeStoredDependencyLinks(storedState.savedDependencyLinks);
        if (normalizedDependencyLinks) {
          setDependencyLinks(normalizedDependencyLinks);
        }

        restoreAdminLogs(storedState.savedAdminLogs);
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
