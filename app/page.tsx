"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useHeaderSubtabsOffset } from "@/components/layout/useHeaderSubtabsOffset";
import { useEditableHeaderLabels } from "@/components/shared/useEditableHeaderLabels";
import { useTableResizeHandlers } from "@/components/shared/useTableResizeHandlers";
import { AdminAiSection } from "@/features/admin/ai/AdminAiSection";
import { useClientSnapshotsPanel } from "@/features/admin/database/useClientSnapshotsPanel";
import { useAdminLogsState } from "@/features/admin/logs/useAdminLogsState";
import { useGlobalCellSelectionEffects } from "@/features/app/useGlobalCellSelectionEffects";
import { useAppLocalPersistence } from "@/features/app/useAppLocalPersistence";
import { useAppUndoHistory } from "@/features/app/useAppUndoHistory";
import { ContractorsSection } from "@/features/contractors/ContractorsSection";
import { useDispatchSummaryEditor } from "@/features/dispatch/useDispatchSummaryEditor";
import { useDispatchSummaryViewModel } from "@/features/dispatch/useDispatchSummaryViewModel";
import { FleetSection } from "@/features/fleet/FleetSection";
import { useFleetRows } from "@/features/fleet/useFleetRows";
import { FuelSection } from "@/features/fuel/FuelSection";
import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";
import { useAdminVehicleRowsViewModel } from "@/features/admin/vehicles/useAdminVehicleRowsViewModel";
import { useVehicleFilterMenu } from "@/features/admin/vehicles/useVehicleFilterMenu";
import {
  dependencyLinkFormNodePatch,
  normalizeStoredDependencyLinks,
  normalizeStoredDependencyNodes,
  normalizeStoredOrgMembers,
} from "@/features/admin/structure/adminStructurePersistence";
import { AdminStructureSection } from "@/features/admin/structure/AdminStructureSection";
import { useAdminStructureState } from "@/features/admin/structure/useAdminStructureState";
import {
  AdminDatabaseSection,
  AdminLogsSection,
  AdminNavigationSection,
  AdminReportSettingsSection,
  AdminVehiclesSection,
  DispatchSection,
  PtoSection,
  ReportsSection,
} from "@/features/app/lazySections";
import { loadDefaultVehicleSeed } from "@/features/admin/vehicles/lib/defaultVehicleSeed";
import { useAdminVehicleEditMode } from "@/features/admin/vehicles/useAdminVehicleEditMode";
import { useVehicleExcelTransfer } from "@/features/admin/vehicles/useVehicleExcelTransfer";
import { useVehicleInlineGridEditor } from "@/features/admin/vehicles/useVehicleInlineGridEditor";
import { useVehicleRowsPersistence } from "@/features/admin/vehicles/useVehicleRowsPersistence";
import { useVehicleRowsEditor } from "@/features/admin/vehicles/useVehicleRowsEditor";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import { PtoDatabaseGate } from "@/features/pto/PtoDatabaseGate";
import { createPtoDatabaseState, normalizeLoadedPtoDatabaseState, ptoDatabaseMessages, resolvePtoDatabaseLoadResolution, serializePtoDatabaseState, validatePtoDatabaseLoadState } from "@/features/pto/ptoPersistenceModel";
import { usePtoBucketsEditor } from "@/features/pto/usePtoBucketsEditor";
import { usePtoBucketsViewModel } from "@/features/pto/usePtoBucketsViewModel";
import { PtoDateTableContainer } from "@/features/pto/PtoDateTableContainer";
import { usePtoDateExcelTransfer } from "@/features/pto/usePtoDateExcelTransfer";
import { usePtoDateEditingReset } from "@/features/pto/usePtoDateEditingReset";
import { usePtoDateTableContext } from "@/features/pto/usePtoDateTableContext";
import { usePtoDateRowValueEditor } from "@/features/pto/usePtoDateRowValueEditor";
import { usePtoDateViewModel } from "@/features/pto/usePtoDateViewModel";
import { usePtoDatabaseSave } from "@/features/pto/usePtoDatabaseSave";
import { usePtoLocalPersistence } from "@/features/pto/usePtoLocalPersistence";
import { usePtoPendingFieldFocus } from "@/features/pto/usePtoPendingFieldFocus";
import { CustomTabSection } from "@/features/navigation/CustomTabSection";
import { useAppTabsState } from "@/features/navigation/useAppTabsState";
import { useNavigationSelectionHandlers } from "@/features/navigation/useNavigationSelectionHandlers";
import type { PtoDropTarget } from "@/features/pto/ptoDateInteractionTypes";
import { usePtoLinkedRowsEditor } from "@/features/pto/usePtoLinkedRowsEditor";
import { usePtoRowTextDrafts } from "@/features/pto/usePtoRowTextDrafts";
import { usePtoYearEditor } from "@/features/pto/usePtoYearEditor";
import { usePtoDateViewport } from "@/features/pto/usePtoDateViewport";
import { reportPrintCss } from "@/features/reports/printCss";
import { readClientReportDateSelection } from "@/features/reports/lib/reportDateSelection";
import { useAdminReportSettingsViewModel } from "@/features/reports/useAdminReportSettingsViewModel";
import { useAdminReportCustomerEditor } from "@/features/reports/useAdminReportCustomerEditor";
import { useAdminReportFactSourceEditor } from "@/features/reports/useAdminReportFactSourceEditor";
import { useAdminReportRowLabelEditor } from "@/features/reports/useAdminReportRowLabelEditor";
import { useAdminReportSummaryRowsEditor } from "@/features/reports/useAdminReportSummaryRowsEditor";
import { useAreaShiftCutoffEditor } from "@/features/reports/useAreaShiftCutoffEditor";
import { useAreaShiftScheduleAreas } from "@/features/reports/useAreaShiftScheduleAreas";
import { useCustomerReportViewModel } from "@/features/reports/useCustomerReportViewModel";
import { useReportDateSelectionState } from "@/features/reports/useReportDateSelectionState";
import { useReportHeaderActions } from "@/features/reports/useReportHeaderActions";
import { useReportColumnLayout } from "@/features/reports/useReportColumnLayout";
import { useReportReasonDrafts } from "@/features/reports/useReportReasonDrafts";
import { useReportRowsModel } from "@/features/reports/useReportRowsModel";
import { useReportSelectionGuards } from "@/features/reports/useReportSelectionGuards";
import { SafetySection } from "@/features/safety-driving/SafetySection";
import { UserProfileSection } from "@/features/users/UserProfileSection";
import { sharedAppSettingKeys } from "@/lib/domain/app/settings";
import { defaultAreaShiftCutoffs, defaultAreaShiftScheduleArea, normalizeAreaShiftCutoffs, type AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import { type AdminReportCustomerSettingsTab, type AdminSection, type StructureSection } from "@/lib/domain/admin/navigation";
import { createDefaultDispatchSummaryRows, normalizeDispatchSummaryRows, type DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import { normalizeStoredReportCustomers } from "@/lib/domain/reports/customers";
import { defaultReportCustomerId, defaultReportCustomers } from "@/lib/domain/reports/defaults";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import { defaultPtoPlanMonth, emptyPtoDraftRowFields, normalizePtoPlanRow, normalizeStoredPtoYears, type PtoPlanRow } from "@/lib/domain/pto/date-table";
import { defaultPtoOperRows, defaultPtoPlanRows, defaultPtoSurveyRows, defaultReportDate } from "@/lib/domain/pto/defaults";
import { countPtoStateData } from "@/lib/domain/pto/state-stats";
import { createDefaultSubTabs, customTabKey, normalizeStoredCustomTabs, normalizeStoredSubTabs, normalizeStoredTopTabs } from "@/lib/domain/navigation/tabs";
import { normalizePtoBucketManualRows, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { defaultContractors, defaultUserCard } from "@/lib/domain/reference/defaults";
import { createDefaultVehicles, defaultVehicleSeedReplaceLimit, normalizeVehicleRow } from "@/lib/domain/vehicles/defaults";
import { adminVehicleFallbackPreviewRows, vehicleInlineFieldDomKey, type VehicleFilterKey, type VehicleFilters, type VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { databaseConfigured, dataProviderLabel } from "@/lib/data/config";
import { clientSnapshotRestoreFlagKey, clientSnapshotStats, savePtoLocalRecoveryBackup } from "@/lib/storage/client-snapshots";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage, isRecord, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringList, normalizeStringListRecord, normalizeStringRecord } from "@/lib/utils/normalizers";
import { SectionCard } from "@/shared/ui/layout";
import { SaveStatusIndicator } from "@/shared/ui/SaveStatusIndicator";
import { useSaveStatus } from "@/shared/ui/useSaveStatus";

const defaultVehicles: VehicleRow[] = createDefaultVehicles([]);

const defaultSubTabs = createDefaultSubTabs(Object.keys(defaultContractors));

export default function App() {
  const {
    topTab,
    setTopTab,
    topTabs,
    setTopTabs,
    subTabs,
    setSubTabs,
    customTabs,
    setCustomTabs,
    addCustomTab,
    updateTopTabLabel,
    deleteTopTab,
    showTopTab,
    updateCustomTabTitle,
    showCustomTab,
    deleteCustomTab,
  } = useAppTabsState({ defaultSubTabs });

  const [dispatchTab, setDispatchTab] = useState("daily");
  const [fleetTab, setFleetTab] = useState("all");
  const [contractorTab, setContractorTab] = useState("AA Mining");
  const [fuelTab, setFuelTab] = useState("general");
  const [ptoTab, setPtoTab] = useState("bodies");
  const [tbTab, setTbTab] = useState("list");
  const [adminVehiclesEditing, setAdminVehiclesEditing] = useState(false);
  const [showAllVehicleRows, setShowAllVehicleRows] = useState(false);
  const [vehiclePreviewRowLimit, setVehiclePreviewRowLimit] = useState(adminVehicleFallbackPreviewRows);
  const [vehicleRows, setVehicleRows] = useState<VehicleRow[]>(defaultVehicles);
  const [dispatchSummaryRows, setDispatchSummaryRows] = useState<DispatchSummaryRow[]>(() => createDefaultDispatchSummaryRows(defaultVehicles, defaultReportDate));
  const [dispatchVehicleToAddId, setDispatchVehicleToAddId] = useState("");
  const [vehicleFilters, setVehicleFilters] = useState<VehicleFilters>({});
  const [vehicleFilterDrafts, setVehicleFilterDrafts] = useState<VehicleFilters>({});
  const [openVehicleFilter, setOpenVehicleFilter] = useState<VehicleFilterKey | null>(null);
  const [vehicleFilterSearch, setVehicleFilterSearch] = useState<Partial<Record<VehicleFilterKey, string>>>({});
  const [pendingVehicleFocus, setPendingVehicleFocus] = useState<{ id: number; field: VehicleInlineField; edit?: boolean; selectContents?: boolean } | null>(null);
  const [activeVehicleCell, setActiveVehicleCell] = useState<string | null>(null);
  const [vehicleSelectionAnchorCell, setVehicleSelectionAnchorCell] = useState<{ id: number; field: VehicleInlineField } | null>(null);
  const [selectedVehicleCellKeys, setSelectedVehicleCellKeys] = useState<string[]>([]);
  const [editingVehicleCell, setEditingVehicleCell] = useState<string | null>(null);
  const [vehicleCellDraft, setVehicleCellDraft] = useState("");
  const [vehicleCellInitialDraft, setVehicleCellInitialDraft] = useState("");
  const vehicleCellSkipBlurCommitRef = useRef(false);
  const vehicleSelectionDraggingRef = useRef(false);
  const vehicleSelectionAnchorRef = useRef<{ id: number; field: VehicleInlineField } | null>(null);
  const adminVehicleTableScrollRef = useRef<HTMLDivElement | null>(null);
  const vehicleRowsRef = useRef(vehicleRows);
  const vehiclesDatabaseLoadedRef = useRef(false);
  const vehiclesDatabaseSaveSnapshotRef = useRef("");
  const appDatabaseSaveSnapshotRef = useRef("");
  const appSettingsDatabaseLoadedRef = useRef(false);
  const appSettingsDatabaseSaveSnapshotRef = useRef("");
  const [draggedPtoRowId, setDraggedPtoRowId] = useState<string | null>(null);
  const [ptoDropTarget, setPtoDropTarget] = useState<PtoDropTarget | null>(null);
  const [ptoFormulaCell, setPtoFormulaCell] = useState<PtoFormulaCell | null>(null);
  const [ptoFormulaDraft, setPtoFormulaDraft] = useState("");
  const [ptoInlineEditCell, setPtoInlineEditCell] = useState<PtoFormulaCell | null>(null);
  const [ptoInlineEditInitialDraft, setPtoInlineEditInitialDraft] = useState("");
  const [ptoSelectionAnchorCell, setPtoSelectionAnchorCell] = useState<PtoFormulaCell | null>(null);
  const [ptoSelectedCellKeys, setPtoSelectedCellKeys] = useState<string[]>([]);
  const [ptoDateEditing, setPtoDateEditing] = useState(false);
  const [hoveredPtoAddRowId, setHoveredPtoAddRowId] = useState<string | null>(null);
  const [ptoPendingFieldFocus, setPtoPendingFieldFocus] = useState<{ rowId: string; field: string } | null>(null);
  const [ptoRowFieldDrafts, setPtoRowFieldDrafts] = useState<Record<string, string>>({});
  const [ptoDraftRowFields, setPtoDraftRowFields] = useState(() => ({ ...emptyPtoDraftRowFields }));
  const ptoSelectionDraggingRef = useRef(false);
  const vehicleImportInputRef = useRef<HTMLInputElement | null>(null);
  const ptoPlanImportInputRef = useRef<HTMLInputElement | null>(null);
  const hasStoredPtoStateRef = useRef(false);
  const ptoDatabaseLoadedRef = useRef(false);
  const [reportArea, setReportArea] = useState("Все участки");
  const [reportCustomerId, setReportCustomerId] = useState(defaultReportCustomerId);
  const [adminReportCustomerId, setAdminReportCustomerId] = useState(defaultReportCustomerId);
  const [adminReportCustomerSettingsTab, setAdminReportCustomerSettingsTab] = useState<AdminReportCustomerSettingsTab>("display");
  const [editingReportRowLabelKeys, setEditingReportRowLabelKeys] = useState<string[]>([]);
  const [expandedReportSummaryIds, setExpandedReportSummaryIds] = useState<string[]>([]);
  const [editingReportFactSourceRowKey, setEditingReportFactSourceRowKey] = useState<string | null>(null);
  const [reportCustomers, setReportCustomers] = useState<ReportCustomerConfig[]>(defaultReportCustomers);
  const [reportAreaOrder, setReportAreaOrder] = useState<string[]>([]);
  const [reportWorkOrder, setReportWorkOrder] = useState<Record<string, string[]>>({});
  const [reportHeaderLabels, setReportHeaderLabels] = useState<Record<string, string>>({});
  const [reportColumnWidths, setReportColumnWidths] = useState<Record<string, number>>({});
  const [reportReasons, setReportReasons] = useState<Record<string, string>>({});
  const [editingReportHeaderKey, setEditingReportHeaderKey] = useState<string | null>(null);
  const [reportHeaderDraft, setReportHeaderDraft] = useState("");
  const [areaShiftCutoffs, setAreaShiftCutoffs] = useState<AreaShiftCutoffMap>(defaultAreaShiftCutoffs);
  const [ptoPlanYear, setPtoPlanYear] = useState(defaultPtoPlanMonth.slice(0, 4));
  const [ptoYearInput, setPtoYearInput] = useState("");
  const [ptoYearDialogOpen, setPtoYearDialogOpen] = useState(false);
  const [ptoManualYears, setPtoManualYears] = useState<string[]>([defaultPtoPlanMonth.slice(0, 4)]);
  const [ptoAreaFilter, setPtoAreaFilter] = useState("Все участки");
  const [expandedPtoMonths, setExpandedPtoMonths] = useState<Record<string, boolean>>({ [defaultPtoPlanMonth]: true });
  const [ptoPlanRows, setPtoPlanRows] = useState<PtoPlanRow[]>(() => defaultPtoPlanRows.map(normalizePtoPlanRow));
  const [ptoSurveyRows, setPtoSurveyRows] = useState<PtoPlanRow[]>(() => defaultPtoSurveyRows.map(normalizePtoPlanRow));
  const [ptoOperRows, setPtoOperRows] = useState<PtoPlanRow[]>(() => defaultPtoOperRows.map(normalizePtoPlanRow));
  const [ptoColumnWidths, setPtoColumnWidths] = useState<Record<string, number>>({});
  const [ptoRowHeights, setPtoRowHeights] = useState<Record<string, number>>({});
  const [ptoHeaderLabels, setPtoHeaderLabels] = useState<Record<string, string>>({});
  const [editingPtoHeaderKey, setEditingPtoHeaderKey] = useState<string | null>(null);
  const [ptoHeaderDraft, setPtoHeaderDraft] = useState("");
  const [ptoBucketValues, setPtoBucketValues] = useState<Record<string, number>>({});
  const [ptoBucketManualRows, setPtoBucketManualRows] = useState<PtoBucketRow[]>([]);
  const {
    orgMembers,
    setOrgMembers,
    orgMemberForm,
    editingOrgMemberId,
    setEditingOrgMemberId,
    updateOrgMember,
    updateOrgMemberForm,
    addOrgMember,
    deleteOrgMember,
    dependencyNodes,
    setDependencyNodes,
    dependencyLinks,
    setDependencyLinks,
    dependencyNodeForm,
    dependencyLinkForm,
    setDependencyLinkForm,
    editingDependencyNodeId,
    setEditingDependencyNodeId,
    editingDependencyLinkId,
    setEditingDependencyLinkId,
    updateDependencyNode,
    updateDependencyNodeForm,
    addDependencyNode,
    deleteDependencyNode,
    updateDependencyLink,
    updateDependencyLinkForm,
    addDependencyLink,
    deleteDependencyLink,
  } = useAdminStructureState();
  const [structureSection, setStructureSection] = useState<StructureSection>("scheme");
  const [adminSection, setAdminSection] = useState<AdminSection>("vehicles");
  const {
    reportDate,
    selectReportDate,
  } = useReportDateSelectionState({
    topTab,
    adminSection,
    reportArea,
    ptoAreaFilter,
    areaShiftCutoffs,
  });
  const { updateAreaShiftCutoff } = useAreaShiftCutoffEditor({ setAreaShiftCutoffs });
  const {
    adminLogs,
    addAdminLog,
    restoreAdminLogs,
    clearAdminLogs,
    lastChangeLog,
    lastUploadLog,
  } = useAdminLogsState();
  const [ptoDatabaseMessage, setPtoDatabaseMessage] = useState(databaseConfigured ? "База данных подключается..." : "База данных не настроена.");
  const { saveStatus, showSaveStatus, hideSaveStatus } = useSaveStatus();
  const {
    clientSnapshots,
    databasePanelMessage,
    databasePanelLoading,
    saveClientSnapshotToDatabase,
    requestClientSnapshotSave,
    refreshClientSnapshots,
    createClientSnapshotNow,
    restoreClientSnapshot,
  } = useClientSnapshotsPanel({ showSaveStatus });
  const [ptoDatabaseReady, setPtoDatabaseReady] = useState(!databaseConfigured);
  const [ptoSaveRevision, setPtoSaveRevision] = useState(0);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);
  const [areaFilter, setAreaFilter] = useState("Все участки");
  const [search, setSearch] = useState("");
  const {
    selectTopTab,
    selectPtoTab,
    selectPtoPlanYear,
    selectPtoArea,
  } = useNavigationSelectionHandlers({
    setTopTab,
    setPtoTab,
    setPtoPlanYear,
    setPtoAreaFilter,
  });
  const ptoDatabaseState = useMemo(() => createPtoDatabaseState({
    manualYears: ptoManualYears,
    planRows: ptoPlanRows,
    operRows: ptoOperRows,
    surveyRows: ptoSurveyRows,
    bucketValues: ptoBucketValues,
    bucketRows: ptoBucketManualRows,
    uiState: {
      ptoTab,
      ptoPlanYear,
      ptoAreaFilter,
      expandedPtoMonths,
      reportColumnWidths,
      reportReasons,
      ptoColumnWidths,
      ptoRowHeights,
      ptoHeaderLabels,
    },
  }), [expandedPtoMonths, ptoAreaFilter, ptoBucketManualRows, ptoBucketValues, ptoColumnWidths, ptoHeaderLabels, ptoManualYears, ptoOperRows, ptoPlanRows, ptoPlanYear, ptoRowHeights, ptoSurveyRows, ptoTab, reportColumnWidths, reportReasons]);
  const ptoDatabaseStateRef = useRef(ptoDatabaseState);
  const {
    ptoDatabaseSaveSnapshotRef,
    savePtoDatabaseChanges,
    requestPtoDatabaseSave,
  } = usePtoDatabaseSave({
    adminDataLoaded,
    ptoSaveRevision,
    ptoDatabaseStateRef,
    ptoDatabaseLoadedRef,
    setPtoDatabaseMessage,
    setPtoSaveRevision,
    showSaveStatus,
  });
  const {
    pushVehicleUndoSnapshot,
    resetUndoHistoryForExternalRestore,
  } = useAppUndoHistory({
    adminDataLoaded,
    topTab,
    adminSection,
    databaseConfigured,
    ptoDatabaseLoadedRef,
    vehicleRows,
    vehicleRowsRef,
    setPtoSaveRevision,
    addAdminLog,
    reportCustomers,
    reportAreaOrder,
    reportWorkOrder,
    reportHeaderLabels,
    reportColumnWidths,
    reportReasons,
    areaShiftCutoffs,
    customTabs,
    topTabs,
    subTabs,
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoSurveyRows,
    ptoOperRows,
    ptoColumnWidths,
    ptoRowHeights,
    ptoHeaderLabels,
    ptoBucketValues,
    ptoBucketManualRows,
    orgMembers,
    dependencyNodes,
    dependencyLinks,
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
    setPtoManualYears,
    setExpandedPtoMonths,
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
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoFormulaDraft,
    setEditingPtoHeaderKey,
    setPtoHeaderDraft,
    setEditingReportHeaderKey,
    setReportHeaderDraft,
    setOpenVehicleFilter,
  });

  useEffect(() => {
    ptoDatabaseStateRef.current = ptoDatabaseState;
  }, [ptoDatabaseState]);

  useEffect(() => {
    if (!openVehicleFilter) return undefined;

    const closeVehicleFilter = () => setOpenVehicleFilter(null);
    window.addEventListener("click", closeVehicleFilter);

    return () => window.removeEventListener("click", closeVehicleFilter);
  }, [openVehicleFilter]);

  useEffect(() => {
    if (topTab === "admin" && adminSection === "database") {
      void refreshClientSnapshots();
    }
  }, [adminSection, refreshClientSnapshots, topTab]);

  useEffect(() => {
    if (!pendingVehicleFocus) return undefined;

    const fieldKey = vehicleInlineFieldDomKey(pendingVehicleFocus.id, pendingVehicleFocus.field);
    setActiveVehicleCell(fieldKey);
    setEditingVehicleCell(pendingVehicleFocus.edit ? fieldKey : null);
    vehicleSelectionAnchorRef.current = { id: pendingVehicleFocus.id, field: pendingVehicleFocus.field };
    setVehicleSelectionAnchorCell({ id: pendingVehicleFocus.id, field: pendingVehicleFocus.field });
    setSelectedVehicleCellKeys([fieldKey]);

    const timeoutId = window.setTimeout(() => {
      if (pendingVehicleFocus.edit) {
        const input = document.querySelector<HTMLInputElement>(`[data-admin-vehicle-input="${fieldKey}"]`);
        input?.focus();

        if (pendingVehicleFocus.selectContents !== false) {
          try {
            input?.select();
          } catch {
            // Number inputs do not support text selection APIs in some browsers.
          }
        } else {
          const cursorPosition = String(input?.value ?? "").length;
          try {
            input?.setSelectionRange(cursorPosition, cursorPosition);
          } catch {
            // Number inputs do not support text selection APIs in some browsers.
          }
        }
      } else {
        document.querySelector<HTMLElement>(`[data-admin-vehicle-cell="${fieldKey}"]`)?.focus();
      }

      setPendingVehicleFocus(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pendingVehicleFocus]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      const readStoredValue = (key: string) => {
        const storedValue = window.localStorage.getItem(key);
        if (!storedValue) return null;

        try {
          return JSON.parse(storedValue) as unknown;
        } catch {
          window.localStorage.removeItem(key);
          return null;
        }
      };

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
  }, [restoreAdminLogs, saveClientSnapshotToDatabase, setCustomTabs, setDependencyLinkForm, setDependencyLinks, setDependencyNodes, setOrgMembers, setSubTabs, setTopTabs]);

  useEffect(() => {
    if (!adminDataLoaded) return;

    let cancelled = false;

    async function loadPtoDatabase() {
      if (!databaseConfigured) {
        setPtoDatabaseReady(true);
        setPtoDatabaseMessage(ptoDatabaseMessages.notConfigured);
        return;
      }

      ptoDatabaseLoadedRef.current = false;
      setPtoDatabaseReady(false);
      setPtoDatabaseMessage(ptoDatabaseMessages.loading);

      try {
        const { loadPtoStateFromDatabase } = await import("@/lib/data/pto");
        const databaseState = await loadPtoStateFromDatabase();
        if (cancelled) return;

        validatePtoDatabaseLoadState(databaseState);

        const resolution = resolvePtoDatabaseLoadResolution({
          databaseState,
          currentState: ptoDatabaseStateRef.current,
          hasStoredPtoState: hasStoredPtoStateRef.current,
          localUpdatedAt: window.localStorage.getItem(adminStorageKeys.ptoLocalUpdatedAt),
          shouldRestoreClientSnapshot: window.sessionStorage.getItem(clientSnapshotRestoreFlagKey) === "1",
        });

        if (resolution.kind === "empty-save-local" || resolution.kind === "empty-ready") {
          ptoDatabaseLoadedRef.current = true;
          ptoDatabaseSaveSnapshotRef.current = "";
          setPtoDatabaseReady(true);
          if (resolution.kind === "empty-save-local") {
            setPtoSaveRevision((revision) => revision + 1);
          }
          setPtoDatabaseMessage(resolution.message);
          return;
        }

        if (resolution.kind === "restore-local" || resolution.kind === "keep-local") {
          if (resolution.kind === "restore-local") {
            window.sessionStorage.removeItem(clientSnapshotRestoreFlagKey);
          }
          savePtoLocalRecoveryBackup(resolution.backupReason, databaseState?.updatedAt);
          ptoDatabaseLoadedRef.current = true;
          ptoDatabaseSaveSnapshotRef.current = "";
          setPtoDatabaseReady(true);
          setPtoSaveRevision((revision) => revision + 1);
          setPtoDatabaseMessage(resolution.message);
          return;
        }

        if (!databaseState) return;

        if (resolution.backupReason) {
          savePtoLocalRecoveryBackup(resolution.backupReason, databaseState.updatedAt);
        }

        const loadedState = normalizeLoadedPtoDatabaseState(databaseState, ptoDatabaseStateRef.current);

        ptoDatabaseLoadedRef.current = true;
        resetUndoHistoryForExternalRestore();
        ptoDatabaseSaveSnapshotRef.current = serializePtoDatabaseState(loadedState.snapshotState);
        setPtoManualYears(loadedState.manualYears);
        setPtoPlanRows(loadedState.planRows);
        setPtoOperRows(loadedState.operRows);
        setPtoSurveyRows(loadedState.surveyRows);
        setPtoBucketValues(loadedState.bucketValues);
        setPtoBucketManualRows(loadedState.bucketRows);
        if (loadedState.uiState.ptoTab) setPtoTab(loadedState.uiState.ptoTab);
        if (loadedState.uiState.ptoPlanYear) setPtoPlanYear(loadedState.uiState.ptoPlanYear);
        if (loadedState.uiState.ptoAreaFilter) setPtoAreaFilter(loadedState.uiState.ptoAreaFilter);
        setExpandedPtoMonths(loadedState.uiState.expandedPtoMonths);
        setReportColumnWidths(loadedState.uiState.reportColumnWidths);
        setReportReasons(loadedState.uiState.reportReasons);
        setPtoColumnWidths(loadedState.uiState.ptoColumnWidths);
        setPtoRowHeights(loadedState.uiState.ptoRowHeights);
        setPtoHeaderLabels(loadedState.uiState.ptoHeaderLabels);
        setPtoDatabaseReady(true);
        setPtoDatabaseMessage(ptoDatabaseMessages.loaded);
      } catch (error) {
        if (!cancelled) {
          ptoDatabaseLoadedRef.current = false;
          setPtoDatabaseReady(true);
          const message = ptoDatabaseMessages.loadError(errorToMessage(error));
          setPtoDatabaseMessage(message);
          showSaveStatus("error", message);
        }
      }
    }

    void loadPtoDatabase();

    return () => {
      cancelled = true;
    };
  }, [adminDataLoaded, ptoDatabaseSaveSnapshotRef, resetUndoHistoryForExternalRestore, showSaveStatus]);

  useAppLocalPersistence({
    adminDataLoaded,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    requestClientSnapshotSave,
    showSaveStatus,
    reportCustomers,
    reportAreaOrder,
    reportWorkOrder,
    reportHeaderLabels,
    reportColumnWidths,
    reportReasons,
    areaShiftCutoffs,
    customTabs,
    topTabs,
    subTabs,
    dispatchSummaryRows,
    orgMembers,
    dependencyNodes,
    dependencyLinks,
    adminLogs,
  });

  useVehicleRowsPersistence({
    adminDataLoaded,
    vehicleRows,
    vehicleRowsRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    requestClientSnapshotSave,
    showSaveStatus,
  });

  const { savePtoLocalState } = usePtoLocalPersistence({
    adminDataLoaded,
    ptoDatabaseStateRef,
    ptoDatabaseLoadedRef,
    hasStoredPtoStateRef,
    requestClientSnapshotSave,
    ptoManualYears,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoColumnWidths,
    ptoRowHeights,
    ptoHeaderLabels,
    ptoBucketValues,
    ptoBucketManualRows,
  });

  const {
    commitReportDayReason,
    cancelReportDayReasonDraft,
    updateReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
    updateReportYearReasonDraft,
  } = useReportReasonDrafts({
    reportDate,
    setReportReasons,
    requestSave: requestPtoDatabaseSave,
  });

  const {
    headerLabel: ptoHeaderLabel,
    startHeaderEdit: startPtoHeaderEdit,
    cancelHeaderEdit: cancelPtoHeaderEdit,
    commitHeaderEdit: commitPtoHeaderEdit,
  } = useEditableHeaderLabels({
    labels: ptoHeaderLabels,
    draft: ptoHeaderDraft,
    setLabels: setPtoHeaderLabels,
    setEditingKey: setEditingPtoHeaderKey,
    setDraft: setPtoHeaderDraft,
    onCommit: (_key, fallback) => {
      requestPtoDatabaseSave();
      addAdminLog({
        action: "Редактирование",
        section: "ПТО",
        details: `Изменен заголовок таблицы: ${fallback}.`,
      });
    },
  });

  const {
    headerLabel: reportHeaderLabel,
    startHeaderEdit: startReportHeaderEdit,
    cancelHeaderEdit: cancelReportHeaderEdit,
    commitHeaderEdit: commitReportHeaderEdit,
  } = useEditableHeaderLabels({
    labels: reportHeaderLabels,
    draft: reportHeaderDraft,
    setLabels: setReportHeaderLabels,
    setEditingKey: setEditingReportHeaderKey,
    setDraft: setReportHeaderDraft,
    onCommit: (_key, fallback) => {
      addAdminLog({
        action: "Редактирование",
        section: "Отчетность",
        details: `Изменен заголовок таблицы: ${fallback}.`,
      });
    },
  });
  const {
    renderReportHeaderText,
    printReport,
  } = useReportHeaderActions({
    reportHeaderLabel,
    editingReportHeaderKey,
    reportHeaderDraft,
    setReportHeaderDraft,
    commitReportHeaderEdit,
    cancelReportHeaderEdit,
    startReportHeaderEdit,
  });

  const {
    startPtoColumnResize,
    startReportColumnResize,
    startPtoRowResize,
  } = useTableResizeHandlers({
    ptoRowHeights,
    setPtoColumnWidths,
    setPtoRowHeights,
    setReportColumnWidths,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  useGlobalCellSelectionEffects({
    ptoSelectionDraggingRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectionAnchorCell,
    setPtoSelectedCellKeys,
  });

  usePtoPendingFieldFocus({
    pendingFieldFocus: ptoPendingFieldFocus,
    setPendingFieldFocus: setPtoPendingFieldFocus,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
  });

  const deferredPtoPlanRows = useDeferredValue(ptoPlanRows);
  const deferredPtoSurveyRows = useDeferredValue(ptoSurveyRows);
  const deferredPtoOperRows = useDeferredValue(ptoOperRows);
  const deferredVehicleRows = useDeferredValue(vehicleRows);
  const renderedTopTab = useDeferredValue(topTab);
  const needsReportRows = renderedTopTab === "reports"
    || (renderedTopTab === "admin" && adminSection === "reports");
  const needsDerivedReportRows = renderedTopTab === "reports";
  const needsAdminReportRows = renderedTopTab === "admin" && adminSection === "reports";
  const needsReportIndexes = needsDerivedReportRows || needsAdminReportRows;
  const needsAutoReportRows = needsDerivedReportRows || needsAdminReportRows;

  const {
    reportBaseRows,
    derivedReportRows,
  } = useReportRowsModel({
    needsReportRows,
    needsReportIndexes,
    needsAutoReportRows,
    deferredPtoPlanRows,
    deferredPtoSurveyRows,
    deferredPtoOperRows,
    reportDate,
    reportReasons,
  });

  const {
    activeAdminReportCustomer,
    adminReportBaseRows,
    derivedReportRowsByKey,
    reportAutoRowKeysForCustomer,
    activeAdminReportBaseRows,
    activeAdminReportVisibleRowKeys,
    activeAdminReportOrderRows,
    activeAdminReportAreaOptions,
    activeAdminReportSummaryAreaOptions,
    activeAdminReportRowsByKey,
    editingReportFactSourceRow,
    editingReportFactSourceOptions,
    adminReportWorkOrderGroups,
    activeAdminReportSelectedCount,
    activeAdminReportRowLabelEntries,
    activeAdminReportUsesSummaryRows,
    visibleAdminReportCustomerSettingsTab,
  } = useAdminReportSettingsViewModel({
    needsAdminReportRows,
    reportCustomers,
    adminReportCustomerId,
    adminReportCustomerSettingsTab,
    reportBaseRows,
    derivedReportRows,
    reportAreaOrder,
    reportWorkOrder,
    editingReportFactSourceRowKey,
  });

  const {
    activeReportCustomer,
    reportAreaTabs,
    filteredReports,
    filteredReportAreaGroups,
  } = useCustomerReportViewModel({
    needsDerivedReportRows,
    reportCustomers,
    reportCustomerId,
    derivedReportRows,
    reportArea,
  });

  const areaShiftScheduleAreas = useAreaShiftScheduleAreas({
    areaShiftCutoffs,
    reportBaseRows,
    ptoPlanRows: deferredPtoPlanRows,
    ptoOperRows: deferredPtoOperRows,
    ptoSurveyRows: deferredPtoSurveyRows,
    vehicleRows: deferredVehicleRows,
    reportAreaOrder,
  });

  const {
    visibleReportColumnKeys,
    reportTableColumnWidths,
    reportColumnWidthByKey,
    reportCompletionCards,
  } = useReportColumnLayout({
    filteredReports,
    needsDerivedReportRows,
    reportArea,
    reportDate,
    reportHeaderLabels,
    reportColumnWidths,
  });

  useReportSelectionGuards({
    reportCustomers,
    reportCustomerId,
    setReportCustomerId,
    reportArea,
    reportAreaTabs,
    setReportArea,
  });

  const {
    isPtoDateTab,
    isPtoBucketsSection,
    allPtoDateRows,
    ptoYearTabs,
    ptoYearMonths,
    ptoMonthGroups,
    ptoAreaTabs,
    ptoDateOptionMaps,
  } = usePtoDateViewModel({
    renderedTopTab,
    ptoTab,
    ptoPlanYear,
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    deferredPtoPlanRows,
    deferredPtoOperRows,
    deferredPtoSurveyRows,
    ptoBucketManualRows,
  });

  const {
    ptoBucketRows,
    ptoBucketColumns,
  } = usePtoBucketsViewModel({
    active: isPtoBucketsSection,
    allPtoDateRows,
    manualRows: ptoBucketManualRows,
    areaFilter: ptoAreaFilter,
    vehicleRows: deferredVehicleRows,
  });

  const {
    vehicleAutocompleteOptions,
    activeVehicleFilterOptions,
    filteredVehicleRows,
    visibleVehicleRows,
    hiddenVehicleRowsCount,
    activeVehicleFilterCount,
  } = useAdminVehicleRowsViewModel({
    active: renderedTopTab === "admin" && adminSection === "vehicles",
    adminVehiclesEditing,
    showAllVehicleRows,
    vehiclePreviewRowLimit,
    vehicleRows,
    deferredVehicleRows,
    vehicleFilters,
    openVehicleFilter,
    tableScrollRef: adminVehicleTableScrollRef,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setVehiclePreviewRowLimit,
  });
  const {
    openVehicleFilterMenu,
    toggleVehicleFilterDraftValue,
    selectAllVehicleFilterDraftValues,
    deselectAllVehicleFilterDraftValues,
    applyVehicleFilter,
    clearAllVehicleFilters,
  } = useVehicleFilterMenu({
    openVehicleFilter,
    vehicleFilters,
    vehicleFilterDrafts,
    vehicleRows,
    activeVehicleFilterOptions,
    setOpenVehicleFilter,
    setVehicleFilters,
    setVehicleFilterDrafts,
  });

  const {
    filteredDispatch,
    currentDispatchShift,
    isDailyDispatchShift,
    dispatchAreaOptions,
    dispatchVehicleOptions,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchExcavatorOptions,
    currentDispatchSummaryRows,
    filteredDispatchSummaryRows,
    dispatchSummaryTotals,
    dispatchAiSuggestion,
  } = useDispatchSummaryViewModel({
    active: renderedTopTab === "dispatch",
    areaFilter,
    search,
    dispatchTab,
    reportDate,
    vehicleRows,
    dispatchSummaryRows,
    reportBaseRows,
  });
  const {
    addSelectedDispatchVehicle,
    addFilteredVehiclesToDispatchSummary,
    updateDispatchSummaryText,
    updateDispatchSummaryNumber,
    updateDispatchSummaryVehicle,
    deleteDispatchSummaryRow,
  } = useDispatchSummaryEditor({
    isDailyDispatchShift,
    reportDate,
    currentDispatchShift,
    dispatchSummaryRows,
    currentDispatchSummaryRows,
    filteredDispatch,
    dispatchVehicleOptions,
    dispatchVehicleToAddId,
    setDispatchSummaryRows,
    setDispatchVehicleToAddId,
    addAdminLog,
  });

  const filteredFleet = useFleetRows({
    active: renderedTopTab === "fleet",
    fleetTab,
    vehicleRows,
  });

  const activeCustomTab = customTabs.find((tab) => tab.visible !== false && customTabKey(tab.id) === renderedTopTab);
  const activeDispatchSubtab = subTabs.dispatch.find((tab) => tab.value === dispatchTab);
  const activePtoSubtab = subTabs.pto.find((tab) => tab.value === ptoTab);
  const headerHasSubtabs = topTab === "reports" || topTab === "dispatch" || topTab === "pto" || topTab === "admin";
  const {
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    headerSubtabsOffset,
  } = useHeaderSubtabsOffset({
    headerHasSubtabs,
    topTab,
    adminSection,
    dispatchTab,
    ptoTab,
    reportCustomerId,
    reportCustomers,
    dispatchSubTabs: subTabs.dispatch,
    ptoSubTabs: subTabs.pto,
  });
  const expandedPtoMonthsKey = Object.entries(expandedPtoMonths)
    .filter(([, expanded]) => expanded)
    .map(([month]) => month)
    .sort()
    .join("|");
  const {
    viewport: ptoDateViewport,
    scrollRef: ptoDateTableScrollRef,
    updateViewportFromElement: updatePtoDateViewportFromElement,
    handleScroll: handlePtoDateTableScroll,
  } = usePtoDateViewport({
    active: renderedTopTab === "pto" && isPtoDateTab && ptoDateEditing,
    resetKey: `${ptoTab}:${ptoPlanYear}:${ptoAreaFilter}`,
    measureKey: `${ptoTab}:${ptoPlanYear}:${ptoAreaFilter}:${expandedPtoMonthsKey}`,
  });

  usePtoDateEditingReset({
    active: renderedTopTab === "pto" && isPtoDateTab,
    setPtoDateEditing,
    setDraggedPtoRowId,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoInlineEditCell,
    setPtoSelectedCellKeys,
  });

  const {
    updateReportCustomer,
    addReportCustomer,
    deleteReportCustomer,
    moveReportAreaOrder,
    moveReportWorkOrder,
    toggleReportCustomerRow,
  } = useAdminReportCustomerEditor({
    reportCustomers,
    activeCustomer: activeAdminReportCustomer,
    areaOptions: activeAdminReportAreaOptions,
    orderRows: activeAdminReportOrderRows,
    setReportCustomers,
    setAdminReportCustomerId,
    setReportCustomerId,
    reportAutoRowKeysForCustomer,
    addAdminLog,
  });

  const {
    updateReportCustomerRowLabel,
    addReportCustomerRowLabel,
    changeReportCustomerRowLabelSource,
    removeReportCustomerRowLabel,
    startReportRowLabelEdit,
    finishReportRowLabelEdit,
  } = useAdminReportRowLabelEditor({
    reportCustomers,
    baseRows: adminReportBaseRows,
    rowsByKey: activeAdminReportRowsByKey,
    setReportCustomers,
    setEditingRowLabelKeys: setEditingReportRowLabelKeys,
    reportAutoRowKeysForCustomer,
    addAdminLog,
  });

  const {
    setReportCustomerFactSourceMode,
    toggleReportCustomerFactSourceRowKey,
  } = useAdminReportFactSourceEditor({
    setReportCustomers,
    addAdminLog,
  });

  const {
    reportRowsForSummaryArea,
    addReportSummaryRow,
    startReportSummaryEdit,
    finishReportSummaryEdit,
    updateReportSummaryRow,
    toggleReportSummaryRowKey,
    removeReportSummaryRow,
  } = useAdminReportSummaryRowsEditor({
    reportCustomers,
    baseRows: activeAdminReportBaseRows,
    summaryAreaOptions: activeAdminReportSummaryAreaOptions,
    setReportCustomers,
    setExpandedSummaryIds: setExpandedReportSummaryIds,
    addAdminLog,
  });

  const {
    currentPtoTableLabel,
    currentPtoDateTableKey,
    savePtoDayPatchToDatabase,
    savePtoDayPatchesToDatabase,
  } = usePtoDateTableContext({
    ptoTab,
    ptoSubTabs: subTabs.pto,
    databaseConfigured,
    databaseLoadedRef: ptoDatabaseLoadedRef,
  });

  const {
    addLinkedPtoDateRow,
    removeLinkedPtoDateRow,
    getPtoDropPosition,
    moveLinkedPtoDateRow,
  } = usePtoLinkedRowsEditor({
    ptoTab,
    ptoAreaFilter,
    ptoPlanYear,
    databaseConfigured,
    databaseLoadedRef: ptoDatabaseLoadedRef,
    currentPtoTableLabel,
    currentPtoDateTableKey,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  const {
    addPtoYear,
    deletePtoYear,
  } = usePtoYearEditor({
    ptoYearInput,
    ptoPlanYear,
    ptoYearTabs,
    databaseConfigured,
    databaseLoadedRef: ptoDatabaseLoadedRef,
    setPtoPlanYear,
    setPtoYearInput,
    setPtoYearDialogOpen,
    setPtoManualYears,
    setExpandedPtoMonths,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  const {
    updatePtoDateRow,
    clearPtoCarryoverOverride,
    updatePtoDateDay,
    updatePtoMonthTotal,
  } = usePtoDateRowValueEditor({
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoPlanYear,
    currentPtoTableLabel,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    saveDayPatch: savePtoDayPatchToDatabase,
    saveDayPatches: savePtoDayPatchesToDatabase,
    addAdminLog,
  });

  const {
    getPtoRowTextDraft,
    beginPtoRowTextDraft,
    updatePtoRowTextDraft,
    commitPtoRowTextDraft,
    cancelPtoRowTextDraft,
  } = usePtoRowTextDrafts({
    drafts: ptoRowFieldDrafts,
    setDrafts: setPtoRowFieldDrafts,
    commitValue: (setRows, row, field, value) => updatePtoDateRow(setRows, row.id, field, value),
    requestSave: requestPtoDatabaseSave,
  });

  const {
    addVehicleRow,
    updateVehicleRow,
    toggleVehicleVisibility,
    deleteVehicle,
  } = useVehicleRowsEditor({
    vehicleRows,
    vehicleRowsRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    setVehicleRows,
    setPendingVehicleFocus,
    pushVehicleUndoSnapshot,
    clearAllVehicleFilters,
    showSaveStatus,
    addAdminLog,
  });

  const {
    commitVehicleInlineCellEdit,
    vehicleCellInputProps,
  } = useVehicleInlineGridEditor({
    vehicleRows,
    visibleVehicleRows,
    activeVehicleCell,
    selectedVehicleCellKeys,
    editingVehicleCell,
    vehicleCellDraft,
    vehicleCellInitialDraft,
    vehicleSelectionAnchorCell,
    vehicleCellSkipBlurCommitRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    setVehicleRows,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setPendingVehicleFocus,
    updateVehicleRow,
    pushVehicleUndoSnapshot,
    addAdminLog,
  });
  const {
    startAdminVehiclesEditing,
    finishAdminVehiclesEditing,
  } = useAdminVehicleEditMode({
    editingVehicleCell,
    commitVehicleInlineCellEdit,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    vehicleRowsRef,
  });

  const {
    openVehicleImportFilePicker,
    importVehiclesFromExcel,
    exportVehiclesToExcel,
  } = useVehicleExcelTransfer({
    vehicleRows,
    vehicleImportInputRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    setVehicleRows,
    setVehicleFilters,
    setVehicleFilterDrafts,
    setOpenVehicleFilter,
    pushVehicleUndoSnapshot,
    showSaveStatus,
    addAdminLog,
  });

  const {
    openPtoDateImportFilePicker,
    currentPtoDateExcelMeta,
    exportPtoDateTableToExcel,
    importPtoDateTableFromExcel,
  } = usePtoDateExcelTransfer({
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    importInputRef: ptoPlanImportInputRef,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    setPtoManualYears,
    setExpandedPtoMonths,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  const {
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  } = usePtoBucketsEditor({
    ptoAreaFilter,
    ptoBucketRows,
    ptoBucketColumns,
    ptoBucketManualRows,
    setPtoBucketValues,
    setPtoBucketManualRows,
    databaseConfigured,
    ptoDatabaseLoadedRef,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });
  function renderPtoDateTable(
    rows: PtoPlanRow[],
    setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>,
    options: { showLocation?: boolean; editableMonthTotal?: boolean } = {},
  ) {
    return (
      <PtoDateTableContainer
        rows={rows}
        setRows={setRows}
        options={options}
        ptoTab={ptoTab}
        ptoAreaFilter={ptoAreaFilter}
        ptoPlanYear={ptoPlanYear}
        reportDate={reportDate}
        ptoYearMonths={ptoYearMonths}
        ptoMonthGroups={ptoMonthGroups}
        ptoAreaTabs={ptoAreaTabs}
        ptoYearTabs={ptoYearTabs}
        ptoYearDialogOpen={ptoYearDialogOpen}
        ptoYearInput={ptoYearInput}
        ptoDateEditing={ptoDateEditing}
        ptoColumnWidths={ptoColumnWidths}
        ptoRowHeights={ptoRowHeights}
        ptoDateViewport={ptoDateViewport}
        ptoDateOptionMaps={ptoDateOptionMaps}
        ptoDateTableScrollRef={ptoDateTableScrollRef}
        ptoPlanImportInputRef={ptoPlanImportInputRef}
        draggedPtoRowId={draggedPtoRowId}
        ptoDropTarget={ptoDropTarget}
        hoveredPtoAddRowId={hoveredPtoAddRowId}
        ptoFormulaCell={ptoFormulaCell}
        ptoFormulaDraft={ptoFormulaDraft}
        ptoInlineEditCell={ptoInlineEditCell}
        ptoInlineEditInitialDraft={ptoInlineEditInitialDraft}
        ptoSelectionAnchorCell={ptoSelectionAnchorCell}
        ptoSelectedCellKeys={ptoSelectedCellKeys}
        ptoSelectionDraggingRef={ptoSelectionDraggingRef}
        ptoDraftRowFields={ptoDraftRowFields}
        editingPtoHeaderKey={editingPtoHeaderKey}
        ptoHeaderDraft={ptoHeaderDraft}
        setPtoDateEditing={setPtoDateEditing}
        setDraggedPtoRowId={setDraggedPtoRowId}
        setPtoDropTarget={setPtoDropTarget}
        setPtoFormulaCell={setPtoFormulaCell}
        setPtoFormulaDraft={setPtoFormulaDraft}
        setPtoInlineEditCell={setPtoInlineEditCell}
        setPtoInlineEditInitialDraft={setPtoInlineEditInitialDraft}
        setPtoSelectionAnchorCell={setPtoSelectionAnchorCell}
        setPtoSelectedCellKeys={setPtoSelectedCellKeys}
        setPtoYearInput={setPtoYearInput}
        setPtoYearDialogOpen={setPtoYearDialogOpen}
        setExpandedPtoMonths={setExpandedPtoMonths}
        setHoveredPtoAddRowId={setHoveredPtoAddRowId}
        setPtoDraftRowFields={setPtoDraftRowFields}
        setPtoPendingFieldFocus={setPtoPendingFieldFocus}
        setPtoHeaderDraft={setPtoHeaderDraft}
        savePtoLocalState={savePtoLocalState}
        requestPtoDatabaseSave={requestPtoDatabaseSave}
        savePtoDatabaseChanges={savePtoDatabaseChanges}
        selectPtoArea={selectPtoArea}
        currentPtoDateExcelMeta={currentPtoDateExcelMeta}
        exportPtoDateTableToExcel={exportPtoDateTableToExcel}
        openPtoDateImportFilePicker={openPtoDateImportFilePicker}
        importPtoDateTableFromExcel={importPtoDateTableFromExcel}
        selectPtoPlanYear={selectPtoPlanYear}
        deletePtoYear={deletePtoYear}
        addPtoYear={addPtoYear}
        updatePtoDateViewportFromElement={updatePtoDateViewportFromElement}
        handlePtoDateTableScroll={handlePtoDateTableScroll}
        startPtoColumnResize={startPtoColumnResize}
        startPtoRowResize={startPtoRowResize}
        addLinkedPtoDateRow={addLinkedPtoDateRow}
        removeLinkedPtoDateRow={removeLinkedPtoDateRow}
        getPtoDropPosition={getPtoDropPosition}
        moveLinkedPtoDateRow={moveLinkedPtoDateRow}
        updatePtoDateRow={updatePtoDateRow}
        clearPtoCarryoverOverride={clearPtoCarryoverOverride}
        updatePtoDateDay={updatePtoDateDay}
        updatePtoMonthTotal={updatePtoMonthTotal}
        beginPtoRowTextDraft={beginPtoRowTextDraft}
        getPtoRowTextDraft={getPtoRowTextDraft}
        updatePtoRowTextDraft={updatePtoRowTextDraft}
        commitPtoRowTextDraft={commitPtoRowTextDraft}
        cancelPtoRowTextDraft={cancelPtoRowTextDraft}
        ptoHeaderLabel={ptoHeaderLabel}
        startPtoHeaderEdit={startPtoHeaderEdit}
        commitPtoHeaderEdit={commitPtoHeaderEdit}
        cancelPtoHeaderEdit={cancelPtoHeaderEdit}
      />
    );
  }
  const shouldGatePtoDatabase = databaseConfigured && !ptoDatabaseReady;

  return (
    <div className="app-print-root" style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px", fontFamily: "var(--app-font)", color: "#0f172a", lineHeight: 1.35 }}>
      <style>{`${reportPrintCss}\n@media print { .app-save-status { display: none !important; } }`}</style>
      <SaveStatusIndicator status={saveStatus} onClose={hideSaveStatus} />
      <div className="app-print-shell" style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
        <AppHeader
          topTabs={topTabs}
          customTabs={customTabs}
          topTab={topTab}
          subTabs={subTabs}
          headerHasSubtabs={headerHasSubtabs}
          headerSubtabsOffset={headerSubtabsOffset}
          headerNavRef={headerNavRef}
          activeHeaderTabRef={activeHeaderTabRef}
          headerSubtabsRef={headerSubtabsRef}
          reportCustomers={reportCustomers}
          reportCustomerId={reportCustomerId}
          dispatchTab={dispatchTab}
          ptoTab={ptoTab}
          adminSection={adminSection}
          reportDate={reportDate}
          onSelectTopTab={selectTopTab}
          onDeleteCustomTab={deleteCustomTab}
          onSelectReportCustomer={setReportCustomerId}
          onSelectDispatchTab={setDispatchTab}
          onSelectPtoTab={selectPtoTab}
          onSelectAdminSection={setAdminSection}
          onSelectReportDate={selectReportDate}
        />
        {renderedTopTab === "reports" && (
          shouldGatePtoDatabase ? <PtoDatabaseGate message={ptoDatabaseMessage} /> : (
          <ReportsSection
            reportAreaTabs={reportAreaTabs}
            reportArea={reportArea}
            onSelectReportArea={setReportArea}
            onPrintReport={printReport}
            activeReportCustomerLabel={activeReportCustomer.label}
            reportDate={reportDate}
            reportCompletionCards={reportCompletionCards}
            reportTableColumnWidths={reportTableColumnWidths}
            reportColumnKeys={visibleReportColumnKeys}
            reportColumnWidthByKey={reportColumnWidthByKey}
            reportHeaderLabel={reportHeaderLabel}
            renderReportHeaderText={renderReportHeaderText}
            onStartReportColumnResize={startReportColumnResize}
            filteredReportAreaGroups={filteredReportAreaGroups}
            filteredReportsCount={filteredReports.length}
            reportReasons={reportReasons}
            onCommitReportDayReason={commitReportDayReason}
            onCancelReportDayReasonDraft={cancelReportDayReasonDraft}
            onUpdateReportDayReasonDraft={updateReportDayReasonDraft}
            onCommitReportYearReason={commitReportYearReason}
            onCancelReportYearReasonDraft={cancelReportYearReasonDraft}
            onUpdateReportYearReasonDraft={updateReportYearReasonDraft}
          />
          )
        )}

        {renderedTopTab === "dispatch" && (
          <DispatchSection
            activeDispatchSubtabLabel={activeDispatchSubtab?.label ?? "Диспетчерская сводка"}
            dispatchTab={dispatchTab}
            activeDispatchSubtabContent={activeDispatchSubtab?.content || ""}
            reportDate={reportDate}
            isDailyDispatchShift={isDailyDispatchShift}
            currentDispatchShift={currentDispatchShift}
            dispatchSummaryTotals={dispatchSummaryTotals}
            search={search}
            onSearchChange={setSearch}
            areaFilter={areaFilter}
            onAreaFilterChange={setAreaFilter}
            dispatchAreaOptions={dispatchAreaOptions}
            dispatchVehicleToAddId={dispatchVehicleToAddId}
            onDispatchVehicleToAddIdChange={setDispatchVehicleToAddId}
            dispatchVehicleOptions={dispatchVehicleOptions}
            onAddSelectedDispatchVehicle={addSelectedDispatchVehicle}
            onAddFilteredVehiclesToDispatchSummary={addFilteredVehiclesToDispatchSummary}
            dispatchAiSuggestion={dispatchAiSuggestion}
            filteredDispatchSummaryRows={filteredDispatchSummaryRows}
            onUpdateDispatchSummaryVehicle={updateDispatchSummaryVehicle}
            onUpdateDispatchSummaryText={updateDispatchSummaryText}
            onUpdateDispatchSummaryNumber={updateDispatchSummaryNumber}
            onDeleteDispatchSummaryRow={deleteDispatchSummaryRow}
            dispatchLocationOptions={dispatchLocationOptions}
            dispatchWorkTypeOptions={dispatchWorkTypeOptions}
            dispatchExcavatorOptions={dispatchExcavatorOptions}
          />
        )}

        {renderedTopTab === "fleet" && (
          <FleetSection
            fleetTab={fleetTab}
            subTabs={subTabs.fleet}
            rows={filteredFleet}
            onSelectTab={setFleetTab}
          />
        )}
        {renderedTopTab === "contractors" && (
          <ContractorsSection
            contractorTab={contractorTab}
            subTabs={subTabs.contractors}
            onSelectTab={setContractorTab}
          />
        )}
        {renderedTopTab === "fuel" && (
          <FuelSection
            fuelTab={fuelTab}
            subTabs={subTabs.fuel}
            onSelectTab={setFuelTab}
          />
        )}
        {renderedTopTab === "pto" && (
          shouldGatePtoDatabase ? <PtoDatabaseGate message={ptoDatabaseMessage} /> : (
          <PtoSection
            ptoTab={ptoTab}
            activePtoSubtabLabel={activePtoSubtab?.label ?? ptoTab}
            activePtoSubtabContent={activePtoSubtab?.content || ""}
            isPtoDateTab={isPtoDateTab}
            ptoAreaTabs={ptoAreaTabs}
            ptoAreaFilter={ptoAreaFilter}
            onSelectArea={selectPtoArea}
            ptoBucketRows={ptoBucketRows}
            ptoBucketColumns={ptoBucketColumns}
            ptoBucketValues={ptoBucketValues}
            onCommitBucketValue={commitPtoBucketValue}
            onClearBucketCells={clearPtoBucketCells}
            onAddBucketManualRow={addPtoBucketManualRow}
            onDeleteBucketManualRow={deletePtoBucketManualRow}
            renderPlanTable={() => renderPtoDateTable(
              ptoPlanRows,
              setPtoPlanRows,
              { showLocation: false, editableMonthTotal: true },
            )}
            renderOperTable={() => renderPtoDateTable(
              ptoOperRows,
              setPtoOperRows,
              { showLocation: false, editableMonthTotal: false },
            )}
            renderSurveyTable={() => renderPtoDateTable(
              ptoSurveyRows,
              setPtoSurveyRows,
              { showLocation: false, editableMonthTotal: false },
            )}
          />
          )
        )}

        {renderedTopTab === "tb" && (
          <SafetySection
            tbTab={tbTab}
            subTabs={subTabs.tb}
            onSelectTab={setTbTab}
          />
        )}
        {renderedTopTab === "user" && (
          <UserProfileSection userCard={defaultUserCard} />
        )}
        {renderedTopTab === "admin" && (
          <SectionCard title="">
            {adminSection === "navigation" && (
              <AdminNavigationSection
                topTabs={topTabs}
                customTabs={customTabs}
                onAddCustomTab={addCustomTab}
                onUpdateTopTabLabel={updateTopTabLabel}
                onUpdateCustomTabTitle={updateCustomTabTitle}
                onDeleteTopTab={deleteTopTab}
                onShowTopTab={showTopTab}
                onDeleteCustomTab={deleteCustomTab}
                onShowCustomTab={showCustomTab}
              />
            )}

            {adminSection === "structure" && (
              <AdminStructureSection
                structureSection={structureSection}
                onSelectStructureSection={setStructureSection}
                dependencyNodes={dependencyNodes}
                dependencyLinks={dependencyLinks}
                dependencyNodeForm={dependencyNodeForm}
                dependencyLinkForm={dependencyLinkForm}
                editingDependencyNodeId={editingDependencyNodeId}
                editingDependencyLinkId={editingDependencyLinkId}
                onEditDependencyNode={setEditingDependencyNodeId}
                onEditDependencyLink={setEditingDependencyLinkId}
                onUpdateDependencyNode={updateDependencyNode}
                onUpdateDependencyNodeForm={updateDependencyNodeForm}
                onAddDependencyNode={addDependencyNode}
                onDeleteDependencyNode={deleteDependencyNode}
                onUpdateDependencyLink={updateDependencyLink}
                onUpdateDependencyLinkForm={updateDependencyLinkForm}
                onAddDependencyLink={addDependencyLink}
                onDeleteDependencyLink={deleteDependencyLink}
                orgMembers={orgMembers}
                orgMemberForm={orgMemberForm}
                editingOrgMemberId={editingOrgMemberId}
                onEditOrgMember={setEditingOrgMemberId}
                onUpdateOrgMember={updateOrgMember}
                onUpdateOrgMemberForm={updateOrgMemberForm}
                onAddOrgMember={addOrgMember}
                onDeleteOrgMember={deleteOrgMember}
                areaShiftScheduleAreas={areaShiftScheduleAreas}
                areaShiftCutoffs={areaShiftCutoffs}
                onUpdateAreaShiftCutoff={updateAreaShiftCutoff}
              />
            )}

            {adminSection === "ai" && (
              <AdminAiSection />
            )}

            {adminSection === "vehicles" && (
              <AdminVehiclesSection
                activeVehicleFilterCount={activeVehicleFilterCount}
                filteredVehicleRowsCount={filteredVehicleRows.length}
                totalVehicleRowsCount={vehicleRows.length}
                adminVehiclesEditing={adminVehiclesEditing}
                visibleVehicleRows={visibleVehicleRows}
                hiddenVehicleRowsCount={hiddenVehicleRowsCount}
                vehicleAutocompleteOptions={vehicleAutocompleteOptions}
                vehicleFilterColumns={vehicleFilterColumns}
                openVehicleFilter={openVehicleFilter}
                activeVehicleFilterOptions={activeVehicleFilterOptions}
                vehicleFilters={vehicleFilters}
                vehicleFilterDrafts={vehicleFilterDrafts}
                vehicleFilterSearch={vehicleFilterSearch}
                adminVehicleTableScrollRef={adminVehicleTableScrollRef}
                vehicleImportInputRef={vehicleImportInputRef}
                onClearAllVehicleFilters={clearAllVehicleFilters}
                onStartEditing={startAdminVehiclesEditing}
                onFinishEditing={finishAdminVehiclesEditing}
                onAddVehicleRow={addVehicleRow}
                onOpenVehicleImportFilePicker={openVehicleImportFilePicker}
                onExportVehiclesToExcel={exportVehiclesToExcel}
                onImportVehiclesFromExcel={importVehiclesFromExcel}
                onOpenVehicleFilterMenu={openVehicleFilterMenu}
                onVehicleFilterSearchChange={(key, value) => setVehicleFilterSearch((current) => ({ ...current, [key]: value }))}
                onToggleVehicleFilterDraftValue={toggleVehicleFilterDraftValue}
                onSelectAllVehicleFilterDraftValues={selectAllVehicleFilterDraftValues}
                onDeselectAllVehicleFilterDraftValues={deselectAllVehicleFilterDraftValues}
                onApplyVehicleFilter={applyVehicleFilter}
                onCloseVehicleFilterMenu={() => setOpenVehicleFilter(null)}
                onToggleVehicleVisibility={toggleVehicleVisibility}
                vehicleCellInputProps={vehicleCellInputProps}
                onVehicleCellChange={updateVehicleRow}
                onDeleteVehicle={deleteVehicle}
                onShowAllVehicleRows={() => setShowAllVehicleRows(true)}
              />
            )}

            {adminSection === "database" && (
              <AdminDatabaseSection
                databaseConfigured={databaseConfigured}
                databaseProviderLabel={dataProviderLabel}
                ptoMemoryTotal={countPtoStateData({ planRows: ptoPlanRows, operRows: ptoOperRows, surveyRows: ptoSurveyRows, bucketRows: ptoBucketManualRows, bucketValues: ptoBucketValues }).total}
                vehicleCount={vehicleRows.length}
                snapshots={clientSnapshots}
                message={databasePanelMessage}
                loading={databasePanelLoading}
                getSnapshotStats={clientSnapshotStats}
                onCreateSnapshot={createClientSnapshotNow}
                onRefreshSnapshots={refreshClientSnapshots}
                onRestoreSnapshot={restoreClientSnapshot}
              />
            )}

            {adminSection === "logs" && (
              <AdminLogsSection
                logs={adminLogs}
                lastChangeLog={lastChangeLog}
                lastUploadLog={lastUploadLog}
                onClearLogs={clearAdminLogs}
              />
            )}

            {adminSection === "reports" && (
              <AdminReportSettingsSection
                customers={reportCustomers}
                activeCustomer={activeAdminReportCustomer}
                settingsTab={visibleAdminReportCustomerSettingsTab}
                selectedCount={activeAdminReportSelectedCount}
                usesSummaryRows={activeAdminReportUsesSummaryRows}
                areaOptions={activeAdminReportAreaOptions}
                summaryAreaOptions={activeAdminReportSummaryAreaOptions}
                workOrderGroups={adminReportWorkOrderGroups}
                baseRows={activeAdminReportBaseRows}
                rowsByKey={activeAdminReportRowsByKey}
                visibleRowKeys={activeAdminReportVisibleRowKeys}
                derivedRowsByKey={derivedReportRowsByKey}
                editingFactSourceRow={editingReportFactSourceRow}
                editingFactSourceOptions={editingReportFactSourceOptions}
                rowLabelEntries={activeAdminReportRowLabelEntries}
                editingRowLabelKeys={editingReportRowLabelKeys}
                expandedSummaryIds={expandedReportSummaryIds}
                rowsForArea={reportRowsForSummaryArea}
                onSelectCustomer={setAdminReportCustomerId}
                onAddCustomer={addReportCustomer}
                onDeleteCustomer={deleteReportCustomer}
                onUpdateCustomer={updateReportCustomer}
                onSetSettingsTab={setAdminReportCustomerSettingsTab}
                onMoveArea={moveReportAreaOrder}
                onMoveWork={moveReportWorkOrder}
                onToggleCustomerRow={toggleReportCustomerRow}
                onEditFactSource={setEditingReportFactSourceRowKey}
                onSetFactSourceMode={setReportCustomerFactSourceMode}
                onToggleFactSourceRow={toggleReportCustomerFactSourceRowKey}
                onAddRowLabel={addReportCustomerRowLabel}
                onChangeRowLabelSource={changeReportCustomerRowLabelSource}
                onUpdateRowLabel={updateReportCustomerRowLabel}
                onStartRowLabelEdit={startReportRowLabelEdit}
                onFinishRowLabelEdit={finishReportRowLabelEdit}
                onRemoveRowLabel={removeReportCustomerRowLabel}
                onAddSummaryRow={addReportSummaryRow}
                onUpdateSummaryRow={updateReportSummaryRow}
                onToggleSummaryRow={toggleReportSummaryRowKey}
                onStartSummaryEdit={startReportSummaryEdit}
                onFinishSummaryEdit={finishReportSummaryEdit}
                onRemoveSummaryRow={removeReportSummaryRow}
              />
            )}

          </SectionCard>
        )}

        {activeCustomTab && <CustomTabSection tab={activeCustomTab} />}
      </div>
    </div>
  );
}
