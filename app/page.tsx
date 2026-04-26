"use client";

import { Check, ChevronDown, ChevronRight, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Fragment, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPtoDateFormulaModel, getPtoFormulaCellValue, ptoFormulaCellMatches, resolvePtoFormulaActiveAfterClear, resolvePtoFormulaAnchor, resolvePtoFormulaMoveTarget, selectedPtoFormulaCells, togglePtoFormulaSelectionKeys, withPtoFormulaScope, type PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import { PtoDateEditableHeaders } from "@/features/pto/PtoDateEditableHeaders";
import { PtoDateEditableTextCell } from "@/features/pto/PtoDateEditableTextCell";
import { PtoDateFormulaInput } from "@/features/pto/PtoDateFormulaInput";
import { PtoCustomerCodeCell, PtoEditableHeaderText, PtoEditableMonthHeader, PtoFormulaBar, PtoPlanTd, PtoReadonlyNumberCell, PtoStatusCell, PtoUnitCell, PtoVirtualSpacerRow } from "@/features/pto/PtoDateTableParts";
import { PtoDateDraftRow } from "@/features/pto/PtoDateDraftRow";
import { PtoDateReadonlyTable } from "@/features/pto/PtoDateReadonlyTable";
import { PtoDateToolbar } from "@/features/pto/PtoDateToolbar";
import { createPtoDatabaseState, normalizeLoadedPtoDatabaseState, ptoDatabaseMessages, ptoDatabaseSaveShouldSkip, ptoDatabaseStateChanged, resolvePtoDatabaseLoadResolution, savePtoDatabaseSnapshot, savePtoStateToBrowserStorage, serializePtoDatabaseState, validatePtoDatabaseLoadState, type PtoDatabaseSaveMode } from "@/features/pto/ptoPersistenceModel";
import {
  dragHandleDotStyle,
  dragHandleDotsStyle,
  dragHandleStyle,
  ptoAreaCellStyle,
  ptoCompactNumberInputStyle,
  ptoDateTableLayoutStyle,
  ptoDateTableScrollStyle,
  ptoDropIndicatorStyle,
  ptoInlineAddRowButtonHoverStyle,
  ptoInlineAddRowButtonStyle,
  ptoPlanDayInputStyle,
  ptoPlanInputStyle,
  ptoPlanTableStyle,
  ptoReadonlyTotalStyle,
  ptoRowDeleteButtonStyle,
  ptoRowResizeHandleStyle,
  ptoRowToolsStyle,
} from "@/features/pto/ptoDateTableStyles";
import { createPtoDateTableModel, createPtoEffectiveCarryoverGetter, createPtoRowDateTotalsGetter } from "@/features/pto/ptoDateTableModel";
import { usePtoDateViewport } from "@/features/pto/usePtoDateViewport";
import { reportPrintCss } from "@/features/reports/printCss";
import { automaticReportDate, hasClientReportDateOverride, isStoredReportDateValue, readClientReportDateSelection, reportDateOverrideStorageKey, resolveReportDateAreaContext } from "@/features/reports/lib/reportDateSelection";
import { cloneUndoSnapshot, type UndoSnapshot } from "@/lib/domain/app/undo";
import { defaultAreaShiftCutoffs, defaultAreaShiftScheduleArea, isValidAreaShiftCutoffTime, normalizeAreaShiftCutoffs, resolveAreaShiftCutoffTime, type AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import { adminLogLimit, normalizeAdminLogEntry, type AdminLogEntry } from "@/lib/domain/admin/logs";
import { adminSectionTabs, structureSectionTabs, type AdminReportCustomerSettingsTab, type AdminSection, type StructureSection } from "@/lib/domain/admin/navigation";
import { defaultDependencyLinkForm, defaultDependencyLinks, defaultDependencyNodeForm, defaultDependencyNodes, defaultOrgMemberForm, defaultOrgMembers, dependencyNodeLabel, dependencyStages, orgMemberLabel, type DependencyLink, type DependencyLinkType, type DependencyNode, type OrgMember } from "@/lib/domain/admin/structure";
import { buildDispatchAiSuggestion, consolidateDispatchSummaryRows, createDefaultDispatchSummaryRows, createDispatchSummaryRow, dispatchShiftFromTab, normalizeDispatchSummaryRows, type DispatchSummaryNumberField, type DispatchSummaryRow, type DispatchSummaryTextField } from "@/lib/domain/dispatch/summary";
import { buildReportPtoIndex, createReportRowFromPtoPlan, deriveReportRowFromPtoIndex, reportReasonAccumulationStartDateFromIndexes } from "@/lib/domain/reports/calculation";
import { defaultReportColumnWidths, reportColumnHeaderFallbacks, reportColumnKeys, reportCompactColumnKeys, type ReportColumnKey } from "@/lib/domain/reports/columns";
import { normalizeStoredReportCustomers } from "@/lib/domain/reports/customers";
import { defaultReportCustomerId, defaultReportCustomers } from "@/lib/domain/reports/defaults";
import { applyReportFactSourceRows, createReportSummaryRow, delta, formatNumber, formatPercent, reportAutoColumnWidth, reportCustomerEffectiveRowKeys, reportCustomerUsesSummaryRows, reportRowDisplayKey, reportRowHasAutoShowData, reportRowKey, reportRowsForCustomer, sortAreaNamesByOrder, sortReportRowsByAreaOrder } from "@/lib/domain/reports/display";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "@/lib/domain/reports/facts";
import { reportReason, reportReasonEntryKey, reportYearReasonOverrideKey, reportYearReasonValue } from "@/lib/domain/reports/reasons";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";
import { createEmptyPtoDateRow, defaultPtoPlanMonth, distributeMonthlyTotal, insertPtoRowAfter, monthDays, normalizePtoCustomerCode, normalizePtoPlanRow, normalizePtoUnit, normalizePtoYearValue, normalizeStoredPtoYears, previousPtoYearLabel, ptoAreaMatches, ptoAutomatedStatus, ptoFieldLogLabel, ptoLinkedRowMatches, ptoLinkedRowSignature, ptoRowFieldDomKey, ptoRowHasYear, ptoStatusRowBackground, ptoYearOptions, removeYearFromPtoRows, reorderPtoRows, yearMonths, type PtoDateTableKey, type PtoDropPosition, type PtoPlanRow } from "@/lib/domain/pto/date-table";
import { defaultPtoOperRows, defaultPtoPlanRows, defaultPtoSurveyRows, defaultReportDate } from "@/lib/domain/pto/defaults";
import { createPtoPlanExportColumns, createPtoPlanExportRows, createPtoPlanRowsFromImportTable, ensureImportedRowsInLinkedPtoTable, mergeImportedPtoPlanRows, ptoDateExportFileName, ptoDateTableMeta } from "@/lib/domain/pto/excel";
import { formatMonthName, formatPtoCellNumber, formatPtoFormulaNumber, parseDecimalInput, parseDecimalValue } from "@/lib/domain/pto/formatting";
import { countPtoStateData } from "@/lib/domain/pto/state-stats";
import { calculatePtoVirtualRows, ptoDateVirtualDefaultRowHeight, ptoDateVirtualHeaderOffset } from "@/lib/domain/pto/virtualization";
import { compactSubTabLabel, compactTopTabLabel, createDefaultSubTabs, customTabKey, defaultTopTabs, normalizeStoredCustomTabs, normalizeStoredSubTabs, normalizeStoredTopTabs, type CustomTab, type EditableSubtabGroup, type SubTabConfig, type TopTab, type TopTabDefinition } from "@/lib/domain/navigation/tabs";
import { createPtoBucketColumns, createPtoBucketRows, normalizePtoBucketManualRows, ptoBucketRowKey, type PtoBucketColumn, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { defaultContractors, defaultFuelContractors, defaultFuelGeneral, defaultUserCard } from "@/lib/domain/reference/defaults";
import { createDefaultVehicles, createVehicleSeedVersion, defaultVehicleForm, defaultVehicleSeedReplaceLimit, normalizeVehicleRow, type VehicleSeedRow } from "@/lib/domain/vehicles/defaults";
import { buildVehicleDisplayName, createVehicleExportRows, parseVehicleImportFile } from "@/lib/domain/vehicles/import-export";
import { cloneVehicleRows, createVehicleFilterOptions, vehicleFilterOptionLabel, vehicleMatchesFilters } from "@/lib/domain/vehicles/filtering";
import { adminVehicleFallbackPreviewRows, adminVehicleMinPreviewRows, adminVehicleViewportBottomReserve, parseVehicleInlineFieldDomKey, vehicleAutocompleteFilterKeys, vehicleFieldIsNumeric, vehicleFilterColumnConfigs, vehicleInlineFieldDomKey, vehicleInlineFields, type VehicleFilterKey, type VehicleFilters, type VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { databaseConfigured, dataProviderLabel } from "@/lib/data/config";
import type { DataClientSnapshot } from "@/lib/data/app-state";
import { clientSnapshotRestoreFlagKey, clientSnapshotStats, collectLocalStorageBackup, getOrCreateClientId, savePtoLocalRecoveryBackup } from "@/lib/storage/client-snapshots";
import { adminStorageKeys } from "@/lib/storage/keys";
import { createId } from "@/lib/utils/id";
import { errorToMessage, isRecord, mergeDefaultsById, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringList, normalizeStringListRecord, normalizeStringRecord } from "@/lib/utils/normalizers";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";
import { createXlsxBlob, parseTableImportFile } from "@/lib/utils/xlsx";
import { editableGridArrowOffset, editableGridKeyAtOffset, editableGridRangeKeys, isEditableGridArrowKey, toggleEditableGridSelectionKey } from "@/shared/editable-grid/selection";
import { IconButton, TopButton } from "@/shared/ui/buttons";
import { CompactTd, CompactTh, Field, SectionCard, SourceNote, SubTabs, VehicleMeta } from "@/shared/ui/layout";
import { HeaderSubButton } from "@/shared/ui/navigation";
import { SaveStatusIndicator } from "@/shared/ui/SaveStatusIndicator";
import { useSaveStatus } from "@/shared/ui/useSaveStatus";

type PtoDropTarget = {
  rowId: string;
  position: PtoDropPosition;
};

type PtoResizeState =
  | { type: "column"; key: string; startX: number; startWidth: number }
  | { type: "row"; key: string; startY: number; startHeight: number };

type ReportResizeState = {
  key: string;
  startX: number;
  startWidth: number;
};

const emptyPtoDraftRowFields = {
  customerCode: "",
  area: "",
  location: "",
  structure: "",
  unit: "",
};

const defaultVehicles: VehicleRow[] = createDefaultVehicles([]);
const clientSnapshotSaveDelayMs = 1500;
const clientSnapshotAutoMinIntervalMs = 120000;
const sharedAppSettingKeys = [
  adminStorageKeys.reportCustomers,
  adminStorageKeys.reportAreaOrder,
  adminStorageKeys.reportWorkOrder,
  adminStorageKeys.reportHeaderLabels,
  adminStorageKeys.reportColumnWidths,
  adminStorageKeys.reportReasons,
  adminStorageKeys.customTabs,
  adminStorageKeys.topTabs,
  adminStorageKeys.subTabs,
  adminStorageKeys.dispatchSummaryRows,
  adminStorageKeys.areaShiftCutoffs,
  adminStorageKeys.orgMembers,
  adminStorageKeys.dependencyNodes,
  adminStorageKeys.dependencyLinks,
  adminStorageKeys.adminLogs,
] as const;

async function loadDefaultVehicleSeed() {
  const seedModule = await import("@/data/default-vehicles.json");
  const seedRows = seedModule.default as VehicleSeedRow[];

  return {
    rows: seedRows,
    version: createVehicleSeedVersion(seedRows),
    vehicles: createDefaultVehicles(seedRows),
  };
}

const vehicleFilterColumns = vehicleFilterColumnConfigs.map((column) => (
  column.key === "visible" ? { ...column, icon: <Eye size={14} aria-hidden /> } : column
));

const defaultSubTabs = createDefaultSubTabs(Object.keys(defaultContractors));

const AdminVehiclesSection = dynamic(() => import("@/features/admin/vehicles/AdminVehiclesSection"), {
  ssr: false,
});
const AdminDatabaseSection = dynamic(() => import("@/features/admin/database/AdminDatabaseSection"), {
  ssr: false,
});
const AdminLogsSection = dynamic(() => import("@/features/admin/logs/AdminLogsSection"), {
  ssr: false,
});
const AdminNavigationSection = dynamic(() => import("@/features/admin/navigation/AdminNavigationSection"), {
  ssr: false,
});
const DispatchSection = dynamic(() => import("@/features/dispatch/DispatchSection"), {
  ssr: false,
});
const ReportsSection = dynamic(() => import("@/features/reports/ReportsSection"), {
  ssr: false,
});
const PtoSection = dynamic(() => import("@/features/pto/PtoSection"), {
  ssr: false,
});
const AdminReportSettingsSection = dynamic(() => import("@/features/reports/admin/AdminReportSettingsSection"), {
  ssr: false,
});

export default function App() {
  const [topTab, setTopTab] = useState<TopTab>("reports");
  const headerNavRef = useRef<HTMLDivElement | null>(null);
  const activeHeaderTabRef = useRef<HTMLDivElement | null>(null);
  const headerSubtabsRef = useRef<HTMLDivElement | null>(null);

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
  const vehicleSaveTimerRef = useRef<number | null>(null);
  const vehiclesDatabaseLoadedRef = useRef(false);
  const vehiclesDatabaseSaveSnapshotRef = useRef("");
  const appStateSaveTimerRef = useRef<number | null>(null);
  const appDatabaseSaveSnapshotRef = useRef("");
  const appSettingsDatabaseLoadedRef = useRef(false);
  const appSettingsDatabaseSaveSnapshotRef = useRef("");
  const clientSnapshotSaveTimerRef = useRef<number | null>(null);
  const clientSnapshotSaveSnapshotRef = useRef("");
  const clientSnapshotSaveDisabledRef = useRef(false);
  const clientSnapshotLastAutoQueuedAtRef = useRef(0);
  const vehicleUndoHistoryRef = useRef<VehicleRow[][]>([]);
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
  const ptoResizeStateRef = useRef<PtoResizeState | null>(null);
  const reportResizeStateRef = useRef<ReportResizeState | null>(null);
  const vehicleImportInputRef = useRef<HTMLInputElement | null>(null);
  const ptoPlanImportInputRef = useRef<HTMLInputElement | null>(null);
  const hasStoredPtoStateRef = useRef(false);
  const ptoDatabaseLoadedRef = useRef(false);
  const ptoDatabaseSavingRef = useRef(false);
  const ptoDatabaseSaveQueuedRef = useRef(false);
  const ptoDatabaseSaveSnapshotRef = useRef("");
  const ptoLocalSaveTimerRef = useRef<number | null>(null);
  const reportReasonDraftTimerRef = useRef<number | null>(null);
  const [topTabs, setTopTabs] = useState<TopTabDefinition[]>(defaultTopTabs);
  const [subTabs, setSubTabs] = useState<Record<EditableSubtabGroup, SubTabConfig[]>>(defaultSubTabs);
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
  const [reportDate, setReportDate] = useState(() => readClientReportDateSelection(defaultAreaShiftCutoffs, defaultAreaShiftScheduleArea));
  const [hasManualReportDateOverride, setHasManualReportDateOverride] = useState(() => hasClientReportDateOverride());
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
  const [headerSubtabsOffset, setHeaderSubtabsOffset] = useState(0);
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>(defaultOrgMembers);
  const [orgMemberForm, setOrgMemberForm] = useState<OrgMember>(defaultOrgMemberForm);
  const [editingOrgMemberId, setEditingOrgMemberId] = useState<string | null>(null);
  const [dependencyNodes, setDependencyNodes] = useState<DependencyNode[]>(defaultDependencyNodes);
  const [dependencyLinks, setDependencyLinks] = useState<DependencyLink[]>(defaultDependencyLinks);
  const [dependencyNodeForm, setDependencyNodeForm] = useState<DependencyNode>(defaultDependencyNodeForm);
  const [dependencyLinkForm, setDependencyLinkForm] = useState<DependencyLink>(defaultDependencyLinkForm);
  const [editingDependencyNodeId, setEditingDependencyNodeId] = useState<string | null>(null);
  const [editingDependencyLinkId, setEditingDependencyLinkId] = useState<string | null>(null);
  const [structureSection, setStructureSection] = useState<StructureSection>("scheme");
  const [adminSection, setAdminSection] = useState<AdminSection>("vehicles");
  const [clientSnapshots, setClientSnapshots] = useState<DataClientSnapshot[]>([]);
  const [databasePanelMessage, setDatabasePanelMessage] = useState("");
  const [databasePanelLoading, setDatabasePanelLoading] = useState(false);
  const [adminLogs, setAdminLogs] = useState<AdminLogEntry[]>([]);
  const [ptoDatabaseMessage, setPtoDatabaseMessage] = useState(databaseConfigured ? "База данных подключается..." : "База данных не настроена.");
  const { saveStatus, showSaveStatus, hideSaveStatus } = useSaveStatus();
  const [ptoDatabaseReady, setPtoDatabaseReady] = useState(!databaseConfigured);
  const [ptoSaveRevision, setPtoSaveRevision] = useState(0);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);
  const [areaFilter, setAreaFilter] = useState("Все участки");
  const [search, setSearch] = useState("");
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
  const undoHistoryRef = useRef<UndoSnapshot[]>([]);
  const undoCurrentSnapshotRef = useRef<UndoSnapshot | null>(null);
  const undoSnapshotTimerRef = useRef<number | null>(null);
  const undoRestoringRef = useRef(false);
  const createUndoSnapshot = useCallback((): UndoSnapshot => ({
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
    vehicleRows: cloneVehicleRows(vehicleRowsRef.current),
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
  }), [
    customTabs,
    dependencyLinks,
    dependencyNodes,
    expandedPtoMonths,
    areaShiftCutoffs,
    orgMembers,
    ptoBucketManualRows,
    ptoBucketValues,
    ptoColumnWidths,
    ptoHeaderLabels,
    ptoManualYears,
    ptoOperRows,
    ptoPlanRows,
    ptoRowHeights,
    ptoSurveyRows,
    reportAreaOrder,
    reportColumnWidths,
    reportReasons,
    reportWorkOrder,
    reportHeaderLabels,
    reportCustomers,
    subTabs,
    topTabs,
  ]);

  const addAdminLog = useCallback((entry: Omit<AdminLogEntry, "id" | "at" | "user">) => {
    const nextEntry: AdminLogEntry = {
      id: createId(),
      at: new Date().toISOString(),
      user: defaultUserCard.fullName || "Пользователь",
      ...entry,
    };

    setAdminLogs((current) => {
      const previousEntry = current[0];
      const previousDate = previousEntry ? new Date(previousEntry.at).getTime() : 0;
      const shouldMerge = previousEntry
        && previousEntry.action === nextEntry.action
        && previousEntry.section === nextEntry.section
        && previousEntry.details === nextEntry.details
        && Date.now() - previousDate < 10000;
      const nextLogs = shouldMerge
        ? [{ ...previousEntry, ...nextEntry }, ...current.slice(1)]
        : [nextEntry, ...current].slice(0, adminLogLimit);

      window.localStorage.setItem(adminStorageKeys.adminLogs, JSON.stringify(nextLogs));
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
      return nextLogs;
    });
  }, []);

  const saveClientSnapshotToDatabase = useCallback(async (reason: string) => {
    if (!databaseConfigured || clientSnapshotSaveDisabledRef.current) return;

    const clientId = getOrCreateClientId();
    const storage = collectLocalStorageBackup();
    if (Object.keys(storage).length === 0) return;

    const snapshot = JSON.stringify({ clientId, storage });
    if (snapshot === clientSnapshotSaveSnapshotRef.current) return;

    const { saveClientAppSnapshotToDatabase } = await import("@/lib/data/app-state");
    await saveClientAppSnapshotToDatabase(clientId, storage, {
      reason,
      userAgent: window.navigator.userAgent,
      url: window.location.href,
    });
    clientSnapshotSaveSnapshotRef.current = snapshot;
  }, []);

  const requestClientSnapshotSave = useCallback((reason = "auto") => {
    if (!databaseConfigured || clientSnapshotSaveDisabledRef.current) return;

    const manualSnapshot = reason.startsWith("manual");
    const now = Date.now();
    if (!manualSnapshot && now - clientSnapshotLastAutoQueuedAtRef.current < clientSnapshotAutoMinIntervalMs) return;
    if (!manualSnapshot) clientSnapshotLastAutoQueuedAtRef.current = now;

    if (clientSnapshotSaveTimerRef.current !== null) {
      window.clearTimeout(clientSnapshotSaveTimerRef.current);
    }

    clientSnapshotSaveTimerRef.current = window.setTimeout(() => {
      void saveClientSnapshotToDatabase(reason).catch((error) => {
        console.warn("Database client snapshot save failed:", error);
        const message = errorToMessage(error);
        if (message.includes("public.app_state") || message.includes("PGRST205")) {
          clientSnapshotSaveDisabledRef.current = true;
          showSaveStatus("error", "Резервная копия браузера отключена: таблица снимков не создана. Основные данные сохраняются отдельно.");
          return;
        }
        showSaveStatus("error", `Резервная копия не сохранена: ${message}`);
      });
      clientSnapshotSaveTimerRef.current = null;
    }, clientSnapshotSaveDelayMs);
  }, [saveClientSnapshotToDatabase, showSaveStatus]);

  const refreshClientSnapshots = useCallback(async () => {
    if (!databaseConfigured) {
      setDatabasePanelMessage("База данных не настроена.");
      return;
    }

    setDatabasePanelLoading(true);
    try {
      const { loadClientAppSnapshotsFromDatabase } = await import("@/lib/data/app-state");
      const snapshots = await loadClientAppSnapshotsFromDatabase();
      setClientSnapshots(snapshots);
      setDatabasePanelMessage(`Снимков браузеров: ${snapshots.length}.`);
    } catch (error) {
      setDatabasePanelMessage(`Не удалось прочитать снимки: ${errorToMessage(error)}`);
    } finally {
      setDatabasePanelLoading(false);
    }
  }, []);

  const createClientSnapshotNow = useCallback(() => {
    void saveClientSnapshotToDatabase("manual-admin-database-panel")
      .then(refreshClientSnapshots)
      .catch((error) => {
        setDatabasePanelMessage(`Не удалось создать снимок: ${errorToMessage(error)}`);
      });
  }, [refreshClientSnapshots, saveClientSnapshotToDatabase]);

  const restoreClientSnapshot = useCallback((snapshot: DataClientSnapshot) => {
    Object.entries(snapshot.storage).forEach(([key, value]) => {
      window.localStorage.setItem(key, value);
    });
    window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
    window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
    window.sessionStorage.setItem(clientSnapshotRestoreFlagKey, "1");
    window.location.reload();
  }, []);

  function pushVehicleUndoSnapshot() {
    vehicleUndoHistoryRef.current = [
      ...vehicleUndoHistoryRef.current,
      cloneVehicleRows(vehicleRowsRef.current),
    ].slice(-10);
  }

  const restoreUndoSnapshot = useCallback((snapshot: UndoSnapshot) => {
    setReportCustomers(snapshot.reportCustomers);
    setReportAreaOrder(snapshot.reportAreaOrder);
    setReportWorkOrder(snapshot.reportWorkOrder);
    setReportHeaderLabels(snapshot.reportHeaderLabels);
    setReportColumnWidths(snapshot.reportColumnWidths);
    setReportReasons(snapshot.reportReasons);
    setAreaShiftCutoffs(snapshot.areaShiftCutoffs);
    setCustomTabs(snapshot.customTabs);
    setTopTabs(snapshot.topTabs);
    setSubTabs(snapshot.subTabs);
    setVehicleRows(snapshot.vehicleRows);
    setPtoManualYears(snapshot.ptoManualYears);
    setExpandedPtoMonths(snapshot.expandedPtoMonths);
    setPtoPlanRows(snapshot.ptoPlanRows);
    setPtoSurveyRows(snapshot.ptoSurveyRows);
    setPtoOperRows(snapshot.ptoOperRows);
    setPtoColumnWidths(snapshot.ptoColumnWidths);
    setPtoRowHeights(snapshot.ptoRowHeights);
    setPtoHeaderLabels(snapshot.ptoHeaderLabels);
    setPtoBucketValues(snapshot.ptoBucketValues);
    setPtoBucketManualRows(snapshot.ptoBucketManualRows);
    setOrgMembers(snapshot.orgMembers);
    setDependencyNodes(snapshot.dependencyNodes);
    setDependencyLinks(snapshot.dependencyLinks);

    setEditingVehicleCell(null);
    setVehicleCellDraft("");
    setVehicleCellInitialDraft("");
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoFormulaDraft("");
    setEditingPtoHeaderKey(null);
    setPtoHeaderDraft("");
    setEditingReportHeaderKey(null);
    setReportHeaderDraft("");
    setOpenVehicleFilter(null);

    if (databaseConfigured && ptoDatabaseLoadedRef.current) {
      setPtoSaveRevision((revision) => revision + 1);
    }

    addAdminLog({
      action: "Отмена",
      section: "Система",
      details: "Выполнен возврат на шаг назад через Ctrl+Z.",
    });
  }, [addAdminLog]);

  const restoreVehicleUndoSnapshot = useCallback(() => {
    const previousVehicleRows = vehicleUndoHistoryRef.current.pop();
    if (!previousVehicleRows) return;

    setVehicleRows(cloneVehicleRows(previousVehicleRows));
    setEditingVehicleCell(null);
    setVehicleCellDraft("");
    setVehicleCellInitialDraft("");
    setOpenVehicleFilter(null);
    addAdminLog({
      action: "Отмена",
      section: "Техника",
      details: "Выполнен возврат списка техники на шаг назад через Ctrl+Z.",
    });
  }, [addAdminLog]);

  useEffect(() => {
    vehicleRowsRef.current = vehicleRows;
    if (undoCurrentSnapshotRef.current) {
      undoCurrentSnapshotRef.current = {
        ...undoCurrentSnapshotRef.current,
        vehicleRows: cloneVehicleRows(vehicleRows),
      };
    }
  }, [vehicleRows]);

  useEffect(() => {
    if (undoSnapshotTimerRef.current !== null) {
      window.clearTimeout(undoSnapshotTimerRef.current);
    }

    undoSnapshotTimerRef.current = window.setTimeout(() => {
      const nextSnapshot = cloneUndoSnapshot(createUndoSnapshot());

      if (!adminDataLoaded) {
        undoHistoryRef.current = [];
        undoCurrentSnapshotRef.current = nextSnapshot;
        undoRestoringRef.current = false;
        undoSnapshotTimerRef.current = null;
        return;
      }

      if (!undoCurrentSnapshotRef.current) {
        undoCurrentSnapshotRef.current = nextSnapshot;
        undoSnapshotTimerRef.current = null;
        return;
      }

      if (undoRestoringRef.current) {
        undoRestoringRef.current = false;
        undoCurrentSnapshotRef.current = nextSnapshot;
        undoSnapshotTimerRef.current = null;
        return;
      }

      undoHistoryRef.current = [
        ...undoHistoryRef.current,
        cloneUndoSnapshot(undoCurrentSnapshotRef.current),
      ].slice(-10);
      undoCurrentSnapshotRef.current = nextSnapshot;

      undoSnapshotTimerRef.current = null;
    }, 700);

    return () => {
      if (undoSnapshotTimerRef.current !== null) {
        window.clearTimeout(undoSnapshotTimerRef.current);
        undoSnapshotTimerRef.current = null;
      }
    };
  }, [adminDataLoaded, createUndoSnapshot]);

  useEffect(() => {
    const handleGlobalUndo = (event: KeyboardEvent) => {
      const isUndo = (event.ctrlKey || event.metaKey)
        && !event.shiftKey
        && (event.key.toLowerCase() === "z" || event.code === "KeyZ");

      const canUndoVehicleRows = topTab === "admin" && adminSection === "vehicles" && vehicleUndoHistoryRef.current.length > 0;
      if (!isUndo || (!canUndoVehicleRows && undoHistoryRef.current.length === 0)) return;

      const target = event.target;
      const targetElement = target instanceof HTMLElement ? target : null;
      const isNativeEditable = Boolean(targetElement?.closest("input, textarea, select, [contenteditable='true']"));
      if (isNativeEditable) return;

      event.preventDefault();

      if (canUndoVehicleRows) {
        restoreVehicleUndoSnapshot();
        return;
      }

      const previousSnapshot = undoHistoryRef.current.pop();
      if (!previousSnapshot) return;

      undoRestoringRef.current = true;
      undoCurrentSnapshotRef.current = cloneUndoSnapshot(previousSnapshot);
      restoreUndoSnapshot(previousSnapshot);
    };

    window.addEventListener("keydown", handleGlobalUndo);
    return () => window.removeEventListener("keydown", handleGlobalUndo);
  }, [adminSection, restoreUndoSnapshot, restoreVehicleUndoSnapshot, topTab]);

  useEffect(() => {
    ptoDatabaseStateRef.current = ptoDatabaseState;
  }, [ptoDatabaseState]);

  useEffect(() => {
    const nextReportDateAreaContext = resolveReportDateAreaContext(topTab, adminSection, reportArea, ptoAreaFilter);
    const nextReportDate = readClientReportDateSelection(areaShiftCutoffs, nextReportDateAreaContext);
    setHasManualReportDateOverride(hasClientReportDateOverride());
    setReportDate((current) => (current === nextReportDate ? current : nextReportDate));
  }, [adminSection, areaShiftCutoffs, ptoAreaFilter, reportArea, topTab]);

  useEffect(() => {
    if (hasManualReportDateOverride) return undefined;

    const syncAutomaticReportDate = () => {
      const nextReportDateAreaContext = resolveReportDateAreaContext(topTab, adminSection, reportArea, ptoAreaFilter);
      const nextReportDate = automaticReportDate(areaShiftCutoffs, nextReportDateAreaContext);
      setReportDate((current) => (current === nextReportDate ? current : nextReportDate));
    };

    syncAutomaticReportDate();
    const intervalId = window.setInterval(syncAutomaticReportDate, 60000);

    return () => window.clearInterval(intervalId);
  }, [adminSection, areaShiftCutoffs, hasManualReportDateOverride, ptoAreaFilter, reportArea, topTab]);

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

        if (Array.isArray(savedOrgMembers)) {
          setOrgMembers(
            savedOrgMembers.map((member) => ({
              ...defaultOrgMemberForm,
              ...(isRecord(member) ? member : {}),
              active: !isRecord(member) || member.active !== false,
            } as OrgMember)),
          );
        }

        if (Array.isArray(savedDependencyNodes)) {
          const parsedNodes = savedDependencyNodes.map((node) => ({
            ...defaultDependencyNodeForm,
            ...(isRecord(node) ? node : {}),
            visible: !isRecord(node) || node.visible !== false,
          } as DependencyNode));
          const mergedNodes = mergeDefaultsById(parsedNodes, defaultDependencyNodes);

          setDependencyNodes(mergedNodes);

          if (mergedNodes[0]) {
            setDependencyLinkForm((current) => ({
              ...current,
              fromNodeId: mergedNodes[0].id,
              toNodeId: mergedNodes[1]?.id ?? mergedNodes[0].id,
            }));
          }
        }

        if (Array.isArray(savedDependencyLinks)) {
          setDependencyLinks(
            mergeDefaultsById(
              savedDependencyLinks.map((link) => ({
                ...defaultDependencyLinkForm,
                ...(isRecord(link) ? link : {}),
                visible: !isRecord(link) || link.visible !== false,
              } as DependencyLink)),
              defaultDependencyLinks,
            ),
          );
        }

        if (Array.isArray(savedAdminLogs)) {
          setAdminLogs(savedAdminLogs.flatMap((entry) => {
            const normalizedEntry = normalizeAdminLogEntry(entry);
            return normalizedEntry ? [normalizedEntry] : [];
          }).slice(0, adminLogLimit));
        }
      } finally {
        if (cancelled) return;
        setAdminDataLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [saveClientSnapshotToDatabase]);

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
        undoHistoryRef.current = [];
        undoRestoringRef.current = true;
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
  }, [adminDataLoaded, showSaveStatus]);

  const saveAppLocalState = useCallback(() => {
    window.localStorage.setItem(adminStorageKeys.reportCustomers, JSON.stringify(reportCustomers));
    window.localStorage.setItem(adminStorageKeys.reportAreaOrder, JSON.stringify(reportAreaOrder));
    window.localStorage.setItem(adminStorageKeys.reportWorkOrder, JSON.stringify(reportWorkOrder));
    window.localStorage.setItem(adminStorageKeys.reportHeaderLabels, JSON.stringify(reportHeaderLabels));
    window.localStorage.setItem(adminStorageKeys.reportColumnWidths, JSON.stringify(reportColumnWidths));
    window.localStorage.setItem(adminStorageKeys.reportReasons, JSON.stringify(reportReasons));
    window.localStorage.setItem(adminStorageKeys.areaShiftCutoffs, JSON.stringify(areaShiftCutoffs));
    window.localStorage.setItem(adminStorageKeys.customTabs, JSON.stringify(customTabs));
    window.localStorage.setItem(adminStorageKeys.topTabs, JSON.stringify(topTabs));
    window.localStorage.setItem(adminStorageKeys.subTabs, JSON.stringify(subTabs));
    window.localStorage.setItem(adminStorageKeys.dispatchSummaryRows, JSON.stringify(dispatchSummaryRows));
    window.localStorage.setItem(adminStorageKeys.orgMembers, JSON.stringify(orgMembers));
    window.localStorage.setItem(adminStorageKeys.dependencyNodes, JSON.stringify(dependencyNodes));
    window.localStorage.setItem(adminStorageKeys.dependencyLinks, JSON.stringify(dependencyLinks));
    window.localStorage.setItem(adminStorageKeys.adminLogs, JSON.stringify(adminLogs));
    window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
  }, [
      adminLogs,
      areaShiftCutoffs,
      customTabs,
    dependencyLinks,
    dependencyNodes,
    dispatchSummaryRows,
    orgMembers,
    reportAreaOrder,
    reportColumnWidths,
    reportCustomers,
    reportHeaderLabels,
    reportReasons,
    reportWorkOrder,
    subTabs,
    topTabs,
  ]);

  const collectSharedAppSettings = useCallback(() => (
    Object.fromEntries(
      sharedAppSettingKeys.flatMap((key) => {
        const value = window.localStorage.getItem(key);
        if (value === null) return [];

        try {
          return [[key, JSON.parse(value)] as const];
        } catch {
          return [];
        }
      }),
    )
  ), []);

  const saveSharedAppSettingsToDatabase = useCallback(async () => {
    if (!databaseConfigured || !appSettingsDatabaseLoadedRef.current) return;

    const settings = collectSharedAppSettings();
    const snapshot = JSON.stringify(settings);
    if (snapshot === appSettingsDatabaseSaveSnapshotRef.current) return;

    showSaveStatus("saving", "Сохраняю настройки...");

    try {
      const { saveAppSettingsToDatabase } = await import("@/lib/data/settings");
      await saveAppSettingsToDatabase(settings);
      appSettingsDatabaseSaveSnapshotRef.current = snapshot;
      showSaveStatus("saved", "Настройки сохранены.");
    } catch (error) {
      showSaveStatus("error", `Настройки не сохранены: ${errorToMessage(error)}`);
      throw error;
    }
  }, [collectSharedAppSettings, showSaveStatus]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (appStateSaveTimerRef.current !== null) {
      window.clearTimeout(appStateSaveTimerRef.current);
    }

    appStateSaveTimerRef.current = window.setTimeout(() => {
      saveAppLocalState();
      void saveSharedAppSettingsToDatabase().catch((error) => {
        console.warn("Database app_settings save failed:", error);
      });
      requestClientSnapshotSave("app-state-save");
      appStateSaveTimerRef.current = null;
    }, 300);

    return () => {
      if (appStateSaveTimerRef.current !== null) {
        window.clearTimeout(appStateSaveTimerRef.current);
        appStateSaveTimerRef.current = null;
      }
    };
  }, [adminDataLoaded, requestClientSnapshotSave, saveAppLocalState, saveSharedAppSettingsToDatabase]);

  // The shared main app_state remains load-only. Per-browser snapshots are
  // written separately so one stale browser cannot overwrite another one.

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (vehicleSaveTimerRef.current !== null) {
      window.clearTimeout(vehicleSaveTimerRef.current);
    }

    vehicleSaveTimerRef.current = window.setTimeout(() => {
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRowsRef.current));
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
      if (databaseConfigured && vehiclesDatabaseLoadedRef.current) {
        const snapshot = JSON.stringify(vehicleRowsRef.current);
        if (snapshot !== vehiclesDatabaseSaveSnapshotRef.current) {
          showSaveStatus("saving", "Сохраняю технику...");
          void import("@/lib/data/vehicles")
            .then(({ saveVehiclesToDatabase }) => saveVehiclesToDatabase(vehicleRowsRef.current))
            .then(() => {
              vehiclesDatabaseSaveSnapshotRef.current = snapshot;
              showSaveStatus("saved", "Техника сохранена.");
            })
            .catch((error) => {
              console.warn("Database vehicles save failed:", error);
              showSaveStatus("error", `Техника не сохранена: ${errorToMessage(error)}`);
            });
        }
      }
      requestClientSnapshotSave("vehicles-save");
      vehicleSaveTimerRef.current = null;
    }, 700);

    return () => {
      if (vehicleSaveTimerRef.current !== null) {
        window.clearTimeout(vehicleSaveTimerRef.current);
        vehicleSaveTimerRef.current = null;
      }
    };
  }, [adminDataLoaded, requestClientSnapshotSave, showSaveStatus, vehicleRows]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    const flushVehicleRows = () => {
      if (vehicleSaveTimerRef.current !== null) {
        window.clearTimeout(vehicleSaveTimerRef.current);
        vehicleSaveTimerRef.current = null;
      }
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRowsRef.current));
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
    };

    window.addEventListener("pagehide", flushVehicleRows);
    return () => window.removeEventListener("pagehide", flushVehicleRows);
  }, [adminDataLoaded]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    const flushAppLocalState = () => {
      if (appStateSaveTimerRef.current !== null) {
        window.clearTimeout(appStateSaveTimerRef.current);
        appStateSaveTimerRef.current = null;
      }
      saveAppLocalState();
    };

    window.addEventListener("pagehide", flushAppLocalState);
    return () => window.removeEventListener("pagehide", flushAppLocalState);
  }, [adminDataLoaded, saveAppLocalState]);

  const savePtoLocalState = useCallback(() => {
    const state = ptoDatabaseStateRef.current;
    const markLocalUpdatedAt = ptoDatabaseLoadedRef.current;

    savePtoStateToBrowserStorage(state, markLocalUpdatedAt);
    if (markLocalUpdatedAt) {
      hasStoredPtoStateRef.current = true;
    }
    requestClientSnapshotSave("pto-local-save");
  }, [requestClientSnapshotSave]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (ptoLocalSaveTimerRef.current !== null) {
      window.clearTimeout(ptoLocalSaveTimerRef.current);
    }

    ptoLocalSaveTimerRef.current = window.setTimeout(() => {
      savePtoLocalState();
      ptoLocalSaveTimerRef.current = null;
    }, 600);

    return () => {
      if (ptoLocalSaveTimerRef.current !== null) {
        window.clearTimeout(ptoLocalSaveTimerRef.current);
        ptoLocalSaveTimerRef.current = null;
      }
    };
  }, [
    adminDataLoaded,
    ptoBucketManualRows,
    ptoBucketValues,
    ptoColumnWidths,
    ptoHeaderLabels,
    ptoManualYears,
    ptoOperRows,
    ptoPlanRows,
    ptoRowHeights,
    ptoSurveyRows,
    savePtoLocalState,
  ]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    const flushPtoRows = () => {
      if (ptoLocalSaveTimerRef.current !== null) {
        window.clearTimeout(ptoLocalSaveTimerRef.current);
        ptoLocalSaveTimerRef.current = null;
      }
      savePtoLocalState();
    };

    window.addEventListener("pagehide", flushPtoRows);
    return () => window.removeEventListener("pagehide", flushPtoRows);
  }, [adminDataLoaded, savePtoLocalState]);

  const savePtoDatabaseChanges = useCallback(async (mode: PtoDatabaseSaveMode = "manual") => {
    if (!databaseConfigured) {
      setPtoDatabaseMessage(ptoDatabaseMessages.notConfigured);
      showSaveStatus("error", ptoDatabaseMessages.notConfigured);
      return;
    }

    if (!ptoDatabaseLoadedRef.current) {
      setPtoDatabaseMessage(ptoDatabaseMessages.loadingSaveDeferred);
      showSaveStatus("saving", ptoDatabaseMessages.loadingSaveDeferredStatus);
      return;
    }

    const snapshotToSave = serializePtoDatabaseState(ptoDatabaseStateRef.current);
    if (ptoDatabaseSaveShouldSkip(mode, snapshotToSave, ptoDatabaseSaveSnapshotRef.current)) {
      setPtoDatabaseMessage(ptoDatabaseMessages.alreadySaved);
      return;
    }

    if (ptoDatabaseSavingRef.current) {
      ptoDatabaseSaveQueuedRef.current = true;
      return;
    }

    ptoDatabaseSavingRef.current = true;
    setPtoDatabaseMessage(ptoDatabaseMessages.savingState(mode));
    showSaveStatus("saving", ptoDatabaseMessages.saving);

    try {
      await savePtoDatabaseSnapshot(ptoDatabaseStateRef.current);
      ptoDatabaseSaveSnapshotRef.current = snapshotToSave;
      setPtoDatabaseMessage(ptoDatabaseMessages.savedState(mode));
      showSaveStatus("saved", ptoDatabaseMessages.savedStatus);
    } catch (error) {
      const message = errorToMessage(error);
      setPtoDatabaseMessage(ptoDatabaseMessages.saveError(message));
      showSaveStatus("error", ptoDatabaseMessages.saveErrorStatus(message));
    } finally {
      ptoDatabaseSavingRef.current = false;
      if (ptoDatabaseSaveQueuedRef.current) {
        ptoDatabaseSaveQueuedRef.current = false;
        if (ptoDatabaseStateChanged(ptoDatabaseStateRef.current, ptoDatabaseSaveSnapshotRef.current)) {
          setPtoSaveRevision((current) => current + 1);
        }
      }
    }
  }, [showSaveStatus]);

  const requestPtoDatabaseSave = useCallback(() => {
    if (!databaseConfigured || !ptoDatabaseLoadedRef.current) return;
    setPtoDatabaseMessage(ptoDatabaseMessages.queued);
    setPtoSaveRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!adminDataLoaded || !databaseConfigured || !ptoDatabaseLoadedRef.current || ptoSaveRevision === 0) return;
    void savePtoDatabaseChanges("auto");
  }, [adminDataLoaded, ptoSaveRevision, savePtoDatabaseChanges]);

  useEffect(() => {
    const clearResizeCursor = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const handleResizeMove = (event: MouseEvent) => {
      const resizeState = ptoResizeStateRef.current;
      if (resizeState) {
        if (resizeState.type === "column") {
          const nextWidth = Math.min(800, Math.max(44, Math.round(resizeState.startWidth + event.clientX - resizeState.startX)));
          setPtoColumnWidths((current) => (current[resizeState.key] === nextWidth ? current : { ...current, [resizeState.key]: nextWidth }));
          return;
        }

        const nextHeight = Math.min(180, Math.max(28, Math.round(resizeState.startHeight + event.clientY - resizeState.startY)));
        setPtoRowHeights((current) => (current[resizeState.key] === nextHeight ? current : { ...current, [resizeState.key]: nextHeight }));
        return;
      }

      const reportResizeState = reportResizeStateRef.current;
      if (!reportResizeState) return;

      const nextWidth = Math.min(520, Math.max(42, Math.round(reportResizeState.startWidth + event.clientX - reportResizeState.startX)));
      setReportColumnWidths((current) => (current[reportResizeState.key] === nextWidth ? current : { ...current, [reportResizeState.key]: nextWidth }));
    };

    const handleResizeEnd = () => {
      const resizeState = ptoResizeStateRef.current;
      const reportResizeState = reportResizeStateRef.current;
      if (!resizeState && !reportResizeState) return;

      ptoResizeStateRef.current = null;
      reportResizeStateRef.current = null;
      clearResizeCursor();
      requestPtoDatabaseSave();
      addAdminLog({
        action: "Редактирование",
        section: reportResizeState ? "Отчетность" : "ПТО",
        details: reportResizeState
          ? "Изменена ширина столбца отчетности."
          : resizeState?.type === "column" ? "Изменена ширина столбца." : "Изменена высота строки.",
      });
    };

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
      clearResizeCursor();
    };
  }, [addAdminLog, requestPtoDatabaseSave]);

  useEffect(() => {
    const stopPtoSelectionDrag = () => {
      ptoSelectionDraggingRef.current = false;
      vehicleSelectionDraggingRef.current = false;
    };

    window.addEventListener("mouseup", stopPtoSelectionDrag);
    return () => window.removeEventListener("mouseup", stopPtoSelectionDrag);
  }, []);

  useEffect(() => {
    const clearCellSelectionsOnOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const isCellClick = target.closest([
        "[data-admin-vehicle-cell]",
        "[data-admin-vehicle-input]",
        "[data-pto-cell-key]",
        "[data-pto-bucket-cell]",
      ].join(","));

      if (isCellClick) return;

      vehicleSelectionDraggingRef.current = false;
      vehicleSelectionAnchorRef.current = null;
      ptoSelectionDraggingRef.current = false;

      setActiveVehicleCell((current) => (current === null ? current : null));
      setVehicleSelectionAnchorCell((current) => (current === null ? current : null));
      setSelectedVehicleCellKeys((current) => (current.length === 0 ? current : []));
      setEditingVehicleCell((current) => (current === null ? current : null));

      setPtoFormulaCell((current) => (current === null ? current : null));
      setPtoFormulaDraft((current) => (current === "" ? current : ""));
      setPtoInlineEditCell((current) => (current === null ? current : null));
      setPtoInlineEditInitialDraft((current) => (current === "" ? current : ""));
      setPtoSelectionAnchorCell((current) => (current === null ? current : null));
      setPtoSelectedCellKeys((current) => (current.length === 0 ? current : []));
    };

    window.addEventListener("mousedown", clearCellSelectionsOnOutsideClick);
    return () => window.removeEventListener("mousedown", clearCellSelectionsOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!ptoPendingFieldFocus) return;

    const frame = window.requestAnimationFrame(() => {
      const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-pto-row-field="${ptoRowFieldDomKey(ptoPendingFieldFocus.rowId, ptoPendingFieldFocus.field)}"]`,
      );

      if (!element) return;
      element.focus();
      if (element instanceof HTMLInputElement) {
        const valueLength = element.value.length;
        element.setSelectionRange(valueLength, valueLength);
      }
      setPtoPendingFieldFocus(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [ptoPendingFieldFocus, ptoOperRows, ptoPlanRows, ptoSurveyRows]);

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

  const reportBaseRows = useMemo(() => {
    if (!needsReportRows) return [];

    const rowsByKey = new Map<string, ReportRow>();
    const plannedBaseKeys = new Set(
      deferredPtoPlanRows
        .filter((row) => row.structure.trim())
        .map((row) => reportRowKey({ area: cleanAreaName(row.area), name: row.structure })),
    );

    deferredPtoPlanRows.forEach((row) => {
      if (!row.structure.trim()) return;

      const reportRow = createReportRowFromPtoPlan(row);
      const key = reportRowKey(reportRow);
      if (!rowsByKey.has(key)) rowsByKey.set(key, reportRow);
    });

    [...deferredPtoSurveyRows, ...deferredPtoOperRows].forEach((row) => {
      if (!row.structure.trim()) return;

      const baseKey = reportRowKey({ area: cleanAreaName(row.area), name: row.structure });
      if (plannedBaseKeys.has(baseKey)) return;

      const reportRow = createReportRowFromPtoPlan(row);
      const key = reportRowKey(reportRow);
      if (!rowsByKey.has(key)) rowsByKey.set(key, reportRow);
    });

    return Array.from(rowsByKey.values()).sort((a, b) => (
      a.area.localeCompare(b.area, "ru") || a.name.localeCompare(b.name, "ru")
    ));
  }, [deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, needsReportRows]);
  const reportPtoIndexes = useMemo(() => (
    needsReportIndexes
      ? {
        plan: buildReportPtoIndex(deferredPtoPlanRows, { includeCustomerCode: true }),
        survey: buildReportPtoIndex(deferredPtoSurveyRows),
        oper: buildReportPtoIndex(deferredPtoOperRows),
      }
      : null
  ), [deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, needsReportIndexes]);

  const derivedReportRows = useMemo(() => (
    needsAutoReportRows && reportPtoIndexes ? reportBaseRows.map((row) => {
      const derivedRow = deriveReportRowFromPtoIndex(row, reportDate, reportPtoIndexes.plan, reportPtoIndexes.survey, reportPtoIndexes.oper);
      const rowKey = reportRowKey(row);
      const dayReason = reportReasons[reportReasonEntryKey(reportDate, rowKey)] ?? derivedRow.dayReason;
      const yearDelta = delta(derivedRow.yearPlan, reportYearFact(derivedRow));
      const accumulationStartDate = yearDelta < 0
        ? reportReasonAccumulationStartDateFromIndexes(row, reportDate, reportPtoIndexes.plan, reportPtoIndexes.survey, reportPtoIndexes.oper)
        : reportDate;
      const fallbackYearReason = accumulationStartDate === `${reportDate.slice(0, 4)}-01-01`
        ? derivedRow.yearReason
        : "";
      const yearReason = yearDelta < 0
        ? reportYearReasonValue(reportReasons, rowKey, reportDate, fallbackYearReason, accumulationStartDate)
        : "";

      return {
        ...derivedRow,
        dayReason,
        yearReason,
      };
    }) : []
  ), [needsAutoReportRows, reportBaseRows, reportDate, reportPtoIndexes, reportReasons]);

  const activeReportCustomer = useMemo(() => (
    reportCustomers.find((customer) => customer.id === reportCustomerId)
    ?? reportCustomers.find((customer) => customer.visible)
    ?? reportCustomers[0]
    ?? defaultReportCustomers[0]
  ), [reportCustomerId, reportCustomers]);

  const activeAdminReportCustomer = useMemo(() => (
    reportCustomers.find((customer) => customer.id === adminReportCustomerId)
    ?? reportCustomers[0]
    ?? defaultReportCustomers[0]
  ), [adminReportCustomerId, reportCustomers]);
  const adminReportBaseRows = useMemo(() => (
    needsAdminReportRows ? sortReportRowsByAreaOrder(reportBaseRows, reportAreaOrder, reportWorkOrder) : []
  ), [needsAdminReportRows, reportAreaOrder, reportBaseRows, reportWorkOrder]);
  const derivedReportRowsByKey = useMemo(() => (
    new Map(derivedReportRows.map((row) => [reportRowKey(row), row]))
  ), [derivedReportRows]);
  const reportAutoRowKeysForCustomer = useCallback((customer: ReportCustomerConfig) => (
    new Set(
      reportRowsForCustomer(derivedReportRows, customer)
        .filter(reportRowHasAutoShowData)
        .map(reportRowKey),
    )
  ), [derivedReportRows]);
  const activeAdminReportBaseRows = useMemo(() => (
    needsAdminReportRows
      ? sortReportRowsByAreaOrder(
        reportRowsForCustomer(adminReportBaseRows, activeAdminReportCustomer),
        activeAdminReportCustomer.areaOrder,
        activeAdminReportCustomer.workOrder,
      )
      : []
  ), [activeAdminReportCustomer, adminReportBaseRows, needsAdminReportRows]);
  const activeAdminAutoReportRowKeys = useMemo(() => (
    needsAdminReportRows ? reportAutoRowKeysForCustomer(activeAdminReportCustomer) : new Set<string>()
  ), [activeAdminReportCustomer, needsAdminReportRows, reportAutoRowKeysForCustomer]);
  const activeAdminReportVisibleRowKeys = useMemo(() => (
    reportCustomerEffectiveRowKeys(activeAdminReportCustomer, activeAdminAutoReportRowKeys)
  ), [activeAdminAutoReportRowKeys, activeAdminReportCustomer]);
  const activeAdminReportSummarySourceRowKeys = useMemo(() => new Set(
    activeAdminReportCustomer.summaryRows.flatMap((summary) => [
      ...summary.rowKeys,
      ...(summary.planRowKey?.trim() ? [summary.planRowKey] : []),
    ]),
  ), [activeAdminReportCustomer.summaryRows]);
  const activeAdminReportVisibleRows = useMemo(() => (
    activeAdminReportBaseRows.filter((row) => {
      const rowKey = reportRowKey(row);
      return activeAdminReportVisibleRowKeys.has(rowKey) && !activeAdminReportSummarySourceRowKeys.has(rowKey);
    })
  ), [activeAdminReportBaseRows, activeAdminReportSummarySourceRowKeys, activeAdminReportVisibleRowKeys]);
  const activeAdminReportOrderRows = useMemo(() => {
    if (!needsAdminReportRows) return [];

    const rowsByKey = new Map(activeAdminReportBaseRows.map((row) => [reportRowKey(row), row]));
    const summaryRows = reportCustomerUsesSummaryRows(activeAdminReportCustomer)
      ? activeAdminReportCustomer.summaryRows.flatMap((summary) => {
        const sourceRows = summary.rowKeys
          .map((key) => rowsByKey.get(key))
          .filter((row): row is ReportRow => Boolean(row));
        const planSourceRow = summary.planRowKey ? rowsByKey.get(summary.planRowKey) : undefined;
        const summaryRow = createReportSummaryRow(summary, sourceRows, planSourceRow);
        return summaryRow ? [summaryRow] : [];
      })
      : [];

    return sortReportRowsByAreaOrder(
      [...activeAdminReportVisibleRows, ...summaryRows],
      activeAdminReportCustomer.areaOrder,
      activeAdminReportCustomer.workOrder,
    );
  }, [activeAdminReportBaseRows, activeAdminReportCustomer, activeAdminReportVisibleRows, needsAdminReportRows]);
  const activeAdminReportAreaOptions = useMemo(() => (
    needsAdminReportRows
      ? sortAreaNamesByOrder(
        uniqueSorted(activeAdminReportOrderRows.map((row) => row.area).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))),
        activeAdminReportCustomer.areaOrder,
      )
      : []
  ), [activeAdminReportCustomer.areaOrder, activeAdminReportOrderRows, needsAdminReportRows]);
  const activeAdminReportSummaryAreaOptions = useMemo(() => (
    needsAdminReportRows
      ? sortAreaNamesByOrder(
        uniqueSorted(activeAdminReportBaseRows.map((row) => row.area).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))),
        activeAdminReportCustomer.areaOrder,
      )
      : []
  ), [activeAdminReportBaseRows, activeAdminReportCustomer.areaOrder, needsAdminReportRows]);
  const activeAdminReportRowsByKey = useMemo(() => (
    new Map(activeAdminReportBaseRows.map((row) => [reportRowKey(row), row]))
  ), [activeAdminReportBaseRows]);
  const editingReportFactSourceRow = useMemo(() => (
    editingReportFactSourceRowKey
      ? activeAdminReportRowsByKey.get(editingReportFactSourceRowKey) ?? null
      : null
  ), [activeAdminReportRowsByKey, editingReportFactSourceRowKey]);
  const editingReportFactSourceOptions = useMemo(() => {
    if (!editingReportFactSourceRow) return [];

    const areaKey = normalizeLookupValue(editingReportFactSourceRow.area);
    return activeAdminReportBaseRows.filter((row) => normalizeLookupValue(row.area) === areaKey);
  }, [activeAdminReportBaseRows, editingReportFactSourceRow]);

  const adminReportWorkOrderGroups = useMemo(() => (
    needsAdminReportRows
      ? activeAdminReportAreaOptions.map((area) => ({
        area,
        rows: sortReportRowsByAreaOrder(
          activeAdminReportOrderRows.filter((row) => normalizeLookupValue(row.area) === normalizeLookupValue(area)),
          [area],
          activeAdminReportCustomer.workOrder,
        ),
      }))
      : []
  ), [activeAdminReportAreaOptions, activeAdminReportCustomer.workOrder, activeAdminReportOrderRows, needsAdminReportRows]);

  const activeAdminReportSelectedCount = useMemo(() => (
    needsAdminReportRows ? activeAdminReportVisibleRows.length : 0
  ), [activeAdminReportVisibleRows, needsAdminReportRows]);
  const activeAdminReportRowLabelEntries = useMemo(() => (
    needsAdminReportRows
      ? Object.entries(activeAdminReportCustomer.rowLabels).flatMap(([rowKey, label]) => {
        const row = activeAdminReportRowsByKey.get(rowKey);
        return row ? [{ rowKey, label, row }] : [];
      })
      : []
  ), [activeAdminReportCustomer, activeAdminReportRowsByKey, needsAdminReportRows]);
  const activeAdminReportUsesSummaryRows = reportCustomerUsesSummaryRows(activeAdminReportCustomer);
  const visibleAdminReportCustomerSettingsTab: AdminReportCustomerSettingsTab = activeAdminReportUsesSummaryRows || adminReportCustomerSettingsTab !== "summary"
    ? adminReportCustomerSettingsTab
    : "display";

  const customerReportRows = useMemo(() => {
    if (!needsDerivedReportRows) return [];

    const rawCustomerRows = reportRowsForCustomer(derivedReportRows, activeReportCustomer);
    const customerRows = applyReportFactSourceRows(rawCustomerRows, activeReportCustomer.factSourceRowKeys);
    const customerAutoRowKeys = new Set(customerRows.filter(reportRowHasAutoShowData).map(reportRowKey));
    const visibleRowKeys = reportCustomerEffectiveRowKeys(activeReportCustomer, customerAutoRowKeys);
    const summarySourceRowKeys = new Set(
      activeReportCustomer.summaryRows.flatMap((summary) => [
        ...summary.rowKeys,
        ...(summary.planRowKey?.trim() ? [summary.planRowKey] : []),
      ]),
    );
    const selectedRows = customerRows
      .filter((row) => {
        const rowKey = reportRowKey(row);
        return visibleRowKeys.has(rowKey) && !summarySourceRowKeys.has(rowKey);
      })
      .map((row) => {
        const rowKey = reportRowKey(row);
        const customerLabel = activeReportCustomer.rowLabels[rowKey]?.trim();

        return customerLabel ? { ...row, name: customerLabel, displayKey: rowKey } : row;
      });
    const rowsByKey = new Map(customerRows.map((row) => [reportRowKey(row), row]));
    const summaryRows = reportCustomerUsesSummaryRows(activeReportCustomer)
      ? activeReportCustomer.summaryRows.flatMap((summary) => {
        const sourceRows = summary.rowKeys
          .map((key) => rowsByKey.get(key))
          .filter((row): row is ReportRow => Boolean(row));
        const planSourceRow = summary.planRowKey ? rowsByKey.get(summary.planRowKey) : undefined;
        const summaryRow = createReportSummaryRow(summary, sourceRows, planSourceRow);
        return summaryRow ? [summaryRow] : [];
      })
      : [];

    return sortReportRowsByAreaOrder([...selectedRows, ...summaryRows], activeReportCustomer.areaOrder, activeReportCustomer.workOrder);
  }, [activeReportCustomer, derivedReportRows, needsDerivedReportRows]);

  const reportAreaTabs = useMemo(() => [
    "Все участки",
    ...(
      needsDerivedReportRows
        ? sortAreaNamesByOrder(
            uniqueSorted(customerReportRows.map((row) => row.area).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))),
            activeReportCustomer.areaOrder,
          )
        : []
    ),
  ], [activeReportCustomer.areaOrder, customerReportRows, needsDerivedReportRows]);

  const areaShiftScheduleAreas = useMemo(() => {
    const allAreas = uniqueSorted([
      defaultAreaShiftScheduleArea,
      ...Object.keys(areaShiftCutoffs),
      ...reportBaseRows.map((row) => cleanAreaName(row.area)),
      ...deferredPtoPlanRows.map((row) => cleanAreaName(row.area)),
      ...deferredPtoOperRows.map((row) => cleanAreaName(row.area)),
      ...deferredPtoSurveyRows.map((row) => cleanAreaName(row.area)),
      ...deferredVehicleRows.map((row) => cleanAreaName(row.area)),
    ].filter((area) => area && normalizeLookupValue(area) !== normalizeLookupValue("РС‚РѕРіРѕ")));
    const customAreas = allAreas.filter((area) => normalizeLookupValue(area) !== normalizeLookupValue(defaultAreaShiftScheduleArea));

    return [
      defaultAreaShiftScheduleArea,
      ...sortAreaNamesByOrder(customAreas, reportAreaOrder),
    ];
  }, [areaShiftCutoffs, deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, deferredVehicleRows, reportAreaOrder, reportBaseRows]);

  const filteredReports = useMemo(() => {
    if (!needsDerivedReportRows) return [];
    if (reportArea === "Все участки") return customerReportRows;

    return customerReportRows.filter((row) => normalizeLookupValue(row.area) === normalizeLookupValue(reportArea));
  }, [customerReportRows, needsDerivedReportRows, reportArea]);

  const filteredReportAreaGroups = useMemo(() => {
    if (!needsDerivedReportRows) return [];

    const groups: Array<{ area: string; rows: ReportRow[] }> = [];
    let index = 0;

    while (index < filteredReports.length) {
      const currentArea = normalizeLookupValue(filteredReports[index].area);
      let nextIndex = index + 1;

      while (nextIndex < filteredReports.length && normalizeLookupValue(filteredReports[nextIndex].area) === currentArea) {
        nextIndex += 1;
      }

      groups.push({
        area: filteredReports[index].area,
        rows: filteredReports.slice(index, nextIndex),
      });

      index = nextIndex;
    }

    return groups;
  }, [filteredReports, needsDerivedReportRows]);

  const reportColumnTextValue = useCallback((key: ReportColumnKey, row: ReportRow) => {
    const monthFact = reportMonthFact(row);
    const yearFact = reportYearFact(row);
    const annualFact = reportAnnualFact(row);

    switch (key) {
      case "area":
        return row.area;
      case "work-name":
        return row.name;
      case "unit":
        return row.unit;
      case "day-plan":
        return formatNumber(row.dayPlan);
      case "day-fact":
        return formatNumber(row.dayFact);
      case "day-delta":
        return formatNumber(delta(row.dayPlan, row.dayFact));
      case "day-productivity":
        return `${formatNumber(row.dayProductivity || row.dayFact)}\n${formatPercent(row.dayFact, row.dayPlan)}`;
      case "day-reason":
        return reportReason(row.dayFact, row.dayPlan, row.dayReason);
      case "month-total-plan":
        return formatNumber(row.monthTotalPlan);
      case "month-plan":
        return formatNumber(row.monthPlan);
      case "month-fact":
        return `${formatNumber(monthFact)}\nмарк ${formatNumber(row.monthSurveyFact)}`;
      case "month-delta":
        return formatNumber(delta(row.monthPlan, monthFact));
      case "month-productivity":
        return `${formatNumber(row.monthProductivity || monthFact)}\n${formatPercent(monthFact, row.monthPlan)}`;
      case "year-plan":
        return formatNumber(row.yearPlan);
      case "year-fact":
        return `${formatNumber(yearFact)}\nмарк ${formatNumber(row.yearSurveyFact)}`;
      case "year-delta":
        return formatNumber(delta(row.yearPlan, yearFact));
      case "year-reason":
        return delta(row.yearPlan, yearFact) < 0 ? row.yearReason : "";
      case "annual-plan":
        return formatNumber(row.annualPlan);
      case "annual-fact":
        return formatNumber(annualFact);
      case "annual-remaining":
        return formatNumber(delta(row.annualPlan, annualFact));
      default:
        return "";
    }
  }, []);

  const visibleReportColumnKeys = useMemo(() => (
    normalizeLookupValue(reportArea) === normalizeLookupValue("Все участки")
      ? reportColumnKeys.filter((key) => key !== "day-productivity" && key !== "month-productivity")
      : reportColumnKeys
  ), [reportArea]);

  const autoReportColumnWidths = useMemo(() => (
    Object.fromEntries(visibleReportColumnKeys.map((key) => {
      const defaultIndex = reportColumnKeys.indexOf(key);
      if (!needsDerivedReportRows) return [key, defaultReportColumnWidths[defaultIndex] ?? 80];

      const header = reportHeaderLabels[key]?.trim() || reportColumnHeaderFallbacks[key];
      const values = filteredReports.map((row) => reportColumnTextValue(key, row));
      return [key, reportAutoColumnWidth(key, header, values)];
    })) as Record<ReportColumnKey, number>
  ), [filteredReports, needsDerivedReportRows, reportColumnTextValue, reportHeaderLabels, visibleReportColumnKeys]);

  const reportTableColumnWidths = useMemo(() => (
    visibleReportColumnKeys.map((key) => {
      const defaultIndex = reportColumnKeys.indexOf(key);
      const autoWidth = autoReportColumnWidths[key] ?? defaultReportColumnWidths[defaultIndex] ?? 80;
      if (reportCompactColumnKeys.has(key)) return autoWidth;

      return Math.min(520, Math.max(autoWidth, Math.round(reportColumnWidths[key] ?? 0)));
    })
  ), [autoReportColumnWidths, reportColumnWidths, visibleReportColumnKeys]);
  const reportColumnWidthByKey = useMemo(() => (
    new Map(visibleReportColumnKeys.map((key, index) => [key, reportTableColumnWidths[index]]))
  ), [reportTableColumnWidths, visibleReportColumnKeys]);
  const reportMonthEnd = `${reportDate.slice(0, 8)}${new Date(Number(reportDate.slice(0, 4)), Number(reportDate.slice(5, 7)), 0).getDate()}`;
  const reportCompletionCards = useMemo(() => {
    if (!needsDerivedReportRows) return [];
    if (reportArea === "Все участки") return [];

    const plan = filteredReports.reduce((sum, row) => sum + row.monthPlan, 0);
    const monthPlan = filteredReports.reduce((sum, row) => sum + row.monthTotalPlan, 0);
    const fact = filteredReports.reduce((sum, row) => sum + reportMonthFact(row), 0);
    const percent = plan ? Math.round((fact / plan) * 100) : fact ? 100 : 0;
    const lag = Math.max(plan - fact, 0);
    const remainingDays = Math.max(Number(reportMonthEnd.slice(8, 10)) - Number(reportDate.slice(8, 10)), 0);
    const overPlanPerDay = remainingDays ? Math.ceil(lag / remainingDays) : lag;

    return [{
      fact,
      lag,
      monthPlan,
      overPlanPerDay,
      percent,
      plan,
      remainingDays,
      title: reportArea,
    }];
  }, [filteredReports, needsDerivedReportRows, reportArea, reportDate, reportMonthEnd]);

  useEffect(() => {
    const visibleCustomers = reportCustomers.filter((customer) => customer.visible);
    if (visibleCustomers.some((customer) => customer.id === reportCustomerId)) return;
    setReportCustomerId(visibleCustomers[0]?.id ?? reportCustomers[0]?.id ?? defaultReportCustomerId);
  }, [reportCustomerId, reportCustomers]);

  useEffect(() => {
    if (reportAreaTabs.some((area) => normalizeLookupValue(area) === normalizeLookupValue(reportArea))) return;
    setReportArea("Все участки");
  }, [reportArea, reportAreaTabs]);

  const isPtoSection = renderedTopTab === "pto";
  const isPtoDateTab = isPtoSection && ["plan", "oper", "survey"].includes(ptoTab);
  const isPtoBucketsSection = renderedTopTab === "pto" && ptoTab === "buckets";
  const activePtoDateRows = useMemo(() => {
    if (!isPtoSection) return [];
    if (ptoTab === "plan") return ptoPlanRows;
    if (ptoTab === "oper") return ptoOperRows;
    if (ptoTab === "survey") return ptoSurveyRows;
    return [];
  }, [isPtoSection, ptoOperRows, ptoPlanRows, ptoSurveyRows, ptoTab]);
  const allPtoDateRows = useMemo(() => (
    isPtoBucketsSection ? [...deferredPtoPlanRows, ...deferredPtoSurveyRows, ...deferredPtoOperRows] : activePtoDateRows
  ), [activePtoDateRows, deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, isPtoBucketsSection]);
  const ptoYearTabs = useMemo(() => (
    isPtoDateTab ? ptoYearOptions(activePtoDateRows, ptoPlanYear, ptoManualYears) : [ptoPlanYear]
  ), [activePtoDateRows, isPtoDateTab, ptoManualYears, ptoPlanYear]);
  const ptoYearMonths = useMemo(() => yearMonths(ptoPlanYear), [ptoPlanYear]);
  const ptoMonthGroups = useMemo(() => (
    ptoYearMonths.map((month) => ({
      month,
      label: formatMonthName(month),
      days: monthDays(month),
      expanded: expandedPtoMonths[month] === true,
    }))
  ), [expandedPtoMonths, ptoYearMonths]);
  const ptoAreaTabs = useMemo(() => (
    isPtoSection
      ? [
    "Все участки",
    ...uniqueSorted([
      ...allPtoDateRows.map((row) => cleanAreaName(row.area)),
      ...(isPtoBucketsSection ? ptoBucketManualRows.map((row) => cleanAreaName(row.area)) : []),
    ]),
      ]
      : ["Все участки"]
  ), [allPtoDateRows, isPtoBucketsSection, isPtoSection, ptoBucketManualRows]);
  const ptoDateOptionMaps = useMemo(() => {
    const allAreasKey = "__all__";
    const locationsByArea = new Map<string, Set<string>>();
    const structuresByArea = new Map<string, Set<string>>();
    const structuresByAreaLocation = new Map<string, Set<string>>();
    const addValue = (map: Map<string, Set<string>>, key: string, value: string) => {
      const text = value.trim();
      if (!text) return;

      const values = map.get(key) ?? new Set<string>();
      values.add(text);
      map.set(key, values);
    };

    if (!isPtoDateTab) {
      return {
        allAreasKey,
        locationsByArea: new Map<string, string[]>(),
        structuresByArea: new Map<string, string[]>(),
        structuresByAreaLocation: new Map<string, string[]>(),
      };
    }

    activePtoDateRows.forEach((row) => {
      const area = cleanAreaName(row.area).trim();
      const areaKey = normalizeLookupValue(area);
      const location = row.location.trim();
      const structure = row.structure.trim();
      const areaKeys = [allAreasKey, areaKey].filter(Boolean);

      areaKeys.forEach((key) => {
        addValue(locationsByArea, key, location);
        addValue(structuresByArea, key, structure);
        addValue(structuresByAreaLocation, `${key}:${normalizeLookupValue(location)}`, structure);
      });
    });

    const normalizeMap = (map: Map<string, Set<string>>) => new Map(
      Array.from(map.entries()).map(([key, values]) => [key, uniqueSorted(Array.from(values))] as const),
    );

    return {
      allAreasKey,
      locationsByArea: normalizeMap(locationsByArea),
      structuresByArea: normalizeMap(structuresByArea),
      structuresByAreaLocation: normalizeMap(structuresByAreaLocation),
    };
  }, [activePtoDateRows, isPtoDateTab]);

  const ptoBucketRows = useMemo<PtoBucketRow[]>(() => {
    if (!isPtoBucketsSection) return [];

    return createPtoBucketRows(allPtoDateRows, ptoBucketManualRows, ptoAreaFilter);
  }, [allPtoDateRows, isPtoBucketsSection, ptoAreaFilter, ptoBucketManualRows]);
  const ptoBucketColumns = useMemo<PtoBucketColumn[]>(() => {
    if (!isPtoBucketsSection) return [];

    return createPtoBucketColumns(deferredVehicleRows);
  }, [deferredVehicleRows, isPtoBucketsSection]);

  const isAdminVehiclesSection = renderedTopTab === "admin" && adminSection === "vehicles";

  useEffect(() => {
    if (!isAdminVehiclesSection && adminVehiclesEditing) {
      setAdminVehiclesEditing(false);
    }

    if (!isAdminVehiclesSection && showAllVehicleRows) {
      setShowAllVehicleRows(false);
    }
  }, [adminVehiclesEditing, isAdminVehiclesSection, showAllVehicleRows]);

  useEffect(() => {
    setShowAllVehicleRows(false);
  }, [vehicleFilters]);

  const vehicleAutocompleteOptions = useMemo(() => (
    isAdminVehiclesSection && adminVehiclesEditing
      ? Object.fromEntries(
          vehicleFilterColumns
            .filter((column) => vehicleAutocompleteFilterKeys.includes(column.key))
            .map((column) => [column.key, createVehicleFilterOptions(deferredVehicleRows, column)]),
        ) as Partial<Record<VehicleFilterKey, string[]>>
      : {}
  ), [adminVehiclesEditing, deferredVehicleRows, isAdminVehiclesSection]);

  const activeVehicleFilterOptions = useMemo(() => {
    if (!isAdminVehiclesSection || !openVehicleFilter) return [];

    const column = vehicleFilterColumns.find((item) => item.key === openVehicleFilter);
    if (!column) return [];

      const rowsForColumn = deferredVehicleRows.filter((vehicle) => vehicleMatchesFilters(vehicle, vehicleFilters, vehicleFilterColumns, column.key));
    const options = createVehicleFilterOptions(rowsForColumn, column);
    const selectedValues = vehicleFilters[column.key] ?? [];

    return Array.from(new Set([...options, ...selectedValues]))
      .sort((a, b) => vehicleFilterOptionLabel(a).localeCompare(vehicleFilterOptionLabel(b), "ru"));
  }, [deferredVehicleRows, isAdminVehiclesSection, openVehicleFilter, vehicleFilters]);

  const filteredVehicleRows = useMemo(() => (
    isAdminVehiclesSection
      ? vehicleRows.filter((vehicle) => vehicleMatchesFilters(vehicle, vehicleFilters, vehicleFilterColumns))
      : []
  ), [isAdminVehiclesSection, vehicleFilters, vehicleRows]);

  useEffect(() => {
    if (!isAdminVehiclesSection || showAllVehicleRows) return undefined;

    const updateVehiclePreviewLimit = () => {
      const tableScroll = adminVehicleTableScrollRef.current;
      if (!tableScroll) return;

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const tableTop = tableScroll.getBoundingClientRect().top;
      const headerHeight = tableScroll.querySelector("thead")?.getBoundingClientRect().height ?? 30;
      const firstRowHeight = tableScroll.querySelector("tbody tr")?.getBoundingClientRect().height ?? 28;
      const availableRowsHeight = viewportHeight - tableTop - headerHeight - adminVehicleViewportBottomReserve;
      const nextLimit = Math.max(adminVehicleMinPreviewRows, Math.floor(availableRowsHeight / Math.max(1, firstRowHeight)));
      const boundedLimit = Math.max(
        adminVehicleMinPreviewRows,
        Math.min(filteredVehicleRows.length || adminVehicleFallbackPreviewRows, nextLimit),
      );

      setVehiclePreviewRowLimit((current) => (current === boundedLimit ? current : boundedLimit));
    };

    const frame = window.requestAnimationFrame(updateVehiclePreviewLimit);
    window.addEventListener("resize", updateVehiclePreviewLimit);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateVehiclePreviewLimit);
    };
  }, [adminVehiclesEditing, filteredVehicleRows.length, isAdminVehiclesSection, showAllVehicleRows]);

  const visibleVehicleRows = showAllVehicleRows
    ? filteredVehicleRows
    : filteredVehicleRows.slice(0, vehiclePreviewRowLimit);
  const hiddenVehicleRowsCount = Math.max(filteredVehicleRows.length - visibleVehicleRows.length, 0);

  const activeVehicleFilterCount = useMemo(() => (
    Object.values(vehicleFilters).filter((values) => values !== undefined).length
  ), [vehicleFilters]);

  const filteredDispatch = useMemo(() => {
    if (renderedTopTab !== "dispatch") return [];

    return vehicleRows.filter((v) => {
      if (v.visible === false) return false;
      const areaOk = areaFilter === "Все участки" || v.area === areaFilter;
      const q = search.trim().toLowerCase();
      const textOk = q === "" || [buildVehicleDisplayName(v), v.area, v.location, v.workType, v.excavator].join(" ").toLowerCase().includes(q);
      return areaOk && textOk;
    });
  }, [areaFilter, renderedTopTab, search, vehicleRows]);

  const currentDispatchShift = dispatchShiftFromTab(dispatchTab);
  const isDailyDispatchShift = currentDispatchShift === "daily";
  const dispatchAreaOptions = useMemo(() => [
    "Все участки",
    ...(renderedTopTab === "dispatch"
      ? uniqueSorted([
          ...vehicleRows.map((vehicle) => vehicle.area),
          ...dispatchSummaryRows.map((row) => row.area),
          ...reportBaseRows.map((row) => row.area),
        ]).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))
      : []),
  ], [dispatchSummaryRows, renderedTopTab, reportBaseRows, vehicleRows]);
  const dispatchVehicleOptions = useMemo(() => (
    renderedTopTab === "dispatch"
      ? vehicleRows
          .filter((vehicle) => vehicle.visible !== false)
          .sort((left, right) => buildVehicleDisplayName(left).localeCompare(buildVehicleDisplayName(right), "ru"))
      : []
  ), [renderedTopTab, vehicleRows]);
  const dispatchLocationOptions = useMemo(() => uniqueSorted([
    ...(renderedTopTab === "dispatch" ? vehicleRows.map((vehicle) => vehicle.location) : []),
    ...(renderedTopTab === "dispatch" ? dispatchSummaryRows.map((row) => row.location) : []),
  ]), [dispatchSummaryRows, renderedTopTab, vehicleRows]);
  const dispatchWorkTypeOptions = useMemo(() => uniqueSorted([
    ...(renderedTopTab === "dispatch" ? vehicleRows.map((vehicle) => vehicle.workType) : []),
    ...(renderedTopTab === "dispatch" ? dispatchSummaryRows.map((row) => row.workType) : []),
    ...(renderedTopTab === "dispatch" ? reportBaseRows.map((row) => row.name) : []),
  ]), [dispatchSummaryRows, renderedTopTab, reportBaseRows, vehicleRows]);
  const dispatchExcavatorOptions = useMemo(() => uniqueSorted([
    ...(renderedTopTab === "dispatch" ? vehicleRows.map((vehicle) => vehicle.excavator) : []),
    ...(renderedTopTab === "dispatch" ? dispatchSummaryRows.map((row) => row.excavator) : []),
  ]), [dispatchSummaryRows, renderedTopTab, vehicleRows]);
  const currentDispatchSummaryRows = useMemo(() => (
    renderedTopTab !== "dispatch"
      ? []
      : isDailyDispatchShift
      ? consolidateDispatchSummaryRows(dispatchSummaryRows, reportDate)
      : dispatchSummaryRows.filter((row) => row.date === reportDate && row.shift === currentDispatchShift)
  ), [currentDispatchShift, dispatchSummaryRows, isDailyDispatchShift, renderedTopTab, reportDate]);
  const filteredDispatchSummaryRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return currentDispatchSummaryRows.filter((row) => {
      const areaOk = areaFilter === "Все участки" || normalizeLookupValue(row.area) === normalizeLookupValue(areaFilter);
      const textOk = normalizedSearch === "" || [
        row.vehicleName,
        row.area,
        row.location,
        row.workType,
        row.excavator,
        row.reason,
        row.comment,
      ].join(" ").toLowerCase().includes(normalizedSearch);

      return areaOk && textOk;
    });
  }, [areaFilter, currentDispatchSummaryRows, search]);
  const dispatchSummaryTotals = useMemo(() => {
    const totals = filteredDispatchSummaryRows.reduce((result, row) => ({
      plan: result.plan + row.planVolume,
      fact: result.fact + row.factVolume,
      workHours: result.workHours + row.workHours,
      repairHours: result.repairHours + row.repairHours,
      downtimeHours: result.downtimeHours + row.downtimeHours,
      trips: result.trips + row.trips,
    }), {
      plan: 0,
      fact: 0,
      workHours: 0,
      repairHours: 0,
      downtimeHours: 0,
      trips: 0,
    });
    const delta = totals.fact - totals.plan;
    const percent = totals.plan > 0 ? Math.round((totals.fact / totals.plan) * 100) : totals.fact > 0 ? 100 : 0;
    const productivity = totals.workHours > 0 ? totals.fact / totals.workHours : 0;

    return { ...totals, delta, percent, productivity };
  }, [filteredDispatchSummaryRows]);
  const dispatchAiSuggestion = useMemo(() => (
    buildDispatchAiSuggestion(filteredDispatchSummaryRows)
  ), [filteredDispatchSummaryRows]);

  const filteredFleet = useMemo(() => {
    if (renderedTopTab !== "fleet") return [];

    return vehicleRows.filter((v) => {
      if (v.visible === false) return false;
      switch (fleetTab) {
        case "rent":
          return v.rent > 0;
        case "work":
          return v.work > 0;
        case "idle":
          return v.downtime > 0;
        case "repair":
          return v.repair > 0;
        case "free":
          return !v.active || (v.work === 0 && v.rent === 0 && v.repair === 0 && v.downtime === 0);
        default:
          return true;
      }
    });
  }, [fleetTab, renderedTopTab, vehicleRows]);

  const activeCustomTab = customTabs.find((tab) => tab.visible !== false && customTabKey(tab.id) === renderedTopTab);
  const activeDispatchSubtab = subTabs.dispatch.find((tab) => tab.value === dispatchTab);
  const activeFleetSubtab = subTabs.fleet.find((tab) => tab.value === fleetTab);
  const activeContractorSubtab = subTabs.contractors.find((tab) => tab.value === contractorTab);
  const activeFuelSubtab = subTabs.fuel.find((tab) => tab.value === fuelTab);
  const activePtoSubtab = subTabs.pto.find((tab) => tab.value === ptoTab);
  const activeTbSubtab = subTabs.tb.find((tab) => tab.value === tbTab);
  const lastChangeLog = adminLogs.find((log) => ["Редактирование", "Добавление", "Удаление"].includes(log.action));
  const lastUploadLog = adminLogs.find((log) => log.action === "Загрузка");
  const headerHasSubtabs = topTab === "reports" || topTab === "dispatch" || topTab === "pto" || topTab === "admin";
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

  useEffect(() => {
    if (renderedTopTab === "pto" && isPtoDateTab) return;

    setPtoDateEditing(false);
    setDraggedPtoRowId(null);
    setPtoDropTarget(null);
    setPtoFormulaCell(null);
    setPtoInlineEditCell(null);
    setPtoSelectedCellKeys([]);
  }, [isPtoDateTab, renderedTopTab]);

  useEffect(() => {
    if (!headerHasSubtabs) {
      setHeaderSubtabsOffset(0);
      return;
    }

    const measureHeaderSubtabs = () => {
      const nav = headerNavRef.current;
      const activeTab = activeHeaderTabRef.current;
      const subtabs = headerSubtabsRef.current;
      if (!nav || !activeTab || !subtabs) return;

      const navRect = nav.getBoundingClientRect();
      const activeRect = activeTab.getBoundingClientRect();
      const subtabsRect = subtabs.getBoundingClientRect();
      const desiredLeft = activeRect.left - navRect.left + activeRect.width / 2 - subtabsRect.width / 2;
      const maxLeft = Math.max(0, navRect.width - subtabsRect.width);
      const nextLeft = Math.round(Math.min(maxLeft, Math.max(0, desiredLeft)));

      setHeaderSubtabsOffset((current) => (current === nextLeft ? current : nextLeft));
    };

    const frame = window.requestAnimationFrame(measureHeaderSubtabs);
    window.addEventListener("resize", measureHeaderSubtabs);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureHeaderSubtabs);
    };
  }, [adminSection, dispatchTab, headerHasSubtabs, ptoTab, reportCustomerId, reportCustomers, subTabs.dispatch, subTabs.pto, topTab]);

  function selectTopTab(tab: TopTab) {
    setTopTab(tab);
  }

  function selectPtoTab(tab: string) {
    startTransition(() => {
      setPtoTab(tab);
    });
  }

  function selectPtoPlanYear(year: string) {
    setPtoPlanYear(year);
  }

  function selectPtoArea(area: string) {
    setPtoAreaFilter(area);
  }

  function selectReportDate(value: string) {
    if (!isStoredReportDateValue(value)) return;

    setReportDate(value);
    setHasManualReportDateOverride(true);
    window.localStorage.setItem(reportDateOverrideStorageKey, value);
  }

  function updateAreaShiftCutoff(area: string, value: string) {
    if (!isValidAreaShiftCutoffTime(value)) return;

    setAreaShiftCutoffs((current) => ({
      ...current,
      [area]: value,
    }));
  }

  function addDispatchSummaryRow(vehicle?: VehicleRow) {
    if (isDailyDispatchShift) return;

    const nextRow = createDispatchSummaryRow(vehicle, reportDate, currentDispatchShift);
    setDispatchSummaryRows((current) => [nextRow, ...current]);
    setDispatchVehicleToAddId("");
    addAdminLog({
      action: "Добавление",
      section: "Диспетчерская сводка",
      details: vehicle
        ? `Добавлена техника в сводку: ${buildVehicleDisplayName(vehicle)}.`
        : "Добавлена пустая строка сводки.",
    });
  }

  function addSelectedDispatchVehicle() {
    const selectedVehicleId = Number(dispatchVehicleToAddId);
    const selectedVehicle = dispatchVehicleOptions.find((vehicle) => vehicle.id === selectedVehicleId);
    addDispatchSummaryRow(selectedVehicle);
  }

  function addFilteredVehiclesToDispatchSummary() {
    if (isDailyDispatchShift) return;

    const existingVehicleIds = new Set(
      currentDispatchSummaryRows
        .map((row) => row.vehicleId)
        .filter((id): id is number => typeof id === "number"),
    );
    const rowsToAdd = filteredDispatch.filter((vehicle) => !existingVehicleIds.has(vehicle.id));

    if (rowsToAdd.length === 0) {
      window.alert("В выбранной дате и смене уже есть строки по текущему фильтру.");
      return;
    }

    setDispatchSummaryRows((current) => [
      ...rowsToAdd.map((vehicle) => createDispatchSummaryRow(vehicle, reportDate, currentDispatchShift)),
      ...current,
    ]);
    addAdminLog({
      action: "Добавление",
      section: "Диспетчерская сводка",
      details: `Добавлены строки из списка техники: ${rowsToAdd.length}.`,
      rowsCount: rowsToAdd.length,
    });
  }

  function updateDispatchSummaryText(id: string, field: DispatchSummaryTextField, value: string) {
    if (isDailyDispatchShift) return;

    setDispatchSummaryRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: value } : row
    )));
  }

  function updateDispatchSummaryNumber(id: string, field: DispatchSummaryNumberField, value: string) {
    if (isDailyDispatchShift) return;

    setDispatchSummaryRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: parseDecimalValue(value) } : row
    )));
  }

  function updateDispatchSummaryVehicle(id: string, vehicleIdValue: string) {
    if (isDailyDispatchShift) return;

    const vehicleId = Number(vehicleIdValue);
    const vehicle = dispatchVehicleOptions.find((item) => item.id === vehicleId);

    setDispatchSummaryRows((current) => current.map((row) => {
      if (row.id !== id) return row;
      if (!vehicle) return { ...row, vehicleId: null, vehicleName: "" };

      const nextVehicleRow = createDispatchSummaryRow(vehicle, row.date, row.shift, row.id);
      return {
        ...row,
        vehicleId: vehicle.id,
        vehicleName: nextVehicleRow.vehicleName,
        area: nextVehicleRow.area,
        location: nextVehicleRow.location,
        workType: nextVehicleRow.workType,
        excavator: nextVehicleRow.excavator,
        planVolume: nextVehicleRow.planVolume,
        factVolume: nextVehicleRow.factVolume,
        workHours: nextVehicleRow.workHours,
        rentHours: nextVehicleRow.rentHours,
        repairHours: nextVehicleRow.repairHours,
        downtimeHours: nextVehicleRow.downtimeHours,
        trips: nextVehicleRow.trips,
      };
    }));
  }

  function deleteDispatchSummaryRow(id: string) {
    if (isDailyDispatchShift) return;

    const row = dispatchSummaryRows.find((item) => item.id === id);
    const label = row?.vehicleName || row?.workType || "строку";
    if (!window.confirm(`Удалить ${label} из сводки?`)) return;

    setDispatchSummaryRows((current) => current.filter((item) => item.id !== id));
    addAdminLog({
      action: "Удаление",
      section: "Диспетчерская сводка",
      details: `Удалена строка сводки: ${label}.`,
    });
  }

  function openVehicleFilterMenu(key: VehicleFilterKey) {
    if (openVehicleFilter === key) {
      setOpenVehicleFilter(null);
      return;
    }

    setVehicleFilterDrafts((current) => {
      const nextDrafts = { ...current };
      const appliedValues = vehicleFilters[key];

      if (appliedValues === undefined) {
        delete nextDrafts[key];
      } else {
        nextDrafts[key] = appliedValues;
      }

      return nextDrafts;
    });
    setOpenVehicleFilter(key);
  }

  function getVehicleFilterOptionsForKey(key: VehicleFilterKey) {
    if (openVehicleFilter === key) return activeVehicleFilterOptions;

    const column = vehicleFilterColumns.find((item) => item.key === key);
    if (!column) return [];

      const rowsForColumn = vehicleRows.filter((vehicle) => vehicleMatchesFilters(vehicle, vehicleFilters, vehicleFilterColumns, key));
    const options = createVehicleFilterOptions(rowsForColumn, column);
    const selectedValues = vehicleFilters[key] ?? [];

    return Array.from(new Set([...options, ...selectedValues]))
      .sort((a, b) => vehicleFilterOptionLabel(a).localeCompare(vehicleFilterOptionLabel(b), "ru"));
  }

  function toggleVehicleFilterDraftValue(key: VehicleFilterKey, value: string) {
    const allOptions = getVehicleFilterOptionsForKey(key);

    setVehicleFilterDrafts((current) => {
      const selected = current[key];
      const nextSelection = new Set(selected === undefined ? allOptions : selected);

      if (nextSelection.has(value)) {
        nextSelection.delete(value);
      } else {
        nextSelection.add(value);
      }

      const nextValues = allOptions.filter((option) => nextSelection.has(option));
      const nextDrafts = { ...current };

      if (nextValues.length === allOptions.length) {
        delete nextDrafts[key];
      } else {
        nextDrafts[key] = nextValues;
      }

      return nextDrafts;
    });
  }

  function selectAllVehicleFilterDraftValues(key: VehicleFilterKey) {
    setVehicleFilterDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[key];
      return nextDrafts;
    });
  }

  function deselectAllVehicleFilterDraftValues(key: VehicleFilterKey) {
    setVehicleFilterDrafts((current) => ({
      ...current,
      [key]: [],
    }));
  }

  function applyVehicleFilter(key: VehicleFilterKey) {
    const draftValues = vehicleFilterDrafts[key];

    setVehicleFilters((current) => {
      const nextFilters = { ...current };

      if (draftValues === undefined) {
        delete nextFilters[key];
      } else {
        nextFilters[key] = draftValues;
      }

      return nextFilters;
    });
    setOpenVehicleFilter(null);
  }

  function clearAllVehicleFilters() {
    setVehicleFilters({});
    setVehicleFilterDrafts({});
    setOpenVehicleFilter(null);
  }

  function startPtoColumnResize(event: React.MouseEvent<HTMLElement>, key: string, width: number) {
    event.preventDefault();
    event.stopPropagation();
    ptoResizeStateRef.current = { type: "column", key, startX: event.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function startReportColumnResize(event: React.MouseEvent<HTMLElement>, key: string, width: number) {
    event.preventDefault();
    event.stopPropagation();
    reportResizeStateRef.current = { key, startX: event.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function commitReportDayReason(rowKey: string, value: string) {
    const key = reportReasonEntryKey(reportDate, rowKey);

    if (reportReasonDraftTimerRef.current !== null) {
      window.clearTimeout(reportReasonDraftTimerRef.current);
      reportReasonDraftTimerRef.current = null;
    }

    setReportReasons((current) => {
      const next = { ...current };
      if (value !== "") {
        next[key] = value;
      } else {
        delete next[key];
      }

      return next;
    });
    window.setTimeout(requestPtoDatabaseSave, 0);
  }

  function commitReportYearReason(rowKey: string, value: string) {
    const key = reportYearReasonOverrideKey(reportDate, rowKey);
    const normalizedValue = value.trim();

    if (reportReasonDraftTimerRef.current !== null) {
      window.clearTimeout(reportReasonDraftTimerRef.current);
      reportReasonDraftTimerRef.current = null;
    }

    setReportReasons((current) => {
      const next = { ...current };
      if (normalizedValue === "") {
        delete next[key];
      } else {
        next[key] = normalizedValue;
      }

      return next;
    });
    window.setTimeout(requestPtoDatabaseSave, 0);
  }

  function updateReportDayReasonDraft(rowKey: string, value: string) {
    const key = reportReasonEntryKey(reportDate, rowKey);

    if (reportReasonDraftTimerRef.current !== null) {
      window.clearTimeout(reportReasonDraftTimerRef.current);
    }

    reportReasonDraftTimerRef.current = window.setTimeout(() => {
      setReportReasons((current) => {
        const next = { ...current };
        if (value !== "") {
          next[key] = value;
        } else {
          delete next[key];
        }

        return next;
      });
      reportReasonDraftTimerRef.current = null;
    }, 180);
  }

  function updateReportYearReasonDraft(rowKey: string, value: string) {
    const key = reportYearReasonOverrideKey(reportDate, rowKey);

    if (reportReasonDraftTimerRef.current !== null) {
      window.clearTimeout(reportReasonDraftTimerRef.current);
    }

    reportReasonDraftTimerRef.current = window.setTimeout(() => {
      setReportReasons((current) => {
        const next = { ...current };
        const normalizedValue = value.trim();
        if (normalizedValue === "") {
          delete next[key];
        } else {
          next[key] = normalizedValue;
        }

        return next;
      });
      reportReasonDraftTimerRef.current = null;
    }, 180);
  }

  function cancelReportDayReasonDraft(rowKey: string, value: string) {
    const key = reportReasonEntryKey(reportDate, rowKey);

    if (reportReasonDraftTimerRef.current !== null) {
      window.clearTimeout(reportReasonDraftTimerRef.current);
      reportReasonDraftTimerRef.current = null;
    }

    setReportReasons((current) => {
      const next = { ...current };
      if (value !== "") {
        next[key] = value;
      } else {
        delete next[key];
      }

      return next;
    });
  }

  function cancelReportYearReasonDraft(rowKey: string, value: string) {
    const key = reportYearReasonOverrideKey(reportDate, rowKey);

    if (reportReasonDraftTimerRef.current !== null) {
      window.clearTimeout(reportReasonDraftTimerRef.current);
      reportReasonDraftTimerRef.current = null;
    }

    setReportReasons((current) => {
      const next = { ...current };
      const normalizedValue = value.trim();
      if (normalizedValue === "") {
        delete next[key];
      } else {
        next[key] = normalizedValue;
      }

      return next;
    });
  }

  function startPtoRowResize(event: React.MouseEvent<HTMLElement>, key: string) {
    event.preventDefault();
    event.stopPropagation();
    const rowElement = event.currentTarget.closest("tr");
    const startHeight = rowElement?.getBoundingClientRect().height ?? ptoRowHeights[key] ?? 34;

    ptoResizeStateRef.current = { type: "row", key, startY: event.clientY, startHeight };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }

  function ptoHeaderLabel(key: string, fallback: string) {
    return ptoHeaderLabels[key]?.trim() || fallback;
  }

  function startPtoHeaderEdit(key: string, fallback: string) {
    setEditingPtoHeaderKey(key);
    setPtoHeaderDraft(ptoHeaderLabel(key, fallback));
  }

  function cancelPtoHeaderEdit() {
    setEditingPtoHeaderKey(null);
    setPtoHeaderDraft("");
  }

  function commitPtoHeaderEdit(key: string, fallback: string) {
    const nextLabel = ptoHeaderDraft.trim();

    setPtoHeaderLabels((current) => {
      const next = { ...current };
      if (!nextLabel || nextLabel === fallback) {
        delete next[key];
      } else {
        next[key] = nextLabel;
      }
      return next;
    });
    setEditingPtoHeaderKey(null);
    setPtoHeaderDraft("");
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменен заголовок таблицы: ${fallback}.`,
    });
  }

  function reportHeaderLabel(key: string, fallback: string) {
    return reportHeaderLabels[key]?.trim() || fallback;
  }

  function startReportHeaderEdit(key: string, fallback: string) {
    setEditingReportHeaderKey(key);
    setReportHeaderDraft(reportHeaderLabel(key, fallback));
  }

  function cancelReportHeaderEdit() {
    setEditingReportHeaderKey(null);
    setReportHeaderDraft("");
  }

  function commitReportHeaderEdit(key: string, fallback: string) {
    const nextLabel = reportHeaderDraft.trim();

    setReportHeaderLabels((current) => {
      const next = { ...current };
      if (!nextLabel || nextLabel === fallback) {
        delete next[key];
      } else {
        next[key] = nextLabel;
      }
      return next;
    });
    setEditingReportHeaderKey(null);
    setReportHeaderDraft("");
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: `Изменен заголовок таблицы: ${fallback}.`,
    });
  }

  function clearAdminLogs() {
    if (!window.confirm("Очистить журнал логов?")) return;

    setAdminLogs([]);
    window.localStorage.setItem(adminStorageKeys.adminLogs, JSON.stringify([]));
  }

  function updateReportCustomer(customerId: string, patch: Partial<Pick<ReportCustomerConfig, "label" | "ptoCode" | "visible" | "autoShowRows">>) {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      if (customer.autoShowRows && patch.autoShowRows === false) {
        const customerAutoRowKeys = reportAutoRowKeysForCustomer(customer);

        return {
          ...customer,
          ...patch,
          rowKeys: Array.from(reportCustomerEffectiveRowKeys(customer, customerAutoRowKeys)),
          hiddenRowKeys: [],
        };
      }

      return { ...customer, ...patch, ptoCode: patch.ptoCode !== undefined ? normalizePtoCustomerCode(patch.ptoCode) : customer.ptoCode };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменены настройки заказчика отчета.",
    });
  }

  function addReportCustomer() {
    const customerId = createId();
    const customer: ReportCustomerConfig = {
      id: customerId,
      label: `Заказчик ${reportCustomers.length + 1}`,
      ptoCode: `C${reportCustomers.length + 1}`,
      visible: true,
      autoShowRows: false,
      rowKeys: [],
      hiddenRowKeys: [],
      rowLabels: {},
      factSourceRowKeys: {},
      summaryRows: [],
      areaOrder: [],
      workOrder: {},
    };

    setReportCustomers((current) => [...current, customer]);
    setAdminReportCustomerId(customerId);
    setReportCustomerId(customerId);
    addAdminLog({
      action: "Добавление",
      section: "Отчетность",
      details: "Добавлен заказчик отчета.",
    });
  }

  function deleteReportCustomer(customerId: string) {
    const customer = reportCustomers.find((item) => item.id === customerId);
    if (!customer) return;

    if (reportCustomers.length <= 1) {
      window.alert("Нельзя удалить последнего заказчика.");
      return;
    }

    if (!window.confirm(`Удалить заказчика "${customer.label}"?`)) return;

    const customerIndex = reportCustomers.findIndex((item) => item.id === customerId);
    const nextCustomers = reportCustomers.filter((item) => item.id !== customerId);
    const nextCustomer = nextCustomers[Math.min(customerIndex, nextCustomers.length - 1)] ?? nextCustomers[0];
    const nextCustomerId = nextCustomer?.id ?? defaultReportCustomerId;

    setReportCustomers(nextCustomers);
    setAdminReportCustomerId(nextCustomerId);
    setReportCustomerId((current) => (current === customerId ? nextCustomerId : current));
    addAdminLog({
      action: "Удаление",
      section: "Отчетность",
      details: `Удален заказчик отчета: ${customer.label}.`,
    });
  }

  function moveReportAreaOrder(area: string, direction: -1 | 1) {
    const sourceIndex = activeAdminReportAreaOptions.findIndex((item) => normalizeLookupValue(item) === normalizeLookupValue(area));
    const targetIndex = sourceIndex + direction;
    if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= activeAdminReportAreaOptions.length) return;

    const nextOrder = [...activeAdminReportAreaOptions];
    [nextOrder[sourceIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[sourceIndex]];
    setReportCustomers((current) => current.map((customer) => (
      customer.id === activeAdminReportCustomer.id
        ? { ...customer, areaOrder: nextOrder }
        : customer
    )));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: `Изменен порядок отображения участков для ${activeAdminReportCustomer.label}.`,
    });
  }

  function moveReportWorkOrder(area: string, rowKey: string, direction: -1 | 1) {
    const areaKey = normalizeLookupValue(area);
    const areaRows = sortReportRowsByAreaOrder(
      activeAdminReportOrderRows.filter((row) => normalizeLookupValue(row.area) === areaKey),
      [area],
      activeAdminReportCustomer.workOrder,
    );
    const rowKeys = areaRows.map(reportRowDisplayKey);
    const sourceIndex = rowKeys.indexOf(rowKey);
    const targetIndex = sourceIndex + direction;
    if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= rowKeys.length) return;

    const nextRowKeys = [...rowKeys];
    [nextRowKeys[sourceIndex], nextRowKeys[targetIndex]] = [nextRowKeys[targetIndex], nextRowKeys[sourceIndex]];
    setReportCustomers((current) => current.map((customer) => (
      customer.id === activeAdminReportCustomer.id
        ? { ...customer, workOrder: { ...customer.workOrder, [areaKey]: nextRowKeys } }
        : customer
    )));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: `Изменен порядок видов работ внутри участка для ${activeAdminReportCustomer.label}.`,
    });
  }

  function toggleReportCustomerRow(customerId: string, rowKey: string) {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const customerAutoRowKeys = reportAutoRowKeysForCustomer(customer);
      const effectiveRowKeys = reportCustomerEffectiveRowKeys(customer, customerAutoRowKeys);
      const currentlyVisible = effectiveRowKeys.has(rowKey);
      const autoCanShow = customer.autoShowRows && customerAutoRowKeys.has(rowKey);
      const nextRowKeys = currentlyVisible
        ? customer.rowKeys.filter((key) => key !== rowKey)
        : Array.from(new Set([...customer.rowKeys, rowKey]));
      const nextHiddenRowKeys = currentlyVisible && autoCanShow
        ? Array.from(new Set([...customer.hiddenRowKeys, rowKey]))
        : customer.hiddenRowKeys.filter((key) => key !== rowKey);

      return { ...customer, rowKeys: nextRowKeys, hiddenRowKeys: nextHiddenRowKeys };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен показ строки для заказчика.",
    });
  }

  function updateReportCustomerRowLabel(customerId: string, rowKey: string, value: string, fallback: string) {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const nextLabels = { ...customer.rowLabels };
      const nextLabel = value.trim();
      if (!nextLabel || nextLabel === fallback.trim()) {
        delete nextLabels[rowKey];
      } else {
        nextLabels[rowKey] = value;
      }

      return { ...customer, rowLabels: nextLabels };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменено название строки отчета для заказчика.",
    });
  }

  function addReportCustomerRowLabel(customerId: string) {
    const customer = reportCustomers.find((item) => item.id === customerId);
    if (!customer) return;

    const customerAutoRowKeys = reportAutoRowKeysForCustomer(customer);
    const customerRows = reportRowsForCustomer(adminReportBaseRows, customer);
    const customerVisibleRowKeys = reportCustomerEffectiveRowKeys(customer, customerAutoRowKeys);
    const selectedRows = customerRows.filter((row) => customerVisibleRowKeys.has(reportRowKey(row)));
    const sourceRows = selectedRows.length > 0 ? selectedRows : customerRows;
    const targetRow = sourceRows.find((item) => !customer.rowLabels[reportRowKey(item)]) ?? sourceRows[0];
    if (!targetRow) return;

    const targetRowKey = reportRowKey(targetRow);

    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      return {
        ...customer,
        rowKeys: customer.rowKeys.includes(targetRowKey) ? customer.rowKeys : [...customer.rowKeys, targetRowKey],
        rowLabels: { ...customer.rowLabels, [targetRowKey]: customer.rowLabels[targetRowKey] ?? targetRow.name },
      };
    }));
    startReportRowLabelEdit(targetRowKey);
    addAdminLog({
      action: "Добавление",
      section: "Отчетность",
      details: "Добавлено переименование строки для заказчика.",
    });
  }

  function changeReportCustomerRowLabelSource(customerId: string, currentRowKey: string, nextRowKey: string) {
    if (currentRowKey === nextRowKey) return;

    const currentRow = activeAdminReportRowsByKey.get(currentRowKey);
    const nextRow = activeAdminReportRowsByKey.get(nextRowKey);
    if (!nextRow) return;

    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const nextLabels = { ...customer.rowLabels };
      const currentLabel = nextLabels[currentRowKey];
      const labelIsDefault = !currentLabel || currentLabel.trim() === currentRow?.name.trim();
      delete nextLabels[currentRowKey];
      nextLabels[nextRowKey] = labelIsDefault ? nextRow.name : currentLabel;

      return {
        ...customer,
        rowKeys: customer.rowKeys.includes(nextRowKey) ? customer.rowKeys : [...customer.rowKeys, nextRowKey],
        rowLabels: nextLabels,
      };
    }));
    setEditingReportRowLabelKeys((current) => (
      current.includes(currentRowKey)
        ? Array.from(new Set([...current.filter((key) => key !== currentRowKey), nextRowKey]))
        : current
    ));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменена строка для переименования заказчика.",
    });
  }

  function removeReportCustomerRowLabel(customerId: string, rowKey: string) {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const nextLabels = { ...customer.rowLabels };
      delete nextLabels[rowKey];
      return { ...customer, rowLabels: nextLabels };
    }));
    setEditingReportRowLabelKeys((current) => current.filter((key) => key !== rowKey));
    addAdminLog({
      action: "Удаление",
      section: "Отчетность",
      details: "Удалено переименование строки для заказчика.",
    });
  }

  function startReportRowLabelEdit(rowKey: string) {
    setEditingReportRowLabelKeys((current) => (
      current.includes(rowKey) ? current : [...current, rowKey]
    ));
  }

  function finishReportRowLabelEdit(rowKey: string) {
    setEditingReportRowLabelKeys((current) => current.filter((key) => key !== rowKey));
    addAdminLog({
      action: "Сохранение",
      section: "Отчетность",
      details: "Завершено редактирование переименования строки.",
    });
  }

  function setReportCustomerFactSourceMode(customerId: string, targetRowKey: string, enabled: boolean) {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const nextFactSourceRowKeys = { ...customer.factSourceRowKeys };
      if (enabled) {
        nextFactSourceRowKeys[targetRowKey] = nextFactSourceRowKeys[targetRowKey]?.length
          ? nextFactSourceRowKeys[targetRowKey]
          : [targetRowKey];
      } else {
        delete nextFactSourceRowKeys[targetRowKey];
      }

      return { ...customer, factSourceRowKeys: nextFactSourceRowKeys };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен источник факта для строки отчета.",
    });
  }

  function toggleReportCustomerFactSourceRowKey(customerId: string, targetRowKey: string, sourceRowKey: string) {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const currentSourceRowKeys = customer.factSourceRowKeys[targetRowKey] ?? [];
      const nextSourceRowKeys = currentSourceRowKeys.includes(sourceRowKey)
        ? currentSourceRowKeys.filter((key) => key !== sourceRowKey)
        : [...currentSourceRowKeys, sourceRowKey];
      const nextFactSourceRowKeys = { ...customer.factSourceRowKeys };

      if (nextSourceRowKeys.length > 0) {
        nextFactSourceRowKeys[targetRowKey] = Array.from(new Set(nextSourceRowKeys));
      } else {
        delete nextFactSourceRowKeys[targetRowKey];
      }

      return { ...customer, factSourceRowKeys: nextFactSourceRowKeys };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен состав строк для суммы факта.",
    });
  }

  function reportRowsForSummaryArea(area: string) {
    const areaKey = normalizeLookupValue(area);
    return activeAdminReportBaseRows.filter((row) => normalizeLookupValue(row.area) === areaKey);
  }

  function reportRowKeysForSummaryArea(area: string) {
    return reportRowsForSummaryArea(area).map(reportRowKey);
  }

  function addReportSummaryRow(customerId: string) {
    const customer = reportCustomers.find((item) => item.id === customerId);
    if (!customer || !reportCustomerUsesSummaryRows(customer)) return;
    const area = activeAdminReportSummaryAreaOptions[0] ?? activeAdminReportBaseRows[0]?.area ?? "";
    const summaryId = createId();

    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? {
          ...customer,
          summaryRows: [
            ...customer.summaryRows,
            { id: summaryId, label: "Итоговая строка", unit: "", area, planRowKey: "", rowKeys: reportRowKeysForSummaryArea(area) },
          ],
        }
        : customer
    )));
    setExpandedReportSummaryIds((current) => Array.from(new Set([...current, summaryId])));
    addAdminLog({
      action: "Добавление",
      section: "Отчетность",
      details: "Добавлена итоговая строка для заказчика.",
    });
  }

  function startReportSummaryEdit(summaryId: string) {
    setExpandedReportSummaryIds((current) => (
      current.includes(summaryId) ? current : [...current, summaryId]
    ));
  }

  function finishReportSummaryEdit(summaryId: string) {
    setExpandedReportSummaryIds((current) => current.filter((id) => id !== summaryId));
    addAdminLog({
      action: "Сохранение",
      section: "Отчетность",
      details: "Завершено редактирование состава итоговой строки.",
    });
  }

  function updateReportSummaryRow(
    customerId: string,
    summaryId: string,
    field: Exclude<keyof ReportSummaryRowConfig, "id" | "rowKeys">,
    value: string,
  ) {
    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? {
          ...customer,
          summaryRows: customer.summaryRows.map((summary) => {
            if (summary.id !== summaryId) return summary;

            if (field === "area") {
              return { ...summary, area: value, planRowKey: "", rowKeys: reportRowKeysForSummaryArea(value) };
            }

            return { ...summary, [field]: value };
          }),
        }
        : customer
    )));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменена итоговая строка заказчика.",
    });
  }

  function toggleReportSummaryRowKey(customerId: string, summaryId: string, rowKey: string) {
    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? {
          ...customer,
          summaryRows: customer.summaryRows.map((summary) => {
            if (summary.id !== summaryId) return summary;
            const rowKeys = summary.rowKeys.includes(rowKey)
              ? summary.rowKeys.filter((key) => key !== rowKey)
              : [...summary.rowKeys, rowKey];
            return { ...summary, rowKeys };
          }),
        }
        : customer
    )));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен состав итоговой строки заказчика.",
    });
  }

  function removeReportSummaryRow(customerId: string, summaryId: string) {
    if (!window.confirm("Удалить итоговую строку из отчетности заказчика?")) return;

    setExpandedReportSummaryIds((current) => current.filter((id) => id !== summaryId));
    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? { ...customer, summaryRows: customer.summaryRows.filter((summary) => summary.id !== summaryId) }
        : customer
    )));
    addAdminLog({
      action: "Удаление",
      section: "Отчетность",
      details: "Удалена итоговая строка заказчика.",
    });
  }

  function currentPtoTableLabel() {
    return subTabs.pto.find((tab) => tab.value === ptoTab)?.label ?? ptoTab;
  }

  function currentPtoDateTableKey(): PtoDateTableKey | null {
    return ptoTab === "plan" || ptoTab === "oper" || ptoTab === "survey" ? ptoTab : null;
  }

  function savePtoDayPatchToDatabase(rowId: string, day: string, value: number | null) {
    const table = currentPtoDateTableKey();
    if (!table || !databaseConfigured || !ptoDatabaseLoadedRef.current) return;

    void import("@/lib/data/pto")
      .then(({ savePtoDayValueToDatabase }) => savePtoDayValueToDatabase(table, rowId, day, value))
      .catch((error) => console.warn("Database PTO day save failed:", error));
  }

  function savePtoDayPatchesToDatabase(values: Array<{ rowId: string; day: string; value: number | null }>) {
    const table = currentPtoDateTableKey();
    if (!table || !databaseConfigured || !ptoDatabaseLoadedRef.current || values.length === 0) return;

    void import("@/lib/data/pto")
      .then(({ savePtoDayValuesToDatabase }) => savePtoDayValuesToDatabase(table, values))
      .catch((error) => console.warn("Database PTO day batch save failed:", error));
  }

  function addLinkedPtoDateRow(overrides: Partial<PtoPlanRow> = {}, insertAfterRow?: PtoPlanRow) {
    const id = createId();
    const sharedOverrides = {
      area: overrides.area,
      location: overrides.location,
      structure: overrides.structure,
      unit: overrides.unit,
      years: overrides.years,
    };
    const planRow = createEmptyPtoDateRow("Новая", ptoAreaFilter, ptoPlanYear, id, ptoTab === "plan" ? overrides : sharedOverrides);
    const operRow = createEmptyPtoDateRow("Новая", ptoAreaFilter, ptoPlanYear, id, ptoTab === "oper" ? overrides : sharedOverrides);
    const surveyRow = createEmptyPtoDateRow("Новая", ptoAreaFilter, ptoPlanYear, id, ptoTab === "survey" ? overrides : sharedOverrides);

    setPtoPlanRows((current) => insertPtoRowAfter(current, insertAfterRow, planRow));
    setPtoOperRows((current) => insertPtoRowAfter(current, insertAfterRow, operRow));
    setPtoSurveyRows((current) => insertPtoRowAfter(current, insertAfterRow, surveyRow));
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Добавление",
      section: "ПТО",
      details: `Добавлена строка в ${currentPtoTableLabel()}.`,
    });

    return id;
  }

  function addPtoYear() {
    const nextYear = normalizePtoYearValue(ptoYearInput);
    if (!nextYear) return;

    setPtoPlanYear(nextYear);
    setPtoManualYears((current) => uniqueSorted([...current, nextYear]));
    setExpandedPtoMonths((current) => ({ ...current, [`${nextYear}-01`]: true }));
    setPtoYearDialogOpen(false);
    setPtoYearInput("");
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Добавление",
      section: "ПТО",
      details: `Добавлен год ${nextYear}.`,
    });
  }

  function deletePtoYear() {
    const year = normalizePtoYearValue(ptoPlanYear);
    if (!year) return;

    const confirmed = window.confirm(`Вы точно хотите удалить ${year} год? Все данные ПТО за этот год в Плане, Оперучете и Замере будут удалены.`);
    if (!confirmed) return;

    const fallbackYear = ptoYearTabs.find((item) => item !== year) ?? String(Number(year) - 1);

    setPtoPlanRows((current) => removeYearFromPtoRows(current, year));
    setPtoOperRows((current) => removeYearFromPtoRows(current, year));
    setPtoSurveyRows((current) => removeYearFromPtoRows(current, year));
    setPtoManualYears((current) => uniqueSorted([...current.filter((item) => item !== year), fallbackYear]));
    setPtoPlanYear(fallbackYear);
    setPtoYearInput("");
    setPtoYearDialogOpen(false);
    if (databaseConfigured && ptoDatabaseLoadedRef.current) {
      void import("@/lib/data/pto")
        .then(({ deletePtoYearFromDatabase }) => deletePtoYearFromDatabase(year))
        .catch((error) => console.warn("Database PTO year delete failed:", error));
    }
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО",
      details: `Удален год ${year}.`,
    });
  }

  function updatePtoDateRow(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, field: keyof Omit<PtoPlanRow, "id" | "dailyPlans">, value: string) {
    const numericFields: Array<keyof PtoPlanRow> = ["carryover"];
    const sharedFields: Array<keyof Omit<PtoPlanRow, "id" | "dailyPlans">> = ["area", "location", "structure", "unit"];
    const updatedValue = numericFields.includes(field) ? parseDecimalValue(value) : value;
    const linkedRow = [...ptoPlanRows, ...ptoOperRows, ...ptoSurveyRows].find((row) => row.id === id);
    const linkedSignature = linkedRow ? ptoLinkedRowSignature(linkedRow) : "";

    if (field === "carryover") {
      setRows((current) =>
        current.map((row) => {
          if (row.id !== id) return row;

          return {
            ...row,
            carryover: Number(updatedValue),
            carryovers: {
              ...(row.carryovers ?? {}),
              [ptoPlanYear]: Number(updatedValue),
            },
            carryoverManualYears: uniqueSorted([...(row.carryoverManualYears ?? []), ptoPlanYear]),
            years: uniqueSorted([...(row.years ?? []), ptoPlanYear]),
          };
        }),
      );
      addAdminLog({
        action: "Редактирование",
        section: "ПТО",
        details: `Изменено поле "${ptoFieldLogLabel(field)}" в ${currentPtoTableLabel()}.`,
      });
      return;
    }

    if (sharedFields.includes(field)) {
      const updateLinkedRows = (current: PtoPlanRow[]) =>
        current.map((row) =>
          ptoLinkedRowMatches(row, id, linkedSignature)
            ? { ...row, [field]: updatedValue }
            : row,
        );

      setPtoPlanRows(updateLinkedRows);
      setPtoOperRows(updateLinkedRows);
      setPtoSurveyRows(updateLinkedRows);
      addAdminLog({
        action: "Редактирование",
        section: "ПТО",
        details: `Изменено поле "${ptoFieldLogLabel(field)}" в связанных строках ПТО.`,
      });
      return;
    }

    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: updatedValue } : row)),
    );
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменено поле "${ptoFieldLogLabel(field)}" в ${currentPtoTableLabel()}.`,
    });
  }

  function ptoRowTextDraftKey(rowId: string, field: "area" | "location" | "structure") {
    return `${rowId}:${field}`;
  }

  function getPtoRowTextDraft(row: PtoPlanRow, field: "area" | "location" | "structure") {
    const key = ptoRowTextDraftKey(row.id, field);
    return ptoRowFieldDrafts[key] ?? String(row[field] ?? "");
  }

  function beginPtoRowTextDraft(row: PtoPlanRow, field: "area" | "location" | "structure") {
    const key = ptoRowTextDraftKey(row.id, field);
    setPtoRowFieldDrafts((current) => (
      current[key] === undefined
        ? { ...current, [key]: String(row[field] ?? "") }
        : current
    ));
  }

  function updatePtoRowTextDraft(rowId: string, field: "area" | "location" | "structure", value: string) {
    const key = ptoRowTextDraftKey(rowId, field);
    setPtoRowFieldDrafts((current) => ({ ...current, [key]: value }));
  }

  function clearPtoRowTextDraft(rowId: string, field: "area" | "location" | "structure") {
    const key = ptoRowTextDraftKey(rowId, field);
    setPtoRowFieldDrafts((current) => {
      if (!(key in current)) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function commitPtoRowTextDraft(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, row: PtoPlanRow, field: "area" | "location" | "structure") {
    const key = ptoRowTextDraftKey(row.id, field);
    const nextValue = ptoRowFieldDrafts[key];
    if (nextValue === undefined) return;

    clearPtoRowTextDraft(row.id, field);
    if (nextValue === String(row[field] ?? "")) return;

    updatePtoDateRow(setRows, row.id, field, nextValue);
    requestPtoDatabaseSave();
  }

  function cancelPtoRowTextDraft(rowId: string, field: "area" | "location" | "structure") {
    clearPtoRowTextDraft(rowId, field);
  }

  function clearPtoCarryoverOverride(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, year: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const carryovers = { ...(row.carryovers ?? {}) };
        delete carryovers[year];

        return {
          ...row,
          carryover: year === defaultPtoPlanMonth.slice(0, 4) ? 0 : row.carryover,
          carryovers,
          carryoverManualYears: (row.carryoverManualYears ?? []).filter((rowYear) => rowYear !== year),
        };
      }),
    );
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Очищены остатки за ${year} год в ${currentPtoTableLabel()}.`,
    });
  }

  function updatePtoDateDay(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, day: string, value: string) {
    const trimmedValue = value.trim();
    const parsedValue = trimmedValue === "" ? null : parseDecimalValue(value);

    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const dailyPlans = { ...row.dailyPlans };
        const year = day.slice(0, 4);
        if (parsedValue === null) {
          delete dailyPlans[day];
        } else {
          dailyPlans[day] = parsedValue;
        }

        return {
          ...row,
          dailyPlans,
          years: uniqueSorted([...(row.years ?? []), year]),
        };
      }),
    );
    savePtoDayPatchToDatabase(id, day, parsedValue);
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменено значение за день ${day} в ${currentPtoTableLabel()}.`,
    });
  }

  function updatePtoMonthTotal(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, days: string[], value: string) {
    const distributedValues = value.trim() ? distributeMonthlyTotal(parseDecimalValue(value), days) : {};

    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const nextDailyPlans = { ...row.dailyPlans };
        days.forEach((day) => {
          delete nextDailyPlans[day];
        });

        if (value.trim()) {
          Object.assign(nextDailyPlans, distributedValues);
        }

        return {
          ...row,
          dailyPlans: nextDailyPlans,
          years: days[0] ? uniqueSorted([...(row.years ?? []), days[0].slice(0, 4)]) : row.years,
        };
      }),
    );
    savePtoDayPatchesToDatabase(days.map((day) => ({
      rowId: id,
      day,
      value: distributedValues[day] ?? null,
    })));
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Распределен итог месяца в ${currentPtoTableLabel()}.`,
    });
  }

  function removeLinkedPtoDateRow(row: PtoPlanRow) {
    const table = currentPtoDateTableKey();
    if (!table) return;
    const rowName = [cleanAreaName(row.area), row.structure].filter(Boolean).join(" / ") || "строку ПТО";
    const confirmed = window.confirm(`\u0412\u044b \u0442\u043e\u0447\u043d\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043b\u0438\u0442\u044c ${rowName}? \u0421\u0442\u0440\u043e\u043a\u0430 \u0443\u0434\u0430\u043b\u0438\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0438\u0437 \u0432\u043a\u043b\u0430\u0434\u043a\u0438 "${currentPtoTableLabel()}".`);
    if (!confirmed) return;

    const removeRow = (current: PtoPlanRow[]) => current.filter((item) => item.id !== row.id);

    if (table === "plan") {
      setPtoPlanRows(removeRow);
    } else if (table === "oper") {
      setPtoOperRows(removeRow);
    } else {
      setPtoSurveyRows(removeRow);
    }
    if (databaseConfigured && ptoDatabaseLoadedRef.current) {
      void import("@/lib/data/pto")
        .then(({ deletePtoRowsFromDatabase }) => deletePtoRowsFromDatabase(table, [row.id]))
        .catch((error) => console.warn("Database PTO row delete failed:", error));
    }
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО",
      details: `\u0423\u0434\u0430\u043b\u0435\u043d\u0430 \u0441\u0442\u0440\u043e\u043a\u0430 \u0438\u0437 ${currentPtoTableLabel()}: ${rowName}.`,
    });
  }

  function getPtoDropPosition(event: React.DragEvent<HTMLTableRowElement>): PtoDropPosition {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY - bounds.top > bounds.height / 2 ? "after" : "before";
  }

  function moveLinkedPtoDateRow(sourceId: string, targetId: string, visibleRows: PtoPlanRow[], position: PtoDropPosition) {
    const sourceRow = visibleRows.find((row) => row.id === sourceId);
    const targetRow = visibleRows.find((row) => row.id === targetId);
    if (!sourceRow || !targetRow) return;

    const sourceSignature = ptoLinkedRowSignature(sourceRow);
    const targetSignature = ptoLinkedRowSignature(targetRow);
    const reorderRows = (current: PtoPlanRow[]) => reorderPtoRows(current, sourceRow.id, sourceSignature, targetRow.id, targetSignature, position);

    setPtoPlanRows(reorderRows);
    setPtoOperRows(reorderRows);
    setPtoSurveyRows(reorderRows);
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменен порядок строк в ${currentPtoTableLabel()}.`,
    });
  }

  function addCustomTab(title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const nextTab: CustomTab = {
      id: createId(),
      title: trimmedTitle,
      description: "",
      items: [],
      visible: true,
    };

    setCustomTabs((current) => [...current, nextTab]);
    setTopTab(customTabKey(nextTab.id));
  }

  function updateTopTabLabel(id: TopTabDefinition["id"], label: string) {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, label: trimmedLabel } : tab)),
    );
  }

  function deleteTopTab(id: TopTabDefinition["id"]) {
    const tab = topTabs.find((item) => item.id === id);
    if (!tab || tab.locked) return;
    if (!window.confirm(`Удалить вкладку "${tab.label}"? Она будет скрыта, при необходимости ее можно вернуть.`)) return;

    setTopTabs((current) =>
      current.map((item) => (item.id === id ? { ...item, visible: false } : item)),
    );

    if (topTab === id) {
      setTopTab("admin");
    }
  }

  function showTopTab(id: TopTabDefinition["id"]) {
    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, visible: true } : tab)),
    );
  }

  function updateCustomTabTitle(id: string, title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setCustomTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, title: trimmedTitle } : tab)),
    );
  }

  function showCustomTab(id: string) {
    setCustomTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, visible: true } : tab)),
    );
  }

  function deleteCustomTab(id: string) {
    const tab = customTabs.find((item) => item.id === id);
    if (!tab) return;
    if (!window.confirm(`Удалить вкладку "${tab.title}"?`)) return;

    setCustomTabs((current) => current.filter((tab) => tab.id !== id));
    if (topTab === customTabKey(id)) {
      setTopTab("admin");
    }
  }

  function updateOrgMember(id: string, field: keyof OrgMember, value: string | boolean) {
    setOrgMembers((current) =>
      current.map((member) =>
        member.id === id
          ? {
              ...member,
              [field]: value,
            }
          : member,
      ),
    );
  }

  function updateOrgMemberForm(field: keyof OrgMember, value: string | boolean) {
    setOrgMemberForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addOrgMember() {
    const name = orgMemberForm.name.trim();
    const position = orgMemberForm.position.trim();
    if (!name && !position) return;

    const nextMember: OrgMember = {
      ...orgMemberForm,
      id: createId(),
      name: name || position,
      position,
      department: orgMemberForm.department.trim(),
      area: orgMemberForm.area.trim(),
    };

    setOrgMembers((current) => [...current, nextMember]);
    setOrgMemberForm(defaultOrgMemberForm);
    setEditingOrgMemberId(nextMember.id);
  }

  function deleteOrgMember(id: string) {
    setOrgMembers((current) =>
      current
        .filter((member) => member.id !== id)
        .map((member) => ({
          ...member,
          linearManagerId: member.linearManagerId === id ? "" : member.linearManagerId,
          functionalManagerId: member.functionalManagerId === id ? "" : member.functionalManagerId,
        })),
    );
    setEditingOrgMemberId((current) => (current === id ? null : current));
  }

  function updateDependencyNode(id: string, field: keyof DependencyNode, value: string | boolean) {
    setDependencyNodes((current) =>
      current.map((node) => (node.id === id ? { ...node, [field]: value } : node)),
    );
  }

  function updateDependencyNodeForm(field: keyof DependencyNode, value: string | boolean) {
    setDependencyNodeForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addDependencyNode() {
    const name = dependencyNodeForm.name.trim();
    if (!name) return;

    const nextNode: DependencyNode = {
      ...dependencyNodeForm,
      id: createId(),
      name,
      kind: dependencyNodeForm.kind.trim(),
      owner: dependencyNodeForm.owner.trim(),
      visible: true,
    };

    setDependencyNodes((current) => [...current, nextNode]);
    setDependencyNodeForm(defaultDependencyNodeForm);
    setEditingDependencyNodeId(nextNode.id);
    setDependencyLinkForm((current) => ({
      ...current,
      toNodeId: nextNode.id,
    }));
  }

  function deleteDependencyNode(id: string) {
    setDependencyNodes((current) => current.filter((node) => node.id !== id));
    setDependencyLinks((current) => current.filter((link) => link.fromNodeId !== id && link.toNodeId !== id));
    setEditingDependencyNodeId((current) => (current === id ? null : current));
    setEditingDependencyLinkId(null);
  }

  function updateDependencyLink(id: string, field: keyof DependencyLink, value: string | boolean) {
    setDependencyLinks((current) =>
      current.map((link) =>
        link.id === id
          ? {
              ...link,
              [field]: value,
            }
          : link,
      ),
    );
  }

  function updateDependencyLinkForm(field: keyof DependencyLink, value: string | boolean) {
    setDependencyLinkForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addDependencyLink() {
    if (!dependencyLinkForm.fromNodeId || !dependencyLinkForm.toNodeId) return;

    const nextLink: DependencyLink = {
      ...dependencyLinkForm,
      id: createId(),
      rule: dependencyLinkForm.rule.trim(),
      owner: dependencyLinkForm.owner.trim(),
      visible: true,
    };

    setDependencyLinks((current) => [...current, nextLink]);
    setDependencyLinkForm((current) => ({
      ...defaultDependencyLinkForm,
      fromNodeId: current.fromNodeId,
      toNodeId: current.toNodeId,
    }));
    setEditingDependencyLinkId(nextLink.id);
  }

  function deleteDependencyLink(id: string) {
    setDependencyLinks((current) => current.filter((link) => link.id !== id));
    setEditingDependencyLinkId((current) => (current === id ? null : current));
  }

  function startAdminVehiclesEditing() {
    setAdminVehiclesEditing(true);
  }

  function finishAdminVehiclesEditing() {
    if (editingVehicleCell) {
      const parsedCell = parseVehicleInlineFieldDomKey(editingVehicleCell);

      if (parsedCell) {
        commitVehicleInlineCellEdit(parsedCell.vehicleId, parsedCell.field);
      }
    }

    setAdminVehiclesEditing(false);
    setShowAllVehicleRows(false);
    setActiveVehicleCell(null);
    setVehicleSelectionAnchorCell(null);
    setSelectedVehicleCellKeys([]);
    setEditingVehicleCell(null);
    window.setTimeout(() => {
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRowsRef.current));
    }, 0);
  }

  function addVehicleRow() {
    const nextId = Math.max(0, ...vehicleRows.map((vehicle) => vehicle.id)) + 1;
    const nextVehicle: VehicleRow = {
      ...defaultVehicleForm,
      id: nextId,
      area: "",
      excavator: "",
      visible: true,
    };
    nextVehicle.name = buildVehicleDisplayName(nextVehicle);

    pushVehicleUndoSnapshot();
    clearAllVehicleFilters();
    setVehicleRows((current) => [nextVehicle, ...current]);
    setPendingVehicleFocus({ id: nextId, field: "vehicleType", edit: true });
    addAdminLog({
      action: "Добавление",
      section: "Техника",
      details: "Добавлена новая строка техники.",
    });
  }

  function updateVehicleRow(id: number, field: VehicleInlineField, value: string) {
    pushVehicleUndoSnapshot();
    setVehicleRows((current) =>
      current.map((vehicle) => {
        if (vehicle.id !== id) return vehicle;

        const nextVehicle = {
          ...vehicle,
          [field]: value,
        } as VehicleRow;

        if (field === "owner") nextVehicle.contractor = value.trim();
        nextVehicle.name = buildVehicleDisplayName(nextVehicle);

        return nextVehicle;
      }),
    );
  }

  function vehicleCellValue(id: number, field: VehicleInlineField) {
    const vehicle = vehicleRows.find((item) => item.id === id);
    return String(vehicle?.[field] ?? "");
  }

  function vehicleCellRangeKeys(anchor: { id: number; field: VehicleInlineField }, target: { id: number; field: VehicleInlineField }) {
    const vehicleGridKeys = visibleVehicleRows.map((vehicle) => (
      vehicleInlineFields.map((inlineField) => vehicleInlineFieldDomKey(vehicle.id, inlineField))
    ));

    return editableGridRangeKeys(
      vehicleGridKeys,
      vehicleInlineFieldDomKey(anchor.id, anchor.field),
      vehicleInlineFieldDomKey(target.id, target.field),
    );
  }

  function selectVehicleInlineCell(id: number, field: VehicleInlineField, event?: React.MouseEvent<HTMLElement>) {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    const targetCell = { id, field };

    setActiveVehicleCell(fieldKey);
    setEditingVehicleCell((current) => (current === fieldKey ? current : null));

    if (event?.ctrlKey || event?.metaKey) {
      vehicleSelectionAnchorRef.current = targetCell;
      setVehicleSelectionAnchorCell(targetCell);
      setSelectedVehicleCellKeys((currentKeys) => toggleEditableGridSelectionKey(currentKeys, fieldKey));
      return;
    }

    if (event?.shiftKey && vehicleSelectionAnchorCell) {
      setSelectedVehicleCellKeys(vehicleCellRangeKeys(vehicleSelectionAnchorCell, targetCell));
      return;
    }

    vehicleSelectionAnchorRef.current = targetCell;
    setVehicleSelectionAnchorCell(targetCell);
    setSelectedVehicleCellKeys([fieldKey]);
  }

  function extendVehicleInlineSelection(id: number, field: VehicleInlineField, event: React.MouseEvent<HTMLElement>) {
    if (!vehicleSelectionDraggingRef.current || event.buttons !== 1 || event.ctrlKey || event.metaKey) return;

    const targetCell = { id, field };
    const anchorCell = vehicleSelectionAnchorRef.current ?? vehicleSelectionAnchorCell ?? targetCell;
    setActiveVehicleCell(vehicleInlineFieldDomKey(id, field));
    setEditingVehicleCell(null);
    setSelectedVehicleCellKeys(vehicleCellRangeKeys(anchorCell, targetCell));
  }

  function startVehicleInlineSelection(id: number, field: VehicleInlineField, event: React.MouseEvent<HTMLElement>) {
    if (event.button !== 0) return;

    vehicleSelectionDraggingRef.current = true;
    selectVehicleInlineCell(id, field, event);
  }

  function startVehicleInlineCellEdit(id: number, field: VehicleInlineField, draftOverride?: string) {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    const currentValue = vehicleCellValue(id, field);
    const draft = draftOverride ?? currentValue;

    vehicleCellSkipBlurCommitRef.current = false;
    setActiveVehicleCell(fieldKey);
    vehicleSelectionAnchorRef.current = { id, field };
    setVehicleSelectionAnchorCell({ id, field });
    setSelectedVehicleCellKeys([fieldKey]);
    setEditingVehicleCell(fieldKey);
    setVehicleCellDraft(draft);
    setVehicleCellInitialDraft(currentValue);
    setPendingVehicleFocus({ id, field, edit: true, selectContents: draftOverride === undefined });
  }

  function commitVehicleInlineCellEdit(id: number, field: VehicleInlineField) {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    setEditingVehicleCell((current) => (current === fieldKey ? null : current));
    if (vehicleCellDraft !== vehicleCellInitialDraft) {
      updateVehicleRow(id, field, vehicleCellDraft);
      const vehicle = vehicleRows.find((item) => item.id === id);
      addAdminLog({
        action: "Редактирование",
        section: "Техника",
        details: `Изменено поле "${vehicleFilterColumns.find((column) => column.key === field)?.label ?? field}"${vehicle ? `: ${buildVehicleDisplayName(vehicle)}` : ""}.`,
      });
    }
    setVehicleCellInitialDraft("");
  }

  function cancelVehicleInlineCellEdit(id: number, field: VehicleInlineField) {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    vehicleCellSkipBlurCommitRef.current = true;
    setVehicleCellDraft(vehicleCellInitialDraft);
    setVehicleCellInitialDraft("");
    setEditingVehicleCell((current) => (current === fieldKey ? null : current));
    setPendingVehicleFocus({ id, field });
  }

  function focusVehicleInlineCell(id: number, field: VehicleInlineField, edit = false) {
    setPendingVehicleFocus({ id, field, edit });
  }

  function clearSelectedVehicleCells(id: number, field: VehicleInlineField) {
    const fallbackKey = vehicleInlineFieldDomKey(id, field);
    const targetKeys = selectedVehicleCellKeys.length ? selectedVehicleCellKeys : [fallbackKey];
    const targetFieldsById = new Map<number, Set<VehicleInlineField>>();

    targetKeys.forEach((key) => {
      const parsedCell = parseVehicleInlineFieldDomKey(key);
      if (!parsedCell) return;

      const fields = targetFieldsById.get(parsedCell.vehicleId) ?? new Set<VehicleInlineField>();
      fields.add(parsedCell.field);
      targetFieldsById.set(parsedCell.vehicleId, fields);
    });

    pushVehicleUndoSnapshot();
    setVehicleRows((current) =>
      current.map((vehicle) => {
        const fields = targetFieldsById.get(vehicle.id);
        if (!fields) return vehicle;

        const nextVehicle = { ...vehicle };
        fields.forEach((inlineField) => {
          nextVehicle[inlineField] = "";
          if (inlineField === "owner") nextVehicle.contractor = "";
        });
        nextVehicle.name = buildVehicleDisplayName(nextVehicle);

        return nextVehicle;
      }),
    );
    addAdminLog({
      action: "Редактирование",
      section: "Техника",
      details: `Очищены выбранные ячейки: ${targetKeys.length}.`,
    });
  }

  function focusVehicleCellByOffset(id: number, field: VehicleInlineField, rowOffset: number, fieldOffset: number) {
    const vehicleGridKeys = visibleVehicleRows.map((vehicle) => (
      vehicleInlineFields.map((inlineField) => vehicleInlineFieldDomKey(vehicle.id, inlineField))
    ));
    const nextKey = editableGridKeyAtOffset(vehicleGridKeys, vehicleInlineFieldDomKey(id, field), rowOffset, fieldOffset);
    if (!nextKey) return;

    const parsedCell = parseVehicleInlineFieldDomKey(nextKey);

    if (!parsedCell) return;
    focusVehicleInlineCell(parsedCell.vehicleId, parsedCell.field);
  }

  function handleVehicleCellKeyDown(event: React.KeyboardEvent<HTMLElement>, id: number, field: VehicleInlineField, editing: boolean) {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    if (editing) {
      if (isEditableGridArrowKey(event.key)) {
        event.preventDefault();
        commitVehicleInlineCellEdit(id, field);
        const offset = editableGridArrowOffset(event.key);
        focusVehicleCellByOffset(id, field, offset.rowOffset, offset.columnOffset);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        commitVehicleInlineCellEdit(id, field);
        setPendingVehicleFocus({ id, field });
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelVehicleInlineCellEdit(id, field);
        return;
      }

      return;
    }

    if (event.key.length === 1 && (!vehicleFieldIsNumeric(field) || /^[0-9]$/.test(event.key))) {
      event.preventDefault();
      startVehicleInlineCellEdit(id, field, event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      clearSelectedVehicleCells(id, field);
    } else if (event.key === "F2") {
      event.preventDefault();
      startVehicleInlineCellEdit(id, field);
    } else if (isEditableGridArrowKey(event.key)) {
      event.preventDefault();
      const offset = editableGridArrowOffset(event.key);
      focusVehicleCellByOffset(id, field, offset.rowOffset, offset.columnOffset);
    } else if (event.key === "Enter") {
      event.preventDefault();
      startVehicleInlineCellEdit(id, field);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditingVehicleCell(null);
      setSelectedVehicleCellKeys(activeVehicleCell ? [activeVehicleCell] : []);
    } else if (event.key === "Delete") {
      event.preventDefault();
      clearSelectedVehicleCells(id, field);
    }
  }

  function vehicleCellInputProps(id: number, field: VehicleInlineField) {
    const fieldKey = vehicleInlineFieldDomKey(id, field);

    return {
      active: activeVehicleCell === fieldKey,
      selected: selectedVehicleCellKeys.includes(fieldKey),
      editing: editingVehicleCell === fieldKey,
      draft: vehicleCellDraft,
      fieldKey,
      onSelect: (event: React.MouseEvent<HTMLElement>) => startVehicleInlineSelection(id, field, event),
      onExtendSelection: (event: React.MouseEvent<HTMLElement>) => extendVehicleInlineSelection(id, field, event),
      onStartEdit: () => startVehicleInlineCellEdit(id, field),
      onDraftChange: setVehicleCellDraft,
      onCommitEdit: () => {
        if (vehicleCellSkipBlurCommitRef.current) {
          vehicleCellSkipBlurCommitRef.current = false;
          return;
        }

        if (editingVehicleCell === fieldKey) commitVehicleInlineCellEdit(id, field);
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => handleVehicleCellKeyDown(event, id, field, editingVehicleCell === fieldKey),
    };
  }

  function toggleVehicleVisibility(id: number) {
    const vehicle = vehicleRows.find((item) => item.id === id);
    pushVehicleUndoSnapshot();
    setVehicleRows((current) =>
      current.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, visible: vehicle.visible === false } : vehicle,
      ),
    );
    addAdminLog({
      action: "Редактирование",
      section: "Техника",
      details: `Изменен показ техники${vehicle ? `: ${buildVehicleDisplayName(vehicle)}` : ""}.`,
    });
  }

  function deleteVehicle(id: number) {
    const vehicle = vehicleRows.find((item) => item.id === id);
    pushVehicleUndoSnapshot();
    setVehicleRows((current) => current.filter((vehicle) => vehicle.id !== id));
    if (databaseConfigured && vehiclesDatabaseLoadedRef.current) {
      showSaveStatus("saving", "Удаляю технику из базы...");
      void import("@/lib/data/vehicles")
        .then(({ deleteVehicleFromDatabase }) => deleteVehicleFromDatabase(id))
        .then(() => {
          vehiclesDatabaseSaveSnapshotRef.current = JSON.stringify(vehicleRowsRef.current.filter((vehicle) => vehicle.id !== id));
          showSaveStatus("saved", "Техника удалена из базы.");
        })
        .catch((error) => {
          console.warn("Database vehicle delete failed:", error);
          showSaveStatus("error", `Техника не удалена из базы: ${errorToMessage(error)}`);
        });
    }
    addAdminLog({
      action: "Удаление",
      section: "Техника",
      details: `Удалена техника${vehicle ? `: ${buildVehicleDisplayName(vehicle)}` : ""}.`,
    });
  }

  function openVehicleImportFilePicker() {
    vehicleImportInputRef.current?.click();
  }

  async function importVehiclesFromExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const importedVehicles = await parseVehicleImportFile(file, defaultVehicleForm);
      if (!importedVehicles.length) {
        window.alert("В выбранном файле не найден список техники.");
        return;
      }

      if (!window.confirm(`Заменить текущий список техники данными из файла? Будет загружено строк: ${importedVehicles.length}.`)) return;

      pushVehicleUndoSnapshot();
      setVehicleRows(importedVehicles);
      setVehicleFilters({});
      setVehicleFilterDrafts({});
      setOpenVehicleFilter(null);
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(importedVehicles));
      window.localStorage.setItem(adminStorageKeys.vehiclesSeedVersion, `import:${file.name}:${importedVehicles.length}`);
      if (databaseConfigured && vehiclesDatabaseLoadedRef.current) {
        showSaveStatus("saving", "Сохраняю загруженную технику...");
        void import("@/lib/data/vehicles")
          .then(({ replaceVehiclesInDatabase }) => replaceVehiclesInDatabase(importedVehicles))
          .then(() => {
            vehiclesDatabaseSaveSnapshotRef.current = JSON.stringify(importedVehicles);
            showSaveStatus("saved", "Загруженная техника сохранена.");
          })
          .catch((error) => {
            console.warn("Database vehicles import save failed:", error);
            showSaveStatus("error", `Загруженная техника не сохранена: ${errorToMessage(error)}`);
          });
      }
      addAdminLog({
        action: "Загрузка",
        section: "Техника",
        details: `Загружен список техники: ${importedVehicles.length} строк.`,
        fileName: file.name,
        rowsCount: importedVehicles.length,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Не удалось прочитать Excel-файл.");
    }
  }

  function exportVehiclesToExcel() {
    const blob = createXlsxBlob(createVehicleExportRows(vehicleRows));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spisok-tehniki.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addAdminLog({
      action: "Выгрузка",
      section: "Техника",
      details: `Выгружен список техники: ${vehicleRows.length} строк.`,
      fileName: "spisok-tehniki.xlsx",
      rowsCount: vehicleRows.length,
    });
  }

  function openPtoDateImportFilePicker() {
    ptoPlanImportInputRef.current?.click();
  }

  function currentPtoDateExcelMeta(tab = ptoTab): { table: PtoDateTableKey; label: string; slug: string; section: string; rows: PtoPlanRow[] } {
    const meta = ptoDateTableMeta(tab);
    const rowsByTable: Record<PtoDateTableKey, PtoPlanRow[]> = {
      plan: ptoPlanRows,
      oper: ptoOperRows,
      survey: ptoSurveyRows,
    };

    return { ...meta, rows: rowsByTable[meta.table] };
  }

  function exportPtoDateTableToExcel() {
    const meta = currentPtoDateExcelMeta();
    const rows = createPtoPlanExportRows(meta.rows, ptoPlanYear, ptoAreaFilter, meta.table);
    const fileName = ptoDateExportFileName(meta, ptoPlanYear, ptoAreaFilter);
    const blob = createXlsxBlob(rows, meta.label, {
      columns: createPtoPlanExportColumns(ptoPlanYear, meta.table),
      outlineSummaryRight: false,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addAdminLog({
      action: "Выгрузка",
      section: meta.section,
      details: `Выгружена таблица "${meta.label}" за ${ptoPlanYear} год: ${Math.max(0, rows.length - 1)} строк.`,
      fileName,
      rowsCount: Math.max(0, rows.length - 1),
    });
  }

  function mergeImportedRowsIntoPtoDateTable(table: PtoDateTableKey, importedRows: PtoPlanRow[]) {
    if (table === "oper") {
      setPtoOperRows((current) => mergeImportedPtoPlanRows(current, importedRows));
      setPtoPlanRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
      setPtoSurveyRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
      return;
    }

    if (table === "survey") {
      setPtoSurveyRows((current) => mergeImportedPtoPlanRows(current, importedRows));
      setPtoPlanRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
      setPtoOperRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
      return;
    }

    setPtoPlanRows((current) => mergeImportedPtoPlanRows(current, importedRows, { includeCustomerCode: true }));
    setPtoOperRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
    setPtoSurveyRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
  }

  async function importPtoDateTableFromExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const meta = currentPtoDateExcelMeta();

    try {
      const importedRows = createPtoPlanRowsFromImportTable(await parseTableImportFile(file), ptoPlanYear, meta.rows, meta.table);
      if (!importedRows.length) {
        window.alert(`В выбранном файле не найдены строки таблицы "${meta.label}".`);
        return;
      }

      if (!window.confirm(`Загрузить таблицу "${meta.label}" из файла? Будет обновлено или добавлено строк: ${importedRows.length}.`)) return;

      const firstImportedMonth = importedRows
        .flatMap((row) => Object.keys(row.dailyPlans))
        .filter((date) => date.startsWith(`${ptoPlanYear}-`))
        .sort()[0]?.slice(0, 7) ?? `${ptoPlanYear}-01`;

      mergeImportedRowsIntoPtoDateTable(meta.table, importedRows);
      setPtoManualYears((current) => uniqueSorted([...current, ptoPlanYear]));
      setExpandedPtoMonths((current) => ({ ...current, [firstImportedMonth]: true }));
      requestPtoDatabaseSave();
      addAdminLog({
        action: "Загрузка",
        section: meta.section,
        details: `Загружена таблица "${meta.label}" за ${ptoPlanYear} год: ${importedRows.length} строк.`,
        fileName: file.name,
        rowsCount: importedRows.length,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : `Не удалось прочитать Excel-файл таблицы "${meta.label}".`);
    }
  }

  const commitPtoBucketValue = useCallback((cellKey: string, draft: string) => {
    const parsed = parseDecimalInput(draft);
    const [rowKey, equipmentKey] = cellKey.split("::");
    const bucketRow = ptoBucketRows.find((row) => row.key === rowKey);
    const bucketColumn = ptoBucketColumns.find((column) => column.key === equipmentKey);

    setPtoBucketValues((current) => {
      const next = { ...current };

      if (parsed === null) {
        delete next[cellKey];
      } else {
        next[cellKey] = Math.round(parsed * 100) / 100;
      }

      return next;
    });
    if (databaseConfigured && ptoDatabaseLoadedRef.current) {
      void import("@/lib/data/pto")
        .then(({ savePtoBucketValueToDatabase }) => savePtoBucketValueToDatabase(
          cellKey,
          parsed === null ? null : Math.round(parsed * 100) / 100,
        ))
        .catch((error) => console.warn("Database PTO bucket value save failed:", error));
    }
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО: Ковши",
      details: `Изменена ячейка${bucketRow ? ` ${bucketRow.area} / ${bucketRow.structure}` : ""}${bucketColumn ? `, ${bucketColumn.label}` : ""}.`,
    });
  }, [addAdminLog, ptoBucketColumns, ptoBucketRows, requestPtoDatabaseSave]);

  const clearPtoBucketCells = useCallback((cellKeys: string[]) => {
    if (cellKeys.length === 0) return;

    setPtoBucketValues((current) => {
      const next = { ...current };
      cellKeys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
    if (databaseConfigured && ptoDatabaseLoadedRef.current) {
      void import("@/lib/data/pto")
        .then(({ deletePtoBucketValuesFromDatabase }) => deletePtoBucketValuesFromDatabase(cellKeys))
        .catch((error) => console.warn("Database PTO bucket values delete failed:", error));
    }
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО: Ковши",
      details: `Очищены выбранные ячейки ковшей: ${cellKeys.length}.`,
    });
  }, [addAdminLog, requestPtoDatabaseSave]);

  const addPtoBucketManualRow = useCallback((areaValue: string, structureValue: string) => {
    const fallbackArea = ptoAreaFilter === "Все участки" ? "" : ptoAreaFilter;
    const area = cleanAreaName(areaValue.trim() || fallbackArea).trim();
    const structure = structureValue.trim();

    if (!area || !structure) return false;

    const key = ptoBucketRowKey(area, structure);
    if (ptoBucketManualRows.some((row) => row.key === key) || ptoBucketRows.some((row) => row.key === key)) {
      return false;
    }

    setPtoBucketManualRows((current) => [...current, { key, area, structure, source: "manual" }]);
    if (databaseConfigured && ptoDatabaseLoadedRef.current) {
      void import("@/lib/data/pto")
        .then(({ savePtoBucketRowToDatabase }) => savePtoBucketRowToDatabase({ key, area, structure, source: "manual" }, ptoBucketManualRows.length))
        .catch((error) => console.warn("Database PTO bucket row save failed:", error));
    }
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Добавление",
      section: "ПТО: Ковши",
      details: `Добавлена строка ковшей: ${area} / ${structure}.`,
    });
    return true;
  }, [addAdminLog, ptoAreaFilter, ptoBucketManualRows, ptoBucketRows, requestPtoDatabaseSave]);

  const deletePtoBucketManualRow = useCallback((row: PtoBucketRow) => {
    if (!window.confirm(`Удалить временную строку "${row.area} / ${row.structure}" из ковшей?`)) return;

    setPtoBucketManualRows((current) => current.filter((item) => item.key !== row.key));
    setPtoBucketValues((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${row.key}::`)) delete next[key];
      });
      return next;
    });
    if (databaseConfigured && ptoDatabaseLoadedRef.current) {
      void import("@/lib/data/pto")
        .then(({ deletePtoBucketRowFromDatabase }) => deletePtoBucketRowFromDatabase(row.key))
        .catch((error) => console.warn("Database PTO bucket row delete failed:", error));
    }
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО: Ковши",
      details: `Удалена строка ковшей: ${row.area} / ${row.structure}.`,
    });
  }, [addAdminLog, requestPtoDatabaseSave]);

  function renderPtoDateTable(
    rows: PtoPlanRow[],
    setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>,
    options: { showLocation?: boolean; editableMonthTotal?: boolean } = {},
  ) {
    const showLocation = options.showLocation !== false;
    const showCustomerCode = ptoTab === "plan";
    const editableMonthTotal = options.editableMonthTotal === true;
    const filteredRows = rows.filter((row) => ptoAreaMatches(row.area, ptoAreaFilter) && ptoRowHasYear(row, ptoPlanYear));
    const rowById = new Map(rows.map((row) => [row.id, row] as const));
    const getRowDateTotals = createPtoRowDateTotalsGetter(ptoPlanYear);
    const getEffectiveCarryover = createPtoEffectiveCarryoverGetter(rows, ptoPlanYear);
    const carryoverHeader = `Остатки ${previousPtoYearLabel(ptoPlanYear)}`;
    const {
      displayPtoMonthGroups,
      tableColumns,
      tableMinWidth,
      columnWidthByKey,
    } = createPtoDateTableModel({
      showCustomerCode,
      showLocation,
      planYear: ptoPlanYear,
      reportDate,
      yearMonths: ptoYearMonths,
      monthGroups: ptoMonthGroups,
      editing: ptoDateEditing,
      columnWidths: ptoColumnWidths,
    });
    const togglePtoDateEditing = () => {
      const nextEditing = !ptoDateEditing;
      setPtoDateEditing(nextEditing);
      setDraggedPtoRowId(null);
      setPtoDropTarget(null);
      setPtoFormulaCell(null);
      setPtoFormulaDraft("");
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(null);
      setPtoSelectedCellKeys([]);
      if (!nextEditing) {
        savePtoLocalState();
        requestPtoDatabaseSave();
        window.setTimeout(() => {
          void savePtoDatabaseChanges("manual");
        }, 0);
      }
    };
    const ptoDateToolbar = (
      <PtoDateToolbar
        areaTabs={ptoAreaTabs}
        areaFilter={ptoAreaFilter}
        onSelectArea={selectPtoArea}
        showExcelControls={["plan", "oper", "survey"].includes(ptoTab)}
        excelLabel={currentPtoDateExcelMeta().label}
        editing={ptoDateEditing}
        onExport={exportPtoDateTableToExcel}
        onOpenImport={openPtoDateImportFilePicker}
        onImportChange={importPtoDateTableFromExcel}
        importInputRef={ptoPlanImportInputRef}
        onToggleEditing={togglePtoDateEditing}
        yearTabs={ptoYearTabs}
        selectedYear={ptoPlanYear}
        onSelectYear={selectPtoPlanYear}
        onDeleteYear={deletePtoYear}
        onOpenYearDialog={() => {
          setPtoYearInput("");
          setPtoYearDialogOpen(true);
        }}
        yearDialogOpen={ptoYearDialogOpen}
        yearInput={ptoYearInput}
        onYearInputChange={setPtoYearInput}
        onAddYear={addPtoYear}
        onCloseYearDialog={() => {
          setPtoYearDialogOpen(false);
          setPtoYearInput("");
        }}
      />
    );
    if (!ptoDateEditing) {
      return (
        <PtoDateReadonlyTable
          rows={filteredRows}
          showCustomerCode={showCustomerCode}
          showLocation={showLocation}
          ptoPlanYear={ptoPlanYear}
          ptoTab={ptoTab}
          reportDate={reportDate}
          carryoverHeader={carryoverHeader}
          displayMonthGroups={displayPtoMonthGroups}
          tableColumns={tableColumns}
          tableMinWidth={tableMinWidth}
          columnWidthByKey={columnWidthByKey}
          rowHeights={ptoRowHeights}
          scrollRef={ptoDateTableScrollRef}
          getEffectiveCarryover={getEffectiveCarryover}
          getRowDateTotals={getRowDateTotals}
          headerLabel={ptoHeaderLabel}
          onToggleMonth={(month) => {
            setExpandedPtoMonths((current) => ({ ...current, [month]: !current[month] }));
            requestPtoDatabaseSave();
          }}
          toolbar={ptoDateToolbar}
        />
      );
    }

    const activeFormulaCell = ptoFormulaCell?.table === ptoTab && ptoFormulaCell.year === ptoPlanYear ? ptoFormulaCell : null;
    const activeInlineEditCell = ptoInlineEditCell?.table === ptoTab && ptoInlineEditCell.year === ptoPlanYear ? ptoInlineEditCell : null;
    const activeFormulaRow = activeFormulaCell ? rowById.get(activeFormulaCell.rowId) : undefined;
    const formulaValueContext = { rowById, getEffectiveCarryover, getRowDateTotals };
    const activeFormulaValue = activeFormulaCell
      ? getPtoFormulaCellValue(activeFormulaCell, formulaValueContext)
      : undefined;
    const formulaInputDisabled = !ptoDateEditing || !activeFormulaCell || !activeFormulaRow || activeFormulaCell.editable === false;
    const virtualRows = ptoDateEditing
      ? calculatePtoVirtualRows(filteredRows, ptoRowHeights, ptoTab, ptoDateViewport)
      : null;
    const renderedRows = virtualRows?.renderedRows ?? filteredRows;
    const filteredRowHeights = virtualRows?.rowHeights ?? [];
    const rowOffsets = virtualRows?.rowOffsets ?? [];
    const virtualStartIndex = virtualRows?.startIndex ?? 0;
    const topSpacerHeight = virtualRows?.topSpacerHeight ?? 0;
    const bottomSpacerHeight = virtualRows?.bottomSpacerHeight ?? 0;
    const virtualRowsTotalHeight = virtualRows?.totalHeight ?? 0;
    const ptoColumnResizeHandler = ptoDateEditing ? startPtoColumnResize : undefined;
    const rowOffsetAt = (index: number) => rowOffsets[index] ?? virtualRowsTotalHeight;
    const tableSpacerColSpan = tableColumns.length;
    const {
      formulaCellDomKey,
      formulaSelectionKey,
      formulaCellsByRowId,
      formulaSelectionScope,
      selectedFormulaCellKeys,
      formulaCellTemplates,
      formulaTemplateIndexByKey,
      formulaRowIndexById,
      formulaCellFromTemplate,
      formulaCellFromSelectionKey,
      formulaRangeKeys,
      formulaCellSelected,
    } = createPtoDateFormulaModel({
      table: ptoTab,
      year: ptoPlanYear,
      renderedRows,
      filteredRows,
      displayMonthGroups: displayPtoMonthGroups,
      editableMonthTotal,
      carryoverHeader,
      selectedCellKeys: ptoSelectedCellKeys,
    });
    const scrollFormulaCellIntoView = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => {
      if (!ptoDateEditing) return;

      const scrollElement = ptoDateTableScrollRef.current;
      const rowIndex = filteredRows.findIndex((row) => row.id === cell.rowId);
      if (!scrollElement || rowIndex < 0) return;

      const rowTop = ptoDateVirtualHeaderOffset + rowOffsetAt(rowIndex);
      const rowBottom = rowTop + (filteredRowHeights[rowIndex] ?? ptoDateVirtualDefaultRowHeight);
      const viewTop = scrollElement.scrollTop;
      const viewBottom = viewTop + scrollElement.clientHeight;

      if (rowTop < viewTop + 24) {
        scrollElement.scrollTop = Math.max(0, rowTop - 24);
      } else if (rowBottom > viewBottom - 24) {
        scrollElement.scrollTop = Math.max(0, rowBottom - scrollElement.clientHeight + 48);
      }

      updatePtoDateViewportFromElement(scrollElement);
    };

    const focusFormulaCell = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => {
      const focusTarget = () => {
        const target = document.querySelector<HTMLInputElement>(`[data-pto-cell-key="${formulaCellDomKey(cell)}"]`);
        if (!target) return false;

        target.focus();
        return true;
      };

      window.requestAnimationFrame(() => {
        const focused = focusTarget();
        if (focused) return;

        scrollFormulaCellIntoView(cell);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(focusTarget);
        });
      });
    };

    const selectFormulaCell = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      if (!ptoDateEditing) return;

      const nextCell = withPtoFormulaScope(cell, ptoTab, ptoPlanYear);
      setPtoFormulaCell(nextCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(nextCell);
      setPtoSelectedCellKeys([formulaSelectionKey(nextCell)]);
    };

    const selectFormulaRange = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      if (!ptoDateEditing) return;

      const targetCell = withPtoFormulaScope(cell, ptoTab, ptoPlanYear);
      const anchorCell = resolvePtoFormulaAnchor(ptoSelectionAnchorCell, ptoTab, ptoPlanYear, targetCell);

      setPtoFormulaCell(targetCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(anchorCell);
      setPtoSelectedCellKeys(formulaRangeKeys(anchorCell, targetCell));
    };

    const toggleFormulaCell = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      if (!ptoDateEditing) return;

      const targetCell = withPtoFormulaScope(cell, ptoTab, ptoPlanYear);
      const targetKey = formulaSelectionKey(targetCell);

      setPtoFormulaCell(targetCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(targetCell);
      setPtoSelectedCellKeys((currentKeys) => togglePtoFormulaSelectionKeys(currentKeys, formulaSelectionScope, targetKey));
    };

    const startInlineFormulaEdit = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, draftOverride?: string) => {
      if (!ptoDateEditing) return;

      const nextCell = withPtoFormulaScope(cell, ptoTab, ptoPlanYear);
      const draft = draftOverride ?? formatPtoFormulaNumber(value);
      setPtoFormulaCell(nextCell);
      setPtoInlineEditCell(nextCell);
      setPtoFormulaDraft(draft);
      setPtoInlineEditInitialDraft(draft);
    };

    const cancelInlineFormulaEdit = () => {
      setPtoFormulaDraft(ptoInlineEditInitialDraft);
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
    };

    const formulaCellActive = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => (
      ptoFormulaCellMatches(activeFormulaCell, ptoTab, ptoPlanYear, rowId, kind, key)
    );
    const formulaCellEditing = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => (
      ptoFormulaCellMatches(activeInlineEditCell, ptoTab, ptoPlanYear, rowId, kind, key)
    );
    const commitFormulaCellValue = (cell: PtoFormulaCell, value: string) => {
      if (!ptoDateEditing) return false;
      if (cell.editable === false) return false;
      if (value.trim() !== "" && parseDecimalInput(value) === null) return false;

      if (cell.kind === "carryover") {
        if (value.trim() === "") {
          clearPtoCarryoverOverride(setRows, cell.rowId, ptoPlanYear);
          return true;
        }

        updatePtoDateRow(setRows, cell.rowId, "carryover", value);
        return true;
      }

      if (cell.kind === "month" && cell.days) {
        updatePtoMonthTotal(setRows, cell.rowId, cell.days, value);
        return true;
      }

      if (cell.kind === "day" && cell.day) {
        updatePtoDateDay(setRows, cell.rowId, cell.day, value);
        return true;
      }

      return false;
    };

    const clearSelectedFormulaCells = (fallbackCell: Omit<PtoFormulaCell, "table" | "year">) => {
      const cellsToClear = selectedPtoFormulaCells(selectedFormulaCellKeys, formulaCellFromSelectionKey);
      const targetCells = cellsToClear.length ? cellsToClear : [fallbackCell];
      let committed = false;

      targetCells.forEach((targetCell) => {
        committed = commitFormulaCellValue({ ...targetCell, table: ptoTab, year: ptoPlanYear }, "") || committed;
      });

      if (!committed) return false;

      const nextActiveCell = resolvePtoFormulaActiveAfterClear(activeFormulaCell, targetCells, ptoTab, ptoPlanYear);

      setPtoFormulaCell(nextActiveCell);
      setPtoFormulaDraft("");
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(nextActiveCell);
      setPtoSelectedCellKeys(targetCells.map((targetCell) => formulaSelectionKey(targetCell)));
      requestPtoDatabaseSave();
      return true;
    };

    const collapseFormulaSelection = (fallbackCell: Omit<PtoFormulaCell, "table" | "year">) => {
      const nextActiveCell = activeFormulaCell ?? withPtoFormulaScope(fallbackCell, ptoTab, ptoPlanYear);

      setPtoFormulaCell(nextActiveCell);
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(nextActiveCell);
      setPtoSelectedCellKeys([formulaSelectionKey(nextActiveCell)]);
    };

    const commitInlineFormulaEdit = () => {
      if (!activeInlineEditCell) return;
      const committed = commitFormulaCellValue(activeInlineEditCell, ptoFormulaDraft);
      if (!committed) return;

      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoFormulaDraft(ptoFormulaDraft.trim() ? formatPtoFormulaNumber(parseDecimalValue(ptoFormulaDraft)) : "");
      requestPtoDatabaseSave();
    };

    const handleInlineFormulaKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitInlineFormulaEdit();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelInlineFormulaEdit();
      }
    };

    const updateFormulaValue = (value: string) => {
      if (!ptoDateEditing) return;

      setPtoFormulaDraft(value);
      if (activeInlineEditCell) return;
      if (!activeFormulaCell || !activeFormulaRow || activeFormulaCell.editable === false) return;
      commitFormulaCellValue(activeFormulaCell, value);
    };

    const moveFormulaSelection = (key: string) => {
      if (!ptoDateEditing) return;
      if (!activeFormulaCell || !isEditableGridArrowKey(key)) return;

      const nextCell = resolvePtoFormulaMoveTarget({
        activeCell: activeFormulaCell,
        key,
        rowIndexById: formulaRowIndexById,
        templateIndexByKey: formulaTemplateIndexByKey,
        templates: formulaCellTemplates,
        filteredRows,
        formulaCellFromTemplate,
      });

      if (!nextCell) return;
      selectFormulaCell(nextCell, getPtoFormulaCellValue(nextCell, formulaValueContext));
      focusFormulaCell(nextCell);
    };

    const handleFormulaCellKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, isEditing: boolean) => {
      if (!ptoDateEditing) return;

      if (isEditing) {
        if (isEditableGridArrowKey(event.key)) {
          event.preventDefault();
          if (!activeInlineEditCell) return;

          const committed = commitFormulaCellValue(activeInlineEditCell, ptoFormulaDraft);
          if (!committed) return;

          setPtoInlineEditCell(null);
          setPtoInlineEditInitialDraft("");
          moveFormulaSelection(event.key);
          requestPtoDatabaseSave();
          return;
        }

        handleInlineFormulaKeyDown(event);
        return;
      }

      if (isEditableGridArrowKey(event.key)) {
        event.preventDefault();
        moveFormulaSelection(event.key);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        collapseFormulaSelection(cell);
        return;
      }

      if (cell.editable === false) return;

      if (/^[0-9]$/.test(event.key) || event.key === "-" || event.key === "," || event.key === ".") {
        event.preventDefault();
        startInlineFormulaEdit(cell, value, event.key === "." || event.key === "," ? "0," : event.key);
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        clearSelectedFormulaCells(cell);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        startInlineFormulaEdit(cell, value);
      }
    };

    const handleFormulaCellMouseDown = (event: React.MouseEvent<HTMLElement>, cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, isEditing: boolean) => {
      if (!ptoDateEditing) return;
      if (event.button !== 0 || isEditing) return;

      ptoSelectionDraggingRef.current = true;
      if (event.ctrlKey || event.metaKey) {
        toggleFormulaCell(cell, value);
      } else if (event.shiftKey) {
        selectFormulaRange(cell, value);
      } else {
        selectFormulaCell(cell, value);
      }
    };

    const handleFormulaCellMouseEnter = (event: React.MouseEvent<HTMLElement>, cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, isEditing: boolean) => {
      if (!ptoDateEditing) return;
      if (!ptoSelectionDraggingRef.current || event.buttons !== 1 || event.ctrlKey || event.metaKey || isEditing) return;
      selectFormulaRange(cell, value);
    };

    const addPtoRowAfter = (row: PtoPlanRow) => {
      if (!ptoDateEditing) return;

      const nextRowId = addLinkedPtoDateRow({
        area: row.area,
        location: row.location,
        customerCode: showCustomerCode ? row.customerCode : "",
        unit: row.unit,
      }, row);
      setPtoPendingFieldFocus({ rowId: nextRowId, field: "structure" });
    };

    const ptoDraftHasValue = Object.values(ptoDraftRowFields).some((value) => value.trim());
    const updatePtoDraftField = (field: "area" | "location" | "customerCode" | "structure" | "unit", value: string) => {
      setPtoDraftRowFields((current) => ({ ...current, [field]: value }));
    };
    const clearPtoDraftRow = () => setPtoDraftRowFields({ ...emptyPtoDraftRowFields });
    const commitPtoDraftRow = (focusField: "area" | "location" | "structure" = "structure") => {
      if (!ptoDateEditing || !ptoDraftHasValue) return null;

      const nextRowId = addLinkedPtoDateRow({
        area: ptoDraftRowFields.area.trim(),
        location: ptoDraftRowFields.location.trim(),
        customerCode: showCustomerCode ? normalizePtoCustomerCode(ptoDraftRowFields.customerCode) : "",
        structure: ptoDraftRowFields.structure.trim(),
        unit: normalizePtoUnit(ptoDraftRowFields.unit),
      });
      clearPtoDraftRow();
      setPtoPendingFieldFocus({ rowId: nextRowId, field: focusField });

      return nextRowId;
    };
    const handlePtoDraftKeyDown = (event: React.KeyboardEvent<HTMLElement>, focusField: "area" | "location" | "structure" = "structure") => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitPtoDraftRow(focusField);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearPtoDraftRow();
      }
    };

    const addPtoRowFromDraft = () => {
      if (!ptoDateEditing) return;
      if (commitPtoDraftRow(ptoAreaFilter === "Все участки" ? "area" : "structure")) return;

      const nextRowId = addLinkedPtoDateRow();
      setPtoPendingFieldFocus({ rowId: nextRowId, field: ptoAreaFilter === "Все участки" ? "area" : "structure" });
    };

    const renderPtoHeaderText = (key: string, fallback: string, align: React.CSSProperties["textAlign"] = "left") => {
      return (
        <PtoEditableHeaderText
          columnKey={key}
          fallback={fallback}
          label={ptoHeaderLabel(key, fallback)}
          align={align}
          editing={editingPtoHeaderKey === key}
          editingEnabled={ptoDateEditing}
          draft={ptoHeaderDraft}
          onDraftChange={setPtoHeaderDraft}
          onStartEdit={startPtoHeaderEdit}
          onCommit={commitPtoHeaderEdit}
          onCancel={cancelPtoHeaderEdit}
        />
      );
    };

    const renderPtoMonthHeader = (month: string, fallback: string, expanded: boolean) => {
      const key = `month-group:${month}`;

      return (
        <PtoEditableMonthHeader
          columnKey={key}
          fallback={fallback}
          label={ptoHeaderLabel(key, fallback)}
          editing={editingPtoHeaderKey === key}
          editingEnabled={ptoDateEditing}
          draft={ptoHeaderDraft}
          expanded={expanded}
          icon={expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
          onDraftChange={setPtoHeaderDraft}
          onStartEdit={startPtoHeaderEdit}
          onCommit={commitPtoHeaderEdit}
          onCancel={cancelPtoHeaderEdit}
          onToggle={() => {
            setExpandedPtoMonths((current) => ({ ...current, [month]: !current[month] }));
            requestPtoDatabaseSave();
          }}
        />
      );
    };

    return (
      <div style={ptoDateTableLayoutStyle}>
        {ptoDateToolbar}

        {ptoDateEditing ? (
          <PtoFormulaBar
            value={activeFormulaCell ? ptoFormulaDraft : ""}
            disabled={formulaInputDisabled}
            onValueChange={updateFormulaValue}
            onBlur={() => {
              if (activeFormulaCell) setPtoFormulaDraft(formatPtoFormulaNumber(activeFormulaValue));
              requestPtoDatabaseSave();
            }}
          />
        ) : null}

        <div ref={ptoDateTableScrollRef} onScroll={ptoDateEditing ? handlePtoDateTableScroll : undefined} style={ptoDateTableScrollStyle}>
          <table style={{ ...ptoPlanTableStyle, width: tableMinWidth, minWidth: tableMinWidth, marginRight: 40 }}>
            <colgroup>
              {tableColumns.map((column) => (
                <col key={column.key} style={{ width: column.width }} />
              ))}
            </colgroup>
            <PtoDateEditableHeaders
              showCustomerCode={showCustomerCode}
              showLocation={showLocation}
              ptoPlanYear={ptoPlanYear}
              carryoverHeader={carryoverHeader}
              monthGroups={displayPtoMonthGroups}
              columnWidthByKey={columnWidthByKey}
              onResizeStart={ptoColumnResizeHandler}
              renderHeaderText={renderPtoHeaderText}
              renderMonthHeader={renderPtoMonthHeader}
            />
            <tbody>
              <PtoVirtualSpacerRow height={topSpacerHeight} colSpan={tableSpacerColSpan} />
              {renderedRows.map((row, renderedRowIndex) => {
                const rowIndex = virtualStartIndex + renderedRowIndex;
                const rowAreaFilter = cleanAreaName(row.area) || "Все участки";
                const rowAreaKey = rowAreaFilter === "Все участки" ? ptoDateOptionMaps.allAreasKey : normalizeLookupValue(rowAreaFilter);
                const rowLocationKey = normalizeLookupValue(row.location);
                const locationOptions = showLocation
                  ? ptoDateOptionMaps.locationsByArea.get(rowAreaKey) ?? []
                  : [];
                const structureOptions = showLocation && rowLocationKey
                  ? ptoDateOptionMaps.structuresByAreaLocation.get(`${rowAreaKey}:${rowLocationKey}`) ?? []
                  : ptoDateOptionMaps.structuresByArea.get(rowAreaKey) ?? [];
                const locationListId = `pto-location-${row.id}`;
                const structureListId = `pto-structure-${row.id}`;
                const isDropTarget = ptoDropTarget?.rowId === row.id;
                const dropLineStyle = ptoDateEditing && isDropTarget
                  ? {
                      ...ptoDropIndicatorStyle,
                      width: tableMinWidth,
                      ...(ptoDropTarget.position === "before" ? { top: -2 } : { bottom: -2 }),
                    }
                  : null;
                const showInlineAddRowButton = ptoDateEditing && rowIndex < filteredRows.length - 1;
                const carryoverCellActive = ptoDateEditing && formulaCellActive(row.id, "carryover");
                const carryoverCellSelected = ptoDateEditing && formulaCellSelected(row.id, "carryover");
                const carryoverCellEditing = ptoDateEditing && formulaCellEditing(row.id, "carryover");
                const rowStatus = ptoAutomatedStatus(row, reportDate);
                const effectiveCarryover = getEffectiveCarryover(row);
                const rowDateTotals = getRowDateTotals(row);
                const rowYearTotalWithCarryover = Math.round(((rowDateTotals?.yearDailyTotal ?? 0) + effectiveCarryover) * 1000000) / 1000000;
                const rowFormulaCells = formulaCellsByRowId.get(row.id) ?? [];
                const carryoverCell = rowFormulaCells.find((cell) => cell.kind === "carryover") ?? { rowId: row.id, kind: "carryover" as const, label: carryoverHeader };
                const rowHeightKey = `${ptoTab}:${row.id}`;
                const rowHeight = ptoRowHeights[rowHeightKey];

                return (
                  <tr
                    key={row.id}
                    style={{ background: ptoStatusRowBackground(rowStatus), ...(rowHeight ? { height: rowHeight } : null) }}
                    onDragOver={(event) => {
                      if (!ptoDateEditing) return;
                      event.preventDefault();
                      if (!draggedPtoRowId || draggedPtoRowId === row.id) {
                        setPtoDropTarget(null);
                        return;
                      }

                      const position = getPtoDropPosition(event);
                      setPtoDropTarget((current) =>
                        current?.rowId === row.id && current.position === position
                          ? current
                          : { rowId: row.id, position },
                      );
                    }}
                    onDragLeave={(event) => {
                      if (!ptoDateEditing) return;
                      const nextTarget = event.relatedTarget as Node | null;
                      if (nextTarget && event.currentTarget.contains(nextTarget)) return;

                      setPtoDropTarget((current) => (current?.rowId === row.id ? null : current));
                    }}
                    onDrop={(event) => {
                      if (!ptoDateEditing) return;
                      event.preventDefault();
                      if (draggedPtoRowId && draggedPtoRowId !== row.id) {
                        const position = ptoDropTarget?.rowId === row.id ? ptoDropTarget.position : getPtoDropPosition(event);
                        moveLinkedPtoDateRow(draggedPtoRowId, row.id, filteredRows, position);
                      }
                      setDraggedPtoRowId(null);
                      setPtoDropTarget(null);
                    }}
                  >
                    {showCustomerCode ? (
                      <PtoPlanTd align="center">
                        <PtoCustomerCodeCell
                          editing={ptoDateEditing}
                          value={row.customerCode}
                          dataFieldKey={ptoRowFieldDomKey(row.id, "customerCode")}
                          onChange={(value) => {
                            updatePtoDateRow(setRows, row.id, "customerCode", value);
                            requestPtoDatabaseSave();
                          }}
                        />
                      </PtoPlanTd>
                    ) : null}
                    <PtoPlanTd>
                      {dropLineStyle ? <span style={dropLineStyle} /> : null}
                      {ptoDateEditing ? (
                        <button
                        type="button"
                        onClick={() => removeLinkedPtoDateRow(row)}
                        style={{ ...ptoRowDeleteButtonStyle, left: tableMinWidth + 8 }}
                        title={`Удалить строку: ${row.structure || "ПТО"}`}
                        aria-label={`Удалить строку: ${row.structure || "ПТО"}`}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      ) : null}
                      {ptoDateEditing ? (
                        <span
                          onMouseDown={(event) => startPtoRowResize(event, rowHeightKey)}
                          style={ptoRowResizeHandleStyle}
                          title="Потяни вниз или вверх, чтобы изменить высоту строки"
                          aria-hidden
                        />
                      ) : null}
                      {showInlineAddRowButton ? (
                        <button
                          type="button"
                          onClick={() => addPtoRowAfter(row)}
                          onMouseEnter={() => setHoveredPtoAddRowId(row.id)}
                          onMouseLeave={() => setHoveredPtoAddRowId((current) => (current === row.id ? null : current))}
                          style={{
                            ...ptoInlineAddRowButtonStyle,
                            ...(hoveredPtoAddRowId === row.id ? ptoInlineAddRowButtonHoverStyle : null),
                          }}
                          title="Добавить строку ниже"
                          aria-label="Добавить строку ниже"
                        >
                          +
                        </button>
                      ) : null}
                      <div style={ptoAreaCellStyle}>
                        {ptoDateEditing ? (
                          <div style={ptoRowToolsStyle}>
                          <button
                            type="button"
                            draggable
                            onDragStart={() => {
                              setDraggedPtoRowId(row.id);
                              setPtoDropTarget(null);
                            }}
                            onDragEnd={() => {
                              setDraggedPtoRowId(null);
                              setPtoDropTarget(null);
                            }}
                            style={dragHandleStyle}
                            title="Перетащи строку"
                            aria-label="Перетащи строку"
                          >
                            <span style={dragHandleDotsStyle} aria-hidden>
                              <span style={dragHandleDotStyle} />
                              <span style={dragHandleDotStyle} />
                              <span style={dragHandleDotStyle} />
                            </span>
                          </button>
                          </div>
                        ) : null}
                        <PtoDateEditableTextCell
                          editing={ptoDateEditing}
                          value={row.area}
                          draftValue={getPtoRowTextDraft(row, "area")}
                          dataFieldKey={ptoRowFieldDomKey(row.id, "area")}
                          listId="pto-area-options"
                          placeholder="Уч_Аксу"
                          onBeginDraft={() => beginPtoRowTextDraft(row, "area")}
                          onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "area", value)}
                          onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "area")}
                          onCancelDraft={() => cancelPtoRowTextDraft(row.id, "area")}
                        />
                      </div>
                    </PtoPlanTd>
                    {showLocation ? (
                      <PtoPlanTd>
                        <PtoDateEditableTextCell
                          editing={ptoDateEditing}
                          value={row.location}
                          draftValue={getPtoRowTextDraft(row, "location")}
                          dataFieldKey={ptoRowFieldDomKey(row.id, "location")}
                          listId={locationListId}
                          options={locationOptions}
                          placeholder="Карьер"
                          onBeginDraft={() => beginPtoRowTextDraft(row, "location")}
                          onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "location", value)}
                          onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "location")}
                          onCancelDraft={() => cancelPtoRowTextDraft(row.id, "location")}
                        />
                      </PtoPlanTd>
                    ) : null}
                    <PtoPlanTd>
                      <PtoDateEditableTextCell
                        editing={ptoDateEditing}
                        value={row.structure}
                        draftValue={getPtoRowTextDraft(row, "structure")}
                        dataFieldKey={ptoRowFieldDomKey(row.id, "structure")}
                        listId={structureListId}
                        options={structureOptions}
                        placeholder="Вид работ"
                        onBeginDraft={() => beginPtoRowTextDraft(row, "structure")}
                        onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "structure", value)}
                        onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "structure")}
                        onCancelDraft={() => cancelPtoRowTextDraft(row.id, "structure")}
                      />
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <PtoUnitCell
                        editing={ptoDateEditing}
                        value={row.unit}
                        dataFieldKey={ptoRowFieldDomKey(row.id, "unit")}
                        onChange={(value) => {
                          updatePtoDateRow(setRows, row.id, "unit", value);
                          requestPtoDatabaseSave();
                        }}
                      />
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <PtoStatusCell status={rowStatus} />
                    </PtoPlanTd>
                    <PtoPlanTd active={carryoverCellActive} selected={carryoverCellSelected} editing={carryoverCellEditing} align="center">
                      {ptoDateEditing ? (
                        <PtoDateFormulaInput
                          cell={carryoverCell}
                          value={effectiveCarryover}
                          editing={carryoverCellEditing}
                          draft={ptoFormulaDraft}
                          dataCellKey={formulaCellDomKey(carryoverCell)}
                          style={{ ...ptoPlanInputStyle, ...ptoCompactNumberInputStyle }}
                          shouldSkipFocusSelection={() => ptoSelectionDraggingRef.current}
                          onSelectCell={selectFormulaCell}
                          onSelectRange={selectFormulaRange}
                          onStartEdit={startInlineFormulaEdit}
                          onDraftChange={updateFormulaValue}
                          onCommitEdit={commitInlineFormulaEdit}
                          onMouseDown={handleFormulaCellMouseDown}
                          onMouseEnter={handleFormulaCellMouseEnter}
                          onKeyDown={handleFormulaCellKeyDown}
                        />
                      ) : <PtoReadonlyNumberCell value={effectiveCarryover} />}
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <div style={{ fontWeight: 800, textAlign: "center" }} title={formatPtoFormulaNumber(rowYearTotalWithCarryover)}>{formatPtoCellNumber(rowYearTotalWithCarryover)}</div>
                    </PtoPlanTd>
                    {displayPtoMonthGroups.map((group) => {
                      const monthTotal = rowDateTotals?.monthTotals.get(group.month);
                      const monthValue = monthTotal?.hasValue ? monthTotal.value : undefined;
                      const monthCellActive = ptoDateEditing && formulaCellActive(row.id, "month", group.month);
                      const monthCellSelected = ptoDateEditing && formulaCellSelected(row.id, "month", group.month);
                      const monthCellEditing = ptoDateEditing && formulaCellEditing(row.id, "month", group.month);
                      const monthCell = {
                        rowId: row.id,
                        kind: "month" as const,
                        month: group.month,
                        days: group.days,
                        label: group.label,
                        editable: editableMonthTotal,
                      };

                      return (
                        <Fragment key={`${row.id}-${group.month}`}>
                          <PtoPlanTd active={monthCellActive} selected={monthCellSelected} editing={monthCellEditing} align="center">
                            {ptoDateEditing && editableMonthTotal ? (
                              <PtoDateFormulaInput
                                cell={monthCell}
                                value={monthValue}
                                editing={monthCellEditing}
                                draft={ptoFormulaDraft}
                                dataCellKey={formulaCellDomKey(monthCell)}
                                placeholder="Месяц"
                                style={{ ...ptoPlanDayInputStyle, ...ptoCompactNumberInputStyle, fontWeight: 800 }}
                                shouldSkipFocusSelection={() => ptoSelectionDraggingRef.current}
                                onSelectCell={selectFormulaCell}
                                onSelectRange={selectFormulaRange}
                                onStartEdit={startInlineFormulaEdit}
                                onDraftChange={updateFormulaValue}
                                onCommitEdit={commitInlineFormulaEdit}
                                onMouseDown={handleFormulaCellMouseDown}
                                onMouseEnter={handleFormulaCellMouseEnter}
                                onKeyDown={handleFormulaCellKeyDown}
                              />
                            ) : ptoDateEditing ? (
                              <button
                                type="button"
                                onMouseDown={(event) => handleFormulaCellMouseDown(event, { ...monthCell, editable: false }, monthValue, false)}
                                onMouseEnter={(event) => handleFormulaCellMouseEnter(event, { ...monthCell, editable: false }, monthValue, false)}
                                onClick={(event) => {
                                  if (event.ctrlKey || event.metaKey) {
                                    return;
                                  }

                                  if (event.shiftKey) {
                                    selectFormulaRange({ ...monthCell, editable: false }, monthValue);
                                  } else {
                                    selectFormulaCell({ ...monthCell, editable: false }, monthValue);
                                  }
                                }}
                                title={formatPtoFormulaNumber(monthValue)}
                                style={ptoReadonlyTotalStyle}
                              >
                                {formatPtoCellNumber(monthValue)}
                              </button>
                            ) : <PtoReadonlyNumberCell value={monthValue} bold />}
                          </PtoPlanTd>
                          {group.expanded && group.days.map((day) => {
                            const dayValue = row.dailyPlans[day];
                            const dayCellActive = ptoDateEditing && formulaCellActive(row.id, "day", day);
                            const dayCellSelected = ptoDateEditing && formulaCellSelected(row.id, "day", day);
                            const dayCellEditing = ptoDateEditing && formulaCellEditing(row.id, "day", day);
                            const dayLabel = `${day.slice(8, 10)}.${day.slice(5, 7)}`;
                            const dayCell = {
                              rowId: row.id,
                              kind: "day" as const,
                              day,
                              label: dayLabel,
                            };

                            return (
                              <PtoPlanTd key={day} active={dayCellActive} selected={dayCellSelected} editing={dayCellEditing} align="center">
                                {ptoDateEditing ? (
                                  <PtoDateFormulaInput
                                    cell={dayCell}
                                    value={dayValue}
                                    editing={dayCellEditing}
                                    draft={ptoFormulaDraft}
                                    dataCellKey={formulaCellDomKey(dayCell)}
                                    style={{ ...ptoPlanDayInputStyle, ...ptoCompactNumberInputStyle }}
                                    shouldSkipFocusSelection={() => ptoSelectionDraggingRef.current}
                                    onSelectCell={selectFormulaCell}
                                    onSelectRange={selectFormulaRange}
                                    onStartEdit={startInlineFormulaEdit}
                                    onDraftChange={updateFormulaValue}
                                    onCommitEdit={commitInlineFormulaEdit}
                                    onMouseDown={handleFormulaCellMouseDown}
                                    onMouseEnter={handleFormulaCellMouseEnter}
                                    onKeyDown={handleFormulaCellKeyDown}
                                  />
                                ) : <PtoReadonlyNumberCell value={dayValue} />}
                              </PtoPlanTd>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tr>
                );
              })}
              <PtoVirtualSpacerRow height={bottomSpacerHeight} colSpan={tableSpacerColSpan} />
              {ptoDateEditing ? (
                <PtoDateDraftRow
                  showCustomerCode={showCustomerCode}
                  showLocation={showLocation}
                  fields={ptoDraftRowFields}
                  monthGroups={displayPtoMonthGroups}
                  onUpdateField={updatePtoDraftField}
                  onKeyDown={handlePtoDraftKeyDown}
                  onAddRow={addPtoRowFromDraft}
                />
              ) : null}
            </tbody>
          </table>
        </div>
        <datalist id="pto-area-options">
          {ptoAreaTabs.filter((area) => area !== "Все участки").map((area) => (
            <option key={area} value={`Уч_${area}`} />
          ))}
        </datalist>
      </div>
    );
  }

  function renderReportHeaderText(key: string, fallback: string) {
    const isEditing = editingReportHeaderKey === key;

    if (isEditing) {
      return (
        <input
          autoFocus
          value={reportHeaderDraft}
          onChange={(event) => setReportHeaderDraft(event.target.value)}
          onBlur={(event) => {
            if (event.currentTarget.dataset.cancelReportHeaderEdit === "true") return;
            commitReportHeaderEdit(key, fallback);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitReportHeaderEdit(key, fallback);
            }

            if (event.key === "Escape") {
              event.preventDefault();
              event.currentTarget.dataset.cancelReportHeaderEdit = "true";
              cancelReportHeaderEdit();
            }
          }}
          onClick={(event) => event.stopPropagation()}
          style={reportHeaderInputStyle}
        />
      );
    }

    return (
      <button
        type="button"
        onDoubleClick={(event) => {
          event.stopPropagation();
          startReportHeaderEdit(key, fallback);
        }}
        style={reportHeaderLabelButtonStyle}
        title="Двойной клик — переименовать заголовок"
      >
        {reportHeaderLabel(key, fallback)}
      </button>
    );
  }

  const printReport = useCallback(() => {
    window.print();
  }, []);

  const renderPtoDatabaseGate = () => (
    <SectionCard title="">
      <div style={blockStyle}>{ptoDatabaseMessage}</div>
    </SectionCard>
  );
  const shouldGatePtoDatabase = databaseConfigured && !ptoDatabaseReady;

  return (
    <div className="app-print-root" style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px", fontFamily: "var(--app-font)", color: "#0f172a", lineHeight: 1.35 }}>
      <style>{`${reportPrintCss}\n@media print { .app-save-status { display: none !important; } }`}</style>
      <SaveStatusIndicator status={saveStatus} onClose={hideSaveStatus} />
      <div className="app-print-shell" style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
        <div className="app-print-header" style={{ background: "#ffffff", borderRadius: 18, padding: 20, boxShadow: "0 4px 16px rgba(15,23,42,0.06)", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 130, flex: "0 0 130px" }}>
              <Image src="/mining-logo.png" alt="Логотип" width={112} height={72} style={logoImageStyle} priority />
            </div>
            <div ref={headerNavRef} style={{ ...headerNavStackStyle, ...(headerHasSubtabs ? headerNavStackPtoStyle : null) }}>
              <div style={headerMainTabsStyle}>
                {topTabs.filter((tab) => tab.visible).map((tab) => {
                  if (tab.id === "reports" && topTab === "reports") {
                    return (
                      <div key={tab.id} ref={activeHeaderTabRef} style={headerActiveTabWithSubtabsStyle}>
                        <TopButton active={topTab === tab.id} onClick={() => selectTopTab(tab.id)} label={compactTopTabLabel(tab)} />
                      </div>
                    );
                  }

                  if (tab.id === "dispatch" && topTab === "dispatch") {
                    return (
                      <div key={tab.id} ref={activeHeaderTabRef} style={headerActiveTabWithSubtabsStyle}>
                        <TopButton active={topTab === tab.id} onClick={() => selectTopTab(tab.id)} label={compactTopTabLabel(tab)} />
                      </div>
                    );
                  }

                  if (tab.id === "pto" && topTab === "pto") {
                    return (
                      <div key={tab.id} ref={activeHeaderTabRef} style={headerActiveTabWithSubtabsStyle}>
                        <TopButton active={topTab === tab.id} onClick={() => selectTopTab(tab.id)} label={compactTopTabLabel(tab)} />
                      </div>
                    );
                  }

                  if (tab.id === "admin" && topTab === "admin") {
                    return (
                      <div key={tab.id} ref={activeHeaderTabRef} style={headerActiveTabWithSubtabsStyle}>
                        <TopButton active={topTab === tab.id} onClick={() => selectTopTab(tab.id)} label={compactTopTabLabel(tab)} />
                      </div>
                    );
                  }

                  return (
                    <TopButton key={tab.id} active={topTab === tab.id} onClick={() => selectTopTab(tab.id)} label={compactTopTabLabel(tab)} />
                  );
                })}
                {customTabs.filter((tab) => tab.visible !== false).map((tab) => (
                  <TopButton
                    key={tab.id}
                    active={topTab === customTabKey(tab.id)}
                    onClick={() => selectTopTab(customTabKey(tab.id))}
                    label={tab.title}
                    showDelete={topTab === customTabKey(tab.id)}
                    deleteLabel={`Удалить вкладку ${tab.title}`}
                    onDelete={() => deleteCustomTab(tab.id)}
                  />
                ))}
              </div>
              {headerHasSubtabs && (
                <div ref={headerSubtabsRef} style={{ ...headerSubtabsStyle, marginLeft: headerSubtabsOffset }}>
                  {topTab === "reports" && reportCustomers.filter((customer) => customer.visible).map((customer) => (
                    <HeaderSubButton
                      key={customer.id}
                      active={reportCustomerId === customer.id}
                      onClick={() => setReportCustomerId(customer.id)}
                      label={customer.label}
                    />
                  ))}
                  {topTab === "dispatch" && subTabs.dispatch.filter((subTab) => subTab.visible).map((subTab) => (
                    <HeaderSubButton
                      key={subTab.id}
                      active={dispatchTab === subTab.value}
                      onClick={() => setDispatchTab(subTab.value)}
                      label={compactSubTabLabel("dispatch", subTab)}
                    />
                  ))}
                  {topTab === "pto" && subTabs.pto.filter((subTab) => subTab.visible).map((subTab) => (
                    <HeaderSubButton
                      key={subTab.id}
                      active={ptoTab === subTab.value}
                      onClick={() => selectPtoTab(subTab.value)}
                      label={compactSubTabLabel("pto", subTab)}
                    />
                  ))}
                  {topTab === "admin" && adminSectionTabs.map((section) => (
                    <HeaderSubButton
                      key={section.value}
                      active={adminSection === section.value}
                      onClick={() => setAdminSection(section.value)}
                      label={section.label}
                    />
                  ))}
                </div>
              )}
            </div>
            <div style={workDateStyle}>
              <Field label="Рабочая дата">
                <input type="date" value={reportDate} onChange={(e) => selectReportDate(e.target.value)} style={{ ...inputStyle, padding: "8px 10px" }} />
              </Field>
            </div>
          </div>
        </div>

        {renderedTopTab === "reports" && (
          shouldGatePtoDatabase ? renderPtoDatabaseGate() : (
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
          <>
            <SubTabs>
              {subTabs.fleet.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={fleetTab === tab.value} onClick={() => setFleetTab(tab.value)} label={compactSubTabLabel("fleet", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={activeFleetSubtab?.label ?? "Список техники по участкам"}>
              {fleetTab.startsWith("custom:") ? (
                <div style={blockStyle}>{activeFleetSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {filteredFleet.map((v) => (
                    <div key={v.id} style={blockStyle}>
                      <div style={{ fontWeight: 700 }}>{buildVehicleDisplayName(v)}</div>
                      <div style={{ color: "#64748b", marginTop: 6 }}>{v.area} · {v.location}</div>
                      <div style={{ marginTop: 8 }}>Вид работ: {v.workType}</div>
                      <div>Работа: {v.work} ч | Аренда: {v.rent} ч</div>
                      <div>Ремонт: {v.repair} ч | Простой: {v.downtime} ч</div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {renderedTopTab === "contractors" && (
          <>
            <SubTabs>
              {subTabs.contractors.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={contractorTab === tab.value} onClick={() => setContractorTab(tab.value)} label={compactSubTabLabel("contractors", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={`Действующий подрядчик: ${activeContractorSubtab?.label ?? contractorTab}`}>
              {contractorTab.startsWith("custom:") ? (
                <div style={blockStyle}>{activeContractorSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                  {(defaultContractors[contractorTab] ?? []).map((unit) => (
                    <div key={unit} style={blockStyle}>{unit}</div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {renderedTopTab === "fuel" && (
          <>
            <SubTabs>
              {subTabs.fuel.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={fuelTab === tab.value} onClick={() => setFuelTab(tab.value)} label={compactSubTabLabel("fuel", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={`Топливо — ${activeFuelSubtab?.label ?? fuelTab}`}>
              {fuelTab.startsWith("custom:") ? (
                <div style={blockStyle}>{activeFuelSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {(fuelTab === "general" ? defaultFuelGeneral : defaultFuelContractors).map((row) => (
                    <div key={`${row.unit}-${row.mode}`} style={blockStyle}>
                      <div style={{ fontWeight: 700 }}>{row.unit}</div>
                      {row.contractor ? <div style={{ color: "#64748b", marginTop: 6 }}>Организация: {row.contractor}</div> : null}
                      <div style={{ marginTop: 8 }}>Режим: {row.mode}</div>
                      <div>Литраж: {row.liters} л</div>
                      <div>Долг: {row.debt} л</div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {renderedTopTab === "pto" && (
          shouldGatePtoDatabase ? renderPtoDatabaseGate() : (
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
          <>
            <SubTabs>
              {subTabs.tb.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={tbTab === tab.value} onClick={() => setTbTab(tab.value)} label={compactSubTabLabel("tb", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={`ТБ: ${activeTbSubtab?.label ?? tbTab}`}>
              {tbTab.startsWith("custom:") && (
                <div style={blockStyle}>{activeTbSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              )}
              {tbTab === "list" && (
                <div style={blockStyle}>
                  {activeTbSubtab?.content || "Список техники с данными GPS и статусом подключения."}
                </div>
              )}
              {tbTab === "driving" && (
                <div style={blockStyle}>
                  {activeTbSubtab?.content || "Анализ качества вождения: резкие ускорения, торможения, превышения скорости, ремень, фары."}
                </div>
              )}
              {tbTab === "contractors" && (
                <div style={blockStyle}>
                  {activeTbSubtab?.content || "Подрядчики с контролем наличия и активности GPS на технике."}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {renderedTopTab === "user" && (
          <SectionCard title="Пользователь">
            <div style={{ ...blockStyle, maxWidth: 520 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{defaultUserCard.fullName}</div>
              <div style={{ color: "#64748b", marginTop: 6 }}>{defaultUserCard.role}</div>
              <div style={{ marginTop: 10 }}>Подразделение: {defaultUserCard.department}</div>
              <div>Права доступа: {defaultUserCard.access}</div>
            </div>
          </SectionCard>
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
              <div style={{ ...blockStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Структура данных</div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>Связка: участки, техника, ПТО, объемы, оперучет, маркзамеры и отчетность.</div>
                  </div>
                </div>
                <SubTabs>
                  {structureSectionTabs.map((section) => (
                    <TopButton
                      key={section.value}
                      active={structureSection === section.value}
                      onClick={() => setStructureSection(section.value)}
                      label={section.label}
                    />
                  ))}
                </SubTabs>

                {structureSection === "scheme" && (
                  <div style={{ ...blockStyle, background: "#ffffff", marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Поток данных</div>
                    <div style={reportSourceGridStyle}>
                      <SourceNote title="База смены" source="БД" text="дата, участок, техника, рейсы, часы, смена, диспетчер, состояние техники" />
                      <SourceNote title="Справочник техники" source="СводТехники / Список техники" text="марка, модель, госномер, гаражный номер, статус, участок и местоположение" />
                      <SourceNote title="ПТО" source="План, ПланС, График, Объемы кузова" text="план по датам, объем кузова и плановые показатели" />
                      <SourceNote title="Итог" source="AAM" text="отчетность собирает план, маркзамер, оперучет, производительность и причины" />
                    </div>
                    <div style={dependencyStageGridStyle}>
                      {dependencyStages.map((stage) => (
                        <div key={stage.title} style={dependencyStageStyle}>
                          <div style={{ color: "#475569", fontWeight: 700, marginBottom: 8 }}>{stage.title}</div>
                          <div style={{ display: "grid", gap: 8 }}>
                            {stage.nodeIds.map((nodeId) => {
                              const node = dependencyNodes.find((item) => item.id === nodeId);
                              if (!node) return null;

                              return (
                                <div key={node.id} style={dependencyNodeCardStyle}>
                                  <div style={{ fontWeight: 700 }}>{node.name}</div>
                                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>{node.kind} · {node.owner || "Ответственный не задан"}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
                      {dependencyLinks.filter((link) => link.visible).map((link) => (
                        <div key={link.id} style={dependencyLinkCardStyle}>
                          <div style={{ fontWeight: 700 }}>
                            {dependencyNodeLabel(dependencyNodes, link.fromNodeId)} → {dependencyNodeLabel(dependencyNodes, link.toNodeId)}
                          </div>
                          <div style={{ color: "#475569", marginTop: 4 }}>{link.linkType} связь</div>
                          <div style={{ color: "#64748b", marginTop: 6 }}>{link.rule || "Правило не заполнено."}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {structureSection === "elements" && (
                <div style={{ ...blockStyle, background: "#ffffff", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Связка данных и процессов</div>
                  <div style={{ color: "#64748b", marginBottom: 12 }}>Здесь задается, откуда берутся данные и куда они дальше уходят: техника, участки, объемы, ПТО, оперучет, маркзамеры и отчетность.</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                          <CompactTh>Элемент</CompactTh>
                          <CompactTh>Тип</CompactTh>
                          <CompactTh>Ответственный</CompactTh>
                          <CompactTh>Показ</CompactTh>
                          <CompactTh>Действия</CompactTh>
                        </tr>
                      </thead>
                      <tbody>
                        {dependencyNodes.map((node) => {
                          const isEditing = editingDependencyNodeId === node.id;

                          return (
                            <Fragment key={node.id}>
                              <tr>
                                <CompactTd>
                                  <div style={vehicleNameStyle}>{node.name || "Без названия"}</div>
                                </CompactTd>
                                <CompactTd>{node.kind || "—"}</CompactTd>
                                <CompactTd>{node.owner || "—"}</CompactTd>
                                <CompactTd>{node.visible ? "Показывается" : "Скрыт"}</CompactTd>
                                <CompactTd>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать элемент"} onClick={() => setEditingDependencyNodeId(isEditing ? null : node.id)}>
                                      {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                    </IconButton>
                                    <IconButton label={node.visible ? "Скрыть элемент" : "Вернуть элемент"} onClick={() => updateDependencyNode(node.id, "visible", !node.visible)}>
                                      {node.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                    </IconButton>
                                    <IconButton label="Удалить элемент" onClick={() => deleteDependencyNode(node.id)}>
                                      <Trash2 size={16} aria-hidden />
                                    </IconButton>
                                  </div>
                                </CompactTd>
                              </tr>
                              {isEditing && (
                                <tr>
                                  <td colSpan={5} style={adminDetailCellStyle}>
                                    <div style={adminInlineEditStyle}>
                                      <Field label="Название элемента">
                                        <input value={node.name} onChange={(e) => updateDependencyNode(node.id, "name", e.target.value)} placeholder="Например: Объемы" style={inputStyle} />
                                      </Field>
                                      <Field label="Тип элемента">
                                        <input value={node.kind} onChange={(e) => updateDependencyNode(node.id, "kind", e.target.value)} placeholder="Справочник, расчет, факт" style={inputStyle} />
                                      </Field>
                                      <Field label="Ответственный">
                                        <input value={node.owner} onChange={(e) => updateDependencyNode(node.id, "owner", e.target.value)} placeholder="Например: ПТО" style={inputStyle} />
                                      </Field>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto", gap: 10, alignItems: "end" }}>
                    <Field label="Новый элемент">
                      <input value={dependencyNodeForm.name} onChange={(e) => updateDependencyNodeForm("name", e.target.value)} placeholder="Например: Взвешивание" style={inputStyle} />
                    </Field>
                    <Field label="Тип">
                      <input value={dependencyNodeForm.kind} onChange={(e) => updateDependencyNodeForm("kind", e.target.value)} placeholder="Справочник / расчет / факт" style={inputStyle} />
                    </Field>
                    <Field label="Ответственный">
                      <input value={dependencyNodeForm.owner} onChange={(e) => updateDependencyNodeForm("owner", e.target.value)} placeholder="Ответственный" style={inputStyle} />
                    </Field>
                    <IconButton label="Добавить элемент" onClick={addDependencyNode}>
                      <Plus size={16} aria-hidden />
                    </IconButton>
                  </div>
                </div>
                )}

                {structureSection === "links" && (
                <div style={{ ...blockStyle, background: "#ffffff", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Связи зависимостей</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 1180, borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                          <CompactTh>Откуда</CompactTh>
                          <CompactTh>Тип связи</CompactTh>
                          <CompactTh>Куда</CompactTh>
                          <CompactTh>Правило / что передает</CompactTh>
                          <CompactTh>Ответственный</CompactTh>
                          <CompactTh>Показ</CompactTh>
                          <CompactTh>Действия</CompactTh>
                        </tr>
                      </thead>
                      <tbody>
                        {dependencyLinks.map((link) => {
                          const isEditing = editingDependencyLinkId === link.id;

                          return (
                            <Fragment key={link.id}>
                              <tr>
                                <CompactTd>{dependencyNodeLabel(dependencyNodes, link.fromNodeId)}</CompactTd>
                                <CompactTd>{link.linkType}</CompactTd>
                                <CompactTd>{dependencyNodeLabel(dependencyNodes, link.toNodeId)}</CompactTd>
                                <CompactTd>{link.rule || "—"}</CompactTd>
                                <CompactTd>{link.owner || "—"}</CompactTd>
                                <CompactTd>{link.visible ? "Показывается" : "Скрыта"}</CompactTd>
                                <CompactTd>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать связь"} onClick={() => setEditingDependencyLinkId(isEditing ? null : link.id)}>
                                      {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                    </IconButton>
                                    <IconButton label={link.visible ? "Скрыть связь" : "Вернуть связь"} onClick={() => updateDependencyLink(link.id, "visible", !link.visible)}>
                                      {link.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                    </IconButton>
                                    <IconButton label="Удалить связь" onClick={() => deleteDependencyLink(link.id)}>
                                      <Trash2 size={16} aria-hidden />
                                    </IconButton>
                                  </div>
                                </CompactTd>
                              </tr>
                              {isEditing && (
                                <tr>
                                  <td colSpan={7} style={adminDetailCellStyle}>
                                    <div style={adminInlineEditStyle}>
                                      <Field label="Откуда">
                                        <select value={link.fromNodeId} onChange={(e) => updateDependencyLink(link.id, "fromNodeId", e.target.value)} style={inputStyle}>
                                          {dependencyNodes.map((node) => (
                                            <option key={node.id} value={node.id}>{node.name}</option>
                                          ))}
                                        </select>
                                      </Field>
                                      <Field label="Тип связи">
                                        <select value={link.linkType} onChange={(e) => updateDependencyLink(link.id, "linkType", e.target.value as DependencyLinkType)} style={inputStyle}>
                                          <option value="Линейная">Линейная</option>
                                          <option value="Функциональная">Функциональная</option>
                                        </select>
                                      </Field>
                                      <Field label="Куда">
                                        <select value={link.toNodeId} onChange={(e) => updateDependencyLink(link.id, "toNodeId", e.target.value)} style={inputStyle}>
                                          {dependencyNodes.map((node) => (
                                            <option key={node.id} value={node.id}>{node.name}</option>
                                          ))}
                                        </select>
                                      </Field>
                                      <Field label="Правило / что передает">
                                        <input value={link.rule} onChange={(e) => updateDependencyLink(link.id, "rule", e.target.value)} placeholder="Например: рейсы × объем кузова" style={inputStyle} />
                                      </Field>
                                      <Field label="Ответственный">
                                        <input value={link.owner} onChange={(e) => updateDependencyLink(link.id, "owner", e.target.value)} placeholder="Например: ПТО" style={inputStyle} />
                                      </Field>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto", gap: 10, alignItems: "end" }}>
                    <Field label="Откуда">
                      <select value={dependencyLinkForm.fromNodeId} onChange={(e) => updateDependencyLinkForm("fromNodeId", e.target.value)} style={inputStyle}>
                        {dependencyNodes.map((node) => (
                          <option key={node.id} value={node.id}>{node.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Тип связи">
                      <select value={dependencyLinkForm.linkType} onChange={(e) => updateDependencyLinkForm("linkType", e.target.value as DependencyLinkType)} style={inputStyle}>
                        <option value="Линейная">Линейная</option>
                        <option value="Функциональная">Функциональная</option>
                      </select>
                    </Field>
                    <Field label="Куда">
                      <select value={dependencyLinkForm.toNodeId} onChange={(e) => updateDependencyLinkForm("toNodeId", e.target.value)} style={inputStyle}>
                        {dependencyNodes.map((node) => (
                          <option key={node.id} value={node.id}>{node.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Правило">
                      <input value={dependencyLinkForm.rule} onChange={(e) => updateDependencyLinkForm("rule", e.target.value)} placeholder="Что передает / как считается" style={inputStyle} />
                    </Field>
                    <Field label="Ответственный">
                      <input value={dependencyLinkForm.owner} onChange={(e) => updateDependencyLinkForm("owner", e.target.value)} placeholder="Ответственный" style={inputStyle} />
                    </Field>
                    <IconButton label="Добавить связь" onClick={addDependencyLink}>
                      <Plus size={16} aria-hidden />
                    </IconButton>
                  </div>
                </div>
                )}

                {structureSection === "roles" && (
                <>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Сотрудники и роли</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 1120, borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                        <CompactTh>Сотрудник / роль</CompactTh>
                        <CompactTh>Подразделение</CompactTh>
                        <CompactTh>Линейный руководитель</CompactTh>
                        <CompactTh>Функциональный руководитель</CompactTh>
                        <CompactTh>Статус</CompactTh>
                        <CompactTh>Действия</CompactTh>
                      </tr>
                    </thead>
                    <tbody>
                      {orgMembers.map((member) => {
                        const isEditing = editingOrgMemberId === member.id;
                        const managerOptions = orgMembers.filter((candidate) => candidate.id !== member.id);
                        const linearManager = orgMembers.find((candidate) => candidate.id === member.linearManagerId);
                        const functionalManager = orgMembers.find((candidate) => candidate.id === member.functionalManagerId);

                        return (
                          <Fragment key={member.id}>
                            <tr>
                              <CompactTd>
                                <div style={vehicleNameStyle}>{member.name || "Без названия"}</div>
                                <VehicleMeta label="Должность" value={member.position} />
                              </CompactTd>
                              <CompactTd>
                                <VehicleMeta label="Отдел" value={member.department} />
                                <VehicleMeta label="Участок" value={member.area} />
                              </CompactTd>
                              <CompactTd>{orgMemberLabel(linearManager)}</CompactTd>
                              <CompactTd>{orgMemberLabel(functionalManager)}</CompactTd>
                              <CompactTd>{member.active ? "Активен" : "Скрыт"}</CompactTd>
                              <CompactTd>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать связь"} onClick={() => setEditingOrgMemberId(isEditing ? null : member.id)}>
                                    {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label={member.active ? "Скрыть из структуры" : "Вернуть в структуру"} onClick={() => updateOrgMember(member.id, "active", !member.active)}>
                                    {member.active ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label="Удалить связь" onClick={() => deleteOrgMember(member.id)}>
                                    <Trash2 size={16} aria-hidden />
                                  </IconButton>
                                </div>
                              </CompactTd>
                            </tr>
                            {isEditing && (
                              <tr>
                                <td colSpan={6} style={adminDetailCellStyle}>
                                  <div style={adminInlineEditStyle}>
                                    <Field label="Сотрудник / роль">
                                      <input value={member.name} onChange={(e) => updateOrgMember(member.id, "name", e.target.value)} placeholder="Например: Диспетчер смены" style={inputStyle} />
                                    </Field>
                                    <Field label="Должность">
                                      <input value={member.position} onChange={(e) => updateOrgMember(member.id, "position", e.target.value)} placeholder="Например: Диспетчер" style={inputStyle} />
                                    </Field>
                                    <Field label="Подразделение">
                                      <input value={member.department} onChange={(e) => updateOrgMember(member.id, "department", e.target.value)} placeholder="Например: ПТО" style={inputStyle} />
                                    </Field>
                                    <Field label="Участок">
                                      <input value={member.area} onChange={(e) => updateOrgMember(member.id, "area", e.target.value)} placeholder="Например: Аксу" style={inputStyle} />
                                    </Field>
                                    <Field label="Линейный руководитель">
                                      <select value={member.linearManagerId} onChange={(e) => updateOrgMember(member.id, "linearManagerId", e.target.value)} style={inputStyle}>
                                        <option value="">Не назначен</option>
                                        {managerOptions.map((candidate) => (
                                          <option key={candidate.id} value={candidate.id}>{orgMemberLabel(candidate)}</option>
                                        ))}
                                      </select>
                                    </Field>
                                    <Field label="Функциональный руководитель">
                                      <select value={member.functionalManagerId} onChange={(e) => updateOrgMember(member.id, "functionalManagerId", e.target.value)} style={inputStyle}>
                                        <option value="">Не назначен</option>
                                        {managerOptions.map((candidate) => (
                                          <option key={candidate.id} value={candidate.id}>{orgMemberLabel(candidate)}</option>
                                        ))}
                                      </select>
                                    </Field>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto", gap: 10, alignItems: "end" }}>
                  <Field label="Сотрудник / роль">
                    <input value={orgMemberForm.name} onChange={(e) => updateOrgMemberForm("name", e.target.value)} placeholder="Например: Геолог" style={inputStyle} />
                  </Field>
                  <Field label="Должность">
                    <input value={orgMemberForm.position} onChange={(e) => updateOrgMemberForm("position", e.target.value)} placeholder="Должность" style={inputStyle} />
                  </Field>
                  <Field label="Подразделение">
                    <input value={orgMemberForm.department} onChange={(e) => updateOrgMemberForm("department", e.target.value)} placeholder="Отдел" style={inputStyle} />
                  </Field>
                  <Field label="Участок">
                    <input value={orgMemberForm.area} onChange={(e) => updateOrgMemberForm("area", e.target.value)} placeholder="Участок" style={inputStyle} />
                  </Field>
                  <Field label="Линейный руководитель">
                    <select value={orgMemberForm.linearManagerId} onChange={(e) => updateOrgMemberForm("linearManagerId", e.target.value)} style={inputStyle}>
                      <option value="">Не назначен</option>
                      {orgMembers.map((member) => (
                        <option key={member.id} value={member.id}>{orgMemberLabel(member)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Функциональный руководитель">
                    <select value={orgMemberForm.functionalManagerId} onChange={(e) => updateOrgMemberForm("functionalManagerId", e.target.value)} style={inputStyle}>
                      <option value="">Не назначен</option>
                      {orgMembers.map((member) => (
                        <option key={member.id} value={member.id}>{orgMemberLabel(member)}</option>
                      ))}
                    </select>
                  </Field>
                  <IconButton label="Добавить связь" onClick={addOrgMember}>
                    <Plus size={16} aria-hidden />
                  </IconButton>
                </div>
                </>
                )}

                {structureSection === "schedule" && (
                  <div style={{ ...blockStyle, background: "#ffffff", marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Распорядок участков</div>
                    <div style={{ color: "#64748b", marginBottom: 12 }}>
                      Здесь задается время закрытия рабочих суток. Если текущее время меньше границы участка, Рабочая дата автоматически считается предыдущим календарным днем.
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                            <CompactTh>Участок</CompactTh>
                            <CompactTh>Граница суток</CompactTh>
                            <CompactTh>Правило расчета</CompactTh>
                            <CompactTh>Источник</CompactTh>
                          </tr>
                        </thead>
                        <tbody>
                          {areaShiftScheduleAreas.map((area) => {
                            const cutoffTime = resolveAreaShiftCutoffTime(areaShiftCutoffs, area);
                            const hasOwnCutoff = Object.prototype.hasOwnProperty.call(areaShiftCutoffs, area);
                            const isDefaultArea = normalizeLookupValue(area) === normalizeLookupValue(defaultAreaShiftScheduleArea);

                            return (
                              <tr key={area}>
                                <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", verticalAlign: "top" }}>
                                  <div style={vehicleNameStyle}>{area}</div>
                                  {!isDefaultArea ? (
                                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                                      Если время не задано отдельно, используется общее правило.
                                    </div>
                                  ) : null}
                                </td>
                                <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", verticalAlign: "top", width: 180 }}>
                                  <input
                                    type="time"
                                    step={60}
                                    value={cutoffTime}
                                    onChange={(e) => updateAreaShiftCutoff(area, e.target.value)}
                                    style={{ ...inputStyle, minWidth: 120, padding: "8px 10px" }}
                                  />
                                </td>
                                <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", verticalAlign: "top" }}>
                                  С {cutoffTime} предыдущего календарного дня до {cutoffTime} текущего календарного дня.
                                </td>
                                <td style={{ padding: 12, borderBottom: "1px solid #e2e8f0", verticalAlign: "top", color: "#475569" }}>
                                  {isDefaultArea ? "Общее правило" : hasOwnCutoff ? "Индивидуально" : "Общее правило"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {adminSection === "ai" && (
              <div style={{ ...blockStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>ИИ-сводка: как будет копиться база причин</div>
                    <div style={{ color: "#64748b", marginTop: 4, maxWidth: 900 }}>
                      Черновая схема: диспетчерская сводка сохраняет факты по технике, отчетность хранит подтвержденные причины по дате и виду работ, ИИ позже дает только предварительную версию причины.
                    </div>
                  </div>
                  <span style={{ ...adminVehicleRenderedCountStyle, border: "1px solid #cbd5e1", borderRadius: 6, padding: "5px 8px", background: "#ffffff" }}>макет</span>
                </div>

                <div style={reportSourceGridStyle}>
                  <SourceNote
                    title="1. Диспетчерская сводка"
                    source="Факты за смену"
                    text="техника, участок, вид работ, рейсы, работа, ремонт, простой, производительность, комментарии"
                  />
                  <SourceNote
                    title="2. Причины за сутки"
                    source="Ручной ввод"
                    text="дата + участок + вид работ + текст причины, например: Простой ДСК (5 ч.)"
                  />
                  <SourceNote
                    title="3. Накопление"
                    source="Расчет отчета"
                    text="все суточные причины с начала года группируются отдельно по каждому виду работ"
                  />
                  <SourceNote
                    title="4. ИИ-предложение"
                    source="Будущий помощник"
                    text="анализирует ремонты, простои, рейсы и производительность, затем предлагает причину для подтверждения"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.1fr) minmax(320px, 0.9fr)", gap: 14, marginTop: 14, alignItems: "start" }}>
                  <div style={{ ...blockStyle, background: "#ffffff", borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Как диспетчер заполняет причину</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
                      <Field label="Дата">
                        <input value="2026-04-18" readOnly style={{ ...inputStyle, padding: "8px 10px" }} />
                      </Field>
                      <Field label="Участок">
                        <input value="Аксу" readOnly style={{ ...inputStyle, padding: "8px 10px" }} />
                      </Field>
                      <Field label="Вид работ">
                        <input value="Перевозка горной массы" readOnly style={{ ...inputStyle, padding: "8px 10px" }} />
                      </Field>
                    </div>
                    <Field label="Причина за сутки">
                      <textarea
                        readOnly
                        value="Ремонт транспортировочной техники: 1 ед. самосвала (3 ч.); Простой ДСК (5 ч.)"
                        style={{ ...inputStyle, minHeight: 78, resize: "vertical" }}
                      />
                    </Field>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
                      В реальной версии это поле будет редактироваться прямо в отчете по выбранной рабочей дате.
                    </div>
                  </div>

                  <div style={{ ...blockStyle, background: "#ffffff", borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Что покажет накопление с начала года</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={compactRowStyle}>
                        <div>
                          <div style={{ fontWeight: 700 }}>Ремонт транспортировочной техники</div>
                          <div style={{ color: "#64748b", marginTop: 3 }}>самосвалы, подтверждено диспетчером</div>
                        </div>
                        <div style={{ fontWeight: 800 }}>18 ч.</div>
                      </div>
                      <div style={compactRowStyle}>
                        <div>
                          <div style={{ fontWeight: 700 }}>Простой ДСК</div>
                          <div style={{ color: "#64748b", marginTop: 3 }}>показывается только в этой строке вида работ</div>
                        </div>
                        <div style={{ fontWeight: 800 }}>11 ч.</div>
                      </div>
                      <div style={compactRowStyle}>
                        <div>
                          <div style={{ fontWeight: 700 }}>Ожидание экскаватора</div>
                          <div style={{ color: "#64748b", marginTop: 3 }}>накопление по датам до выбранной даты</div>
                        </div>
                        <div style={{ fontWeight: 800 }}>6 ч.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ ...blockStyle, background: "#ffffff", borderRadius: 8, marginTop: 14 }}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>Какие таблицы я бы заложил в базу</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                          <CompactTh>Таблица</CompactTh>
                          <CompactTh>Что хранит</CompactTh>
                          <CompactTh>Зачем нужна</CompactTh>
                          <CompactTh>Кто заполняет</CompactTh>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <CompactTd><strong>dispatch_shifts</strong></CompactTd>
                          <CompactTd>дата, смена, участок, диспетчер</CompactTd>
                          <CompactTd>шапка каждой диспетчерской сводки</CompactTd>
                          <CompactTd>диспетчер</CompactTd>
                        </tr>
                        <tr>
                          <CompactTd><strong>dispatch_equipment_rows</strong></CompactTd>
                          <CompactTd>техника, работа, ремонт, простой, рейсы, производительность</CompactTd>
                          <CompactTd>факты, по которым ИИ будет искать причину невыполнения</CompactTd>
                          <CompactTd>диспетчерская сводка</CompactTd>
                        </tr>
                        <tr>
                          <CompactTd><strong>daily_plan_reasons</strong></CompactTd>
                          <CompactTd>дата, участок, вид работ, причина, часы, количество техники</CompactTd>
                          <CompactTd>ручная причина за сутки и накопление с начала года</CompactTd>
                          <CompactTd>диспетчер, позже ИИ после подтверждения</CompactTd>
                        </tr>
                        <tr>
                          <CompactTd><strong>ai_reason_suggestions</strong></CompactTd>
                          <CompactTd>предложенный текст, доказательства, статус принятия</CompactTd>
                          <CompactTd>ИИ предлагает, человек подтверждает или отклоняет</CompactTd>
                          <CompactTd>ИИ + диспетчер</CompactTd>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 14 }}>
                  <div style={{ ...blockStyle, background: "#ffffff", borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Правило для отчета</div>
                    <div style={{ color: "#475569" }}>
                      Если выбранная дата меняется, ячейка &quot;Причина за сутки&quot; берет причину только за эту дату. Ячейка &quot;Причины с накоплением&quot; собирает все причины с 01.01 выбранного года по выбранную дату.
                    </div>
                  </div>
                  <div style={{ ...blockStyle, background: "#ffffff", borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Правило для ИИ</div>
                    <div style={{ color: "#475569" }}>
                      ИИ не пишет в официальный отчет напрямую. Он предлагает текст с доказательствами: какая техника стояла, сколько часов ремонта, где просела производительность.
                    </div>
                  </div>
                  <div style={{ ...blockStyle, background: "#ffffff", borderRadius: 8 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Правило связки</div>
                    <div style={{ color: "#475569" }}>
                      Связь строится не по названию для заказчика, а по внутреннему ключу: дата + участок + вид работ. Название строки можно переименовывать без потери данных.
                    </div>
                  </div>
                </div>
              </div>
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

        {activeCustomTab && (
          <SectionCard title={activeCustomTab.title}>
            <div style={{ display: "grid", gap: 16 }}>
              {activeCustomTab.description && <div style={{ color: "#475569" }}>{activeCustomTab.description}</div>}
              {activeCustomTab.items.length > 0 ? (
                activeCustomTab.items.map((item, index) => (
                  <div key={`${activeCustomTab.id}-${index}`} style={blockStyle}>{item}</div>
                ))
              ) : (
                <div style={blockStyle}>Во вкладке пока нет информации.</div>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

const blockStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};

const reportSourceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const reportHeaderLabelButtonStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "text",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: 0,
  textAlign: "center",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
};

const reportHeaderInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #60a5fa",
  borderRadius: 4,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  outline: "none",
  padding: "2px 4px",
  textAlign: "center",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontFamily: "inherit",
  fontSize: 14,
  lineHeight: 1.35,
  background: "#ffffff",
};

const vehicleNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.4,
  marginBottom: 6,
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
};

const adminVehicleRenderedCountStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
};

const adminDetailCellStyle: React.CSSProperties = {
  padding: "10px 12px 14px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const compactRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 10,
  background: "#ffffff",
};

const adminInlineEditStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  alignItems: "end",
};

const dependencyStageGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const dependencyStageStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 10,
};

const dependencyNodeCardStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
};

const dependencyLinkCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 12,
};

const headerNavStackStyle: React.CSSProperties = {
  flex: "1 1 720px",
  display: "grid",
  gap: 6,
  minWidth: 280,
  position: "relative",
};

const headerNavStackPtoStyle: React.CSSProperties = {
  paddingBottom: 0,
};

const headerMainTabsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

const headerActiveTabWithSubtabsStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const headerSubtabsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  alignItems: "center",
  justifyContent: "flex-start",
  width: "fit-content",
  maxWidth: "100%",
  borderTop: "1px solid #0f172a",
  paddingTop: 6,
};

const logoImageStyle: React.CSSProperties = {
  width: 112,
  height: 72,
  objectFit: "contain",
  display: "block",
};

const workDateStyle: React.CSSProperties = {
  width: 170,
  flex: "0 0 170px",
};
