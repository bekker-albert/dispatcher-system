"use client";

import { Check, ChevronDown, ChevronRight, Download, Eye, EyeOff, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Fragment, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { PtoPlanTd, PtoPlanTh, ptoStatusControlStyle } from "@/features/pto/PtoDateTableParts";
import { PtoToolbarButton, PtoToolbarIconButton } from "@/features/pto/PtoToolbarButtons";
import { usePtoDateViewport } from "@/features/pto/usePtoDateViewport";
import { reportPrintCss } from "@/features/reports/printCss";
import { adminLogLimit, formatAdminLogDate, normalizeAdminLogEntry, type AdminLogEntry } from "@/lib/domain/admin/logs";
import { adminSectionTabs, structureSectionTabs, type AdminReportCustomerSettingsTab, type AdminSection, type StructureSection } from "@/lib/domain/admin/navigation";
import { defaultDependencyLinkForm, defaultDependencyLinks, defaultDependencyNodeForm, defaultDependencyNodes, defaultOrgMemberForm, defaultOrgMembers, dependencyNodeLabel, dependencyStages, orgMemberLabel, type DependencyLink, type DependencyLinkType, type DependencyNode, type OrgMember } from "@/lib/domain/admin/structure";
import { buildDispatchAiSuggestion, consolidateDispatchSummaryRows, createDefaultDispatchSummaryRows, createDispatchSummaryRow, dispatchShiftFromTab, normalizeDispatchSummaryRows, type DispatchSummaryNumberField, type DispatchSummaryRow, type DispatchSummaryTextField } from "@/lib/domain/dispatch/summary";
import { buildReportPtoIndex, createReportRowFromPtoPlan, deriveReportRowFromPtoIndex, reportReasonAccumulationStartDateFromIndexes } from "@/lib/domain/reports/calculation";
import { defaultReportColumnWidths, reportColumnHeaderFallbacks, reportColumnKeys, type ReportColumnKey } from "@/lib/domain/reports/columns";
import { normalizeStoredReportCustomers } from "@/lib/domain/reports/customers";
import { defaultReportCustomerId, defaultReportCustomers } from "@/lib/domain/reports/defaults";
import { createReportSummaryRow, delta, formatNumber, formatPercent, reportAutoColumnWidth, reportCustomerEffectiveRowKeys, reportCustomerUsesSummaryRows, reportPtoDateStatusFromIndexes, reportPtoDateStatusHasAny, reportRowKey, sortAreaNamesByOrder, sortReportRowsByAreaOrder } from "@/lib/domain/reports/display";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "@/lib/domain/reports/facts";
import { reportReason, reportReasonEntryKey, reportYearReasonOverrideKey, reportYearReasonValue } from "@/lib/domain/reports/reasons";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";
import { createEmptyPtoDateRow, defaultPtoPlanMonth, distributeMonthlyTotal, insertPtoRowAfter, monthDays, normalizePtoPlanRow, normalizePtoUnit, normalizePtoYearValue, normalizeStoredPtoYears, previousPtoYearLabel, ptoAreaMatches, ptoAutomatedStatus, ptoColumnDefaults, ptoEffectiveCarryover, ptoFieldLogLabel, ptoLinkedRowMatches, ptoLinkedRowSignature, ptoRowFieldDomKey, ptoRowHasYear, ptoStatusRowBackground, ptoUnitOptions, ptoYearOptions, removeYearFromPtoRows, reorderPtoRows, yearMonths, type PtoDateTableKey, type PtoDropPosition, type PtoPlanRow } from "@/lib/domain/pto/date-table";
import { defaultPtoOperRows, defaultPtoPlanRows, defaultPtoSurveyRows, defaultReportDate } from "@/lib/domain/pto/defaults";
import { createPtoPlanExportColumns, createPtoPlanExportRows, createPtoPlanRowsFromImportTable, ensureImportedRowsInLinkedPtoTable, mergeImportedPtoPlanRows, ptoDateExportFileName, ptoDateTableMeta } from "@/lib/domain/pto/excel";
import { formatMonthName, formatPtoCellNumber, formatPtoFormulaNumber, parseDecimalInput, parseDecimalValue } from "@/lib/domain/pto/formatting";
import { calculatePtoVirtualRows, ptoDateVirtualDefaultRowHeight, ptoDateVirtualHeaderOffset } from "@/lib/domain/pto/virtualization";
import { compactSubTabLabel, compactTopTabLabel, createDefaultSubTabs, customTabKey, defaultCustomTabForm, defaultTopTabs, normalizeStoredCustomTabs, normalizeStoredSubTabs, normalizeStoredTopTabs, subtabGroupLabels, type BaseTopTab, type CustomTab, type EditableSubtabGroup, type NewSubTabForm, type SubTabConfig, type TopTab, type TopTabDefinition } from "@/lib/domain/navigation/tabs";
import { isLoadingEquipment, loadingEquipmentLabel, normalizePtoBucketManualRows, ptoBucketRowKey, type PtoBucketColumn, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { defaultContractors, defaultFuelContractors, defaultFuelGeneral, defaultUserCard } from "@/lib/domain/reference/defaults";
import { createDefaultVehicles, createVehicleSeedVersion, defaultVehicleForm, defaultVehicleSeedReplaceLimit, normalizeVehicleRow, type VehicleSeedRow } from "@/lib/domain/vehicles/defaults";
import { buildVehicleDisplayName, createVehicleExportRows, parseVehicleImportFile } from "@/lib/domain/vehicles/import-export";
import { cloneVehicleRows, createVehicleFilterOptions, vehicleFilterOptionLabel, vehicleMatchesFilters } from "@/lib/domain/vehicles/filtering";
import { adminVehicleFallbackPreviewRows, adminVehicleMinPreviewRows, adminVehicleViewportBottomReserve, parseVehicleInlineFieldDomKey, vehicleAutocompleteFilterKeys, vehicleFieldIsNumeric, vehicleFilterColumnConfigs, vehicleInlineFieldDomKey, vehicleInlineFields, type VehicleFilterKey, type VehicleFilters, type VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { supabaseConfigured } from "@/lib/supabase/config";
import { adminStorageKeys } from "@/lib/storage/keys";
import { createId } from "@/lib/utils/id";
import { errorToMessage, isRecord, mergeDefaultsById, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringList, normalizeStringListRecord, normalizeStringRecord } from "@/lib/utils/normalizers";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";
import { createXlsxBlob, parseTableImportFile } from "@/lib/utils/xlsx";
import { editableGridArrowOffset, editableGridKeyAtOffset, editableGridRangeKeys, isEditableGridArrowKey, toggleEditableGridSelectionKey } from "@/shared/editable-grid/selection";
import { IconButton, MiniIconButton, TopButton } from "@/shared/ui/buttons";
import { CompactTd, CompactTh, Field, SectionCard, SourceNote, SubTabs, VehicleMeta } from "@/shared/ui/layout";
import { HeaderSubButton } from "@/shared/ui/navigation";

type PtoDropTarget = {
  rowId: string;
  position: PtoDropPosition;
};

type PtoFormulaCell = {
  table: string;
  year: string;
  rowId: string;
  kind: "coefficient" | "carryover" | "month" | "day";
  label: string;
  day?: string;
  month?: string;
  days?: string[];
  editable?: boolean;
};

type PtoResizeState =
  | { type: "column"; key: string; startX: number; startWidth: number }
  | { type: "row"; key: string; startY: number; startHeight: number };

type ReportResizeState = {
  key: string;
  startX: number;
  startWidth: number;
};

type PtoTableColumn = {
  key: string;
  width: number;
};

type UndoSnapshot = {
  reportCustomers: ReportCustomerConfig[];
  reportAreaOrder: string[];
  reportWorkOrder: Record<string, string[]>;
  reportHeaderLabels: Record<string, string>;
  reportColumnWidths: Record<string, number>;
  reportReasons: Record<string, string>;
  customTabs: CustomTab[];
  topTabs: TopTabDefinition[];
  subTabs: Record<EditableSubtabGroup, SubTabConfig[]>;
  vehicleRows: VehicleRow[];
  ptoManualYears: string[];
  expandedPtoMonths: Record<string, boolean>;
  ptoPlanRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoColumnWidths: Record<string, number>;
  ptoRowHeights: Record<string, number>;
  ptoHeaderLabels: Record<string, string>;
  ptoBucketValues: Record<string, number>;
  ptoBucketManualRows: PtoBucketRow[];
  orgMembers: OrgMember[];
  dependencyNodes: DependencyNode[];
  dependencyLinks: DependencyLink[];
};

const defaultVehicles: VehicleRow[] = createDefaultVehicles([]);

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
const DispatchSection = dynamic(() => import("@/features/dispatch/DispatchSection"), {
  ssr: false,
});
const ReportsSection = dynamic(() => import("@/features/reports/ReportsSection"), {
  ssr: false,
});
const PtoSection = dynamic(() => import("@/features/pto/PtoSection"), {
  ssr: false,
});

function cloneUndoSnapshot(snapshot: UndoSnapshot): UndoSnapshot {
  if (typeof structuredClone === "function") {
    return structuredClone(snapshot) as UndoSnapshot;
  }

  return JSON.parse(JSON.stringify(snapshot)) as UndoSnapshot;
}

export default function App() {
  const [topTab, setTopTab] = useState<TopTab>("dispatch");
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
  const appStateSaveTimerRef = useRef<number | null>(null);
  const appDatabaseSaveTimerRef = useRef<number | null>(null);
  const appDatabaseAvailableRef = useRef(false);
  const appDatabaseSaveSnapshotRef = useRef("");
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
  const [adminReportTab, setAdminReportTab] = useState<"order" | "customer">("order");
  const [adminReportCustomerSettingsTab, setAdminReportCustomerSettingsTab] = useState<AdminReportCustomerSettingsTab>("display");
  const [editingReportRowLabelKeys, setEditingReportRowLabelKeys] = useState<string[]>([]);
  const [expandedReportSummaryIds, setExpandedReportSummaryIds] = useState<string[]>([]);
  const [reportCustomers, setReportCustomers] = useState<ReportCustomerConfig[]>(defaultReportCustomers);
  const [reportAreaOrder, setReportAreaOrder] = useState<string[]>([]);
  const [reportWorkOrder, setReportWorkOrder] = useState<Record<string, string[]>>({});
  const [reportHeaderLabels, setReportHeaderLabels] = useState<Record<string, string>>({});
  const [reportColumnWidths, setReportColumnWidths] = useState<Record<string, number>>({});
  const [reportReasons, setReportReasons] = useState<Record<string, string>>({});
  const [editingReportHeaderKey, setEditingReportHeaderKey] = useState<string | null>(null);
  const [reportHeaderDraft, setReportHeaderDraft] = useState("");
  const [reportDate, setReportDate] = useState(defaultReportDate);
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
  const [customTabForm, setCustomTabForm] = useState(defaultCustomTabForm);
  const [newSubTabForm, setNewSubTabForm] = useState<NewSubTabForm>({ group: "reports", label: "", content: "" });
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
  const [adminSection, setAdminSection] = useState<AdminSection>("menu");
  const [adminLogs, setAdminLogs] = useState<AdminLogEntry[]>([]);
  const [expandedAdminTab, setExpandedAdminTab] = useState<string | null>("reports");
  const [editingTopTabId, setEditingTopTabId] = useState<string | null>(null);
  const [editingSubTabId, setEditingSubTabId] = useState<string | null>(null);
  const [, setPtoDatabaseMessage] = useState(supabaseConfigured ? "База Supabase подключается..." : "База Supabase не настроена.");
  const [ptoSaveRevision, setPtoSaveRevision] = useState(0);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);
  const [areaFilter, setAreaFilter] = useState("Все участки");
  const [search, setSearch] = useState("");
  const ptoDatabaseState = useMemo(() => ({
    manualYears: ptoManualYears,
    planRows: ptoPlanRows,
    operRows: ptoOperRows,
    surveyRows: ptoSurveyRows,
    bucketValues: ptoBucketValues,
    bucketRows: ptoBucketManualRows,
    uiState: {
      reportDate,
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
  }), [expandedPtoMonths, ptoAreaFilter, ptoBucketManualRows, ptoBucketValues, ptoColumnWidths, ptoHeaderLabels, ptoManualYears, ptoOperRows, ptoPlanRows, ptoPlanYear, ptoRowHeights, ptoSurveyRows, ptoTab, reportColumnWidths, reportDate, reportReasons]);
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

    if (supabaseConfigured && ptoDatabaseLoadedRef.current) {
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
    if (!openVehicleFilter) return undefined;

    const closeVehicleFilter = () => setOpenVehicleFilter(null);
    window.addEventListener("click", closeVehicleFilter);

    return () => window.removeEventListener("click", closeVehicleFilter);
  }, [openVehicleFilter]);

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

        if (supabaseConfigured) {
          try {
            const { loadAppStateFromSupabase } = await import("@/lib/supabase/app-state");
            const databaseAppState = await loadAppStateFromSupabase();
            appDatabaseAvailableRef.current = true;

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
            appDatabaseAvailableRef.current = false;
            console.warn("Supabase app_state is not ready:", error);
          }
        }

        const savedReportCustomers = readStoredValue(adminStorageKeys.reportCustomers);
        const savedReportAreaOrder = readStoredValue(adminStorageKeys.reportAreaOrder);
        const savedReportWorkOrder = readStoredValue(adminStorageKeys.reportWorkOrder);
        const savedReportHeaderLabels = readStoredValue(adminStorageKeys.reportHeaderLabels);
        const savedReportColumnWidths = readStoredValue(adminStorageKeys.reportColumnWidths);
        const savedReportReasons = readStoredValue(adminStorageKeys.reportReasons);
        const savedCustomTabs = readStoredValue(adminStorageKeys.customTabs);
        const savedTopTabs = readStoredValue(adminStorageKeys.topTabs);
        const savedSubTabs = readStoredValue(adminStorageKeys.subTabs);
        const savedVehicles = readStoredValue(adminStorageKeys.vehicles);
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

        setReportCustomers(normalizeStoredReportCustomers(savedReportCustomers, defaultReportCustomers));
        setReportAreaOrder(normalizeStringList(savedReportAreaOrder));
        setReportWorkOrder(normalizeStringListRecord(savedReportWorkOrder));
        setReportHeaderLabels(normalizeStringRecord(savedReportHeaderLabels));
        setReportColumnWidths(normalizeNumberRecord(savedReportColumnWidths, 42, 520));
        setReportReasons(normalizeStringRecord(savedReportReasons));

        setCustomTabs(normalizeStoredCustomTabs(savedCustomTabs));

        if (savedTopTabs) {
          setTopTabs(normalizeStoredTopTabs(savedTopTabs));
        }

        if (savedSubTabs) {
          setSubTabs(normalizeStoredSubTabs(savedSubTabs, defaultSubTabs));
        }

        const savedVehicleSeedVersion = window.localStorage.getItem(adminStorageKeys.vehiclesSeedVersion);
        const needsVehicleSeed = !Array.isArray(savedVehicles) || savedVehicles.length <= defaultVehicleSeedReplaceLimit;
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

        const parsedDispatchSummaryRows = normalizeDispatchSummaryRows(savedDispatchSummaryRows, defaultReportDate);
        if (parsedDispatchSummaryRows) {
          const hasEditableDispatchRows = parsedDispatchSummaryRows.some((row) => row.shift === "night" || row.shift === "day");
          setDispatchSummaryRows(hasEditableDispatchRows
            ? parsedDispatchSummaryRows
            : parsedDispatchSummaryRows.map((row) => (row.shift === "daily" ? { ...row, shift: "night" } : row)));
        } else if (shouldUseVehicleSeed) {
          setDispatchSummaryRows(createDefaultDispatchSummaryRows(defaultVehicleSeed.vehicles, defaultReportDate));
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
  }, []);

  useEffect(() => {
    if (!adminDataLoaded) return;

    let cancelled = false;

    async function loadPtoDatabase() {
      if (!supabaseConfigured) {
        setPtoDatabaseMessage("База Supabase не настроена.");
        return;
      }

      setPtoDatabaseMessage("Загружаю ПТО из Supabase...");

      try {
        const { loadPtoStateFromSupabase } = await import("@/lib/supabase/pto");
        const databaseState = await loadPtoStateFromSupabase();
        if (cancelled) return;

        if (!databaseState) {
          ptoDatabaseLoadedRef.current = true;
          ptoDatabaseSaveSnapshotRef.current = "";
          if (hasStoredPtoStateRef.current) {
            setPtoSaveRevision((revision) => revision + 1);
            setPtoDatabaseMessage("В Supabase данных ПТО нет — оставил локальные данные и поставил сохранение в базу.");
          } else {
            setPtoDatabaseMessage("База подключена. Данных ПТО пока нет — внеси изменение, оно сохранится автоматически.");
          }
          return;
        }

        const localUpdatedAt = window.localStorage.getItem(adminStorageKeys.ptoLocalUpdatedAt);
        const localUpdatedTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
        const databaseUpdatedTime = databaseState.updatedAt ? Date.parse(databaseState.updatedAt) : 0;
        const shouldKeepLocalPto = hasStoredPtoStateRef.current
          && localUpdatedTime > 0
          && (!databaseUpdatedTime || localUpdatedTime > databaseUpdatedTime);

        if (shouldKeepLocalPto) {
          ptoDatabaseLoadedRef.current = true;
          ptoDatabaseSaveSnapshotRef.current = "";
          setPtoSaveRevision((revision) => revision + 1);
          setPtoDatabaseMessage("Локальные данные ПТО новее Supabase — оставил локальные данные и поставил сохранение в базу.");
          return;
        }

        const nextManualYears = normalizeStoredPtoYears(databaseState.manualYears);
        const nextPlanRows = databaseState.planRows.map((row) => normalizePtoPlanRow(row));
        const nextOperRows = databaseState.operRows.map((row) => normalizePtoPlanRow(row));
        const nextSurveyRows = databaseState.surveyRows.map((row) => normalizePtoPlanRow(row));
        const nextBucketValues = normalizeDecimalRecord(databaseState.bucketValues, 0, 100000);
        const nextBucketRows = normalizePtoBucketManualRows(databaseState.bucketRows);
        const nextUiState = databaseState.uiState ?? {};
        const fallbackUiState = ptoDatabaseStateRef.current.uiState;

        ptoDatabaseLoadedRef.current = true;
        undoHistoryRef.current = [];
        undoRestoringRef.current = true;
        ptoDatabaseSaveSnapshotRef.current = JSON.stringify({
          manualYears: nextManualYears,
          planRows: nextPlanRows,
          operRows: nextOperRows,
          surveyRows: nextSurveyRows,
          bucketValues: nextBucketValues,
          bucketRows: nextBucketRows,
          uiState: {
            reportDate: nextUiState.reportDate ?? fallbackUiState.reportDate,
            ptoTab: nextUiState.ptoTab ?? fallbackUiState.ptoTab,
            ptoPlanYear: nextUiState.ptoPlanYear ?? fallbackUiState.ptoPlanYear,
            ptoAreaFilter: nextUiState.ptoAreaFilter ?? fallbackUiState.ptoAreaFilter,
            expandedPtoMonths: nextUiState.expandedPtoMonths ?? fallbackUiState.expandedPtoMonths,
            reportColumnWidths: nextUiState.reportColumnWidths ?? fallbackUiState.reportColumnWidths,
            reportReasons: nextUiState.reportReasons ?? fallbackUiState.reportReasons,
            ptoColumnWidths: nextUiState.ptoColumnWidths ?? fallbackUiState.ptoColumnWidths,
            ptoRowHeights: nextUiState.ptoRowHeights ?? fallbackUiState.ptoRowHeights,
            ptoHeaderLabels: nextUiState.ptoHeaderLabels ?? fallbackUiState.ptoHeaderLabels,
          },
        });
        setPtoManualYears(nextManualYears);
        setPtoPlanRows(nextPlanRows);
        setPtoOperRows(nextOperRows);
        setPtoSurveyRows(nextSurveyRows);
        setPtoBucketValues(nextBucketValues);
        setPtoBucketManualRows(nextBucketRows);
        if (typeof nextUiState.reportDate === "string") setReportDate(nextUiState.reportDate);
        if (typeof nextUiState.ptoTab === "string") setPtoTab(nextUiState.ptoTab);
        if (typeof nextUiState.ptoPlanYear === "string") setPtoPlanYear(nextUiState.ptoPlanYear);
        if (typeof nextUiState.ptoAreaFilter === "string") setPtoAreaFilter(nextUiState.ptoAreaFilter);
        if (isRecord(nextUiState.expandedPtoMonths)) {
          setExpandedPtoMonths(Object.fromEntries(
            Object.entries(nextUiState.expandedPtoMonths).filter((entry): entry is [string, boolean] => typeof entry[0] === "string" && typeof entry[1] === "boolean"),
          ));
        }
        setReportColumnWidths(normalizeNumberRecord(nextUiState.reportColumnWidths ?? fallbackUiState.reportColumnWidths, 42, 520));
        setReportReasons(normalizeStringRecord(nextUiState.reportReasons ?? fallbackUiState.reportReasons));
        setPtoColumnWidths(normalizeNumberRecord(nextUiState.ptoColumnWidths ?? fallbackUiState.ptoColumnWidths, 44, 800));
        setPtoRowHeights(normalizeNumberRecord(nextUiState.ptoRowHeights ?? fallbackUiState.ptoRowHeights, 28, 180));
        setPtoHeaderLabels(normalizeStringRecord(nextUiState.ptoHeaderLabels ?? fallbackUiState.ptoHeaderLabels));
        setPtoDatabaseMessage("ПТО загружено из Supabase.");
      } catch (error) {
        if (!cancelled) setPtoDatabaseMessage(`Supabase пока не готов: ${errorToMessage(error)}`);
      }
    }

    void loadPtoDatabase();

    return () => {
      cancelled = true;
    };
  }, [adminDataLoaded]);

  const collectAppStorageState = useCallback(() => (
    Object.fromEntries(
      Object.values(adminStorageKeys).flatMap((key) => {
        const value = window.localStorage.getItem(key);
        return value === null ? [] : [[key, value] as const];
      }),
    )
  ), []);

  const saveAppLocalState = useCallback(() => {
    window.localStorage.setItem(adminStorageKeys.reportCustomers, JSON.stringify(reportCustomers));
    window.localStorage.setItem(adminStorageKeys.reportAreaOrder, JSON.stringify(reportAreaOrder));
    window.localStorage.setItem(adminStorageKeys.reportWorkOrder, JSON.stringify(reportWorkOrder));
    window.localStorage.setItem(adminStorageKeys.reportHeaderLabels, JSON.stringify(reportHeaderLabels));
    window.localStorage.setItem(adminStorageKeys.reportColumnWidths, JSON.stringify(reportColumnWidths));
    window.localStorage.setItem(adminStorageKeys.reportReasons, JSON.stringify(reportReasons));
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

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (appStateSaveTimerRef.current !== null) {
      window.clearTimeout(appStateSaveTimerRef.current);
    }

    appStateSaveTimerRef.current = window.setTimeout(() => {
      saveAppLocalState();
      appStateSaveTimerRef.current = null;
    }, 300);

    return () => {
      if (appStateSaveTimerRef.current !== null) {
        window.clearTimeout(appStateSaveTimerRef.current);
        appStateSaveTimerRef.current = null;
      }
    };
  }, [adminDataLoaded, saveAppLocalState]);

  const saveAppDatabaseState = useCallback(async () => {
    if (!supabaseConfigured || !appDatabaseAvailableRef.current) return;

    const storage = collectAppStorageState();
    const snapshot = JSON.stringify(storage);
    if (snapshot === appDatabaseSaveSnapshotRef.current) return;

    const { saveAppStateToSupabase } = await import("@/lib/supabase/app-state");
    await saveAppStateToSupabase(storage);
    appDatabaseSaveSnapshotRef.current = snapshot;
  }, [collectAppStorageState]);

  useEffect(() => {
    if (!adminDataLoaded || !supabaseConfigured || !appDatabaseAvailableRef.current) return undefined;

    if (appDatabaseSaveTimerRef.current !== null) {
      window.clearTimeout(appDatabaseSaveTimerRef.current);
    }

    appDatabaseSaveTimerRef.current = window.setTimeout(() => {
      void saveAppDatabaseState().catch((error) => {
        appDatabaseAvailableRef.current = false;
        console.warn("Supabase app_state save failed:", error);
      });
      appDatabaseSaveTimerRef.current = null;
    }, 1500);

    return () => {
      if (appDatabaseSaveTimerRef.current !== null) {
        window.clearTimeout(appDatabaseSaveTimerRef.current);
        appDatabaseSaveTimerRef.current = null;
      }
    };
  }, [adminDataLoaded, saveAppDatabaseState, vehicleRows, dispatchSummaryRows, reportCustomers, reportAreaOrder, reportWorkOrder, reportHeaderLabels, reportColumnWidths, reportReasons, customTabs, topTabs, subTabs, orgMembers, dependencyNodes, dependencyLinks, adminLogs, ptoManualYears, ptoPlanRows, ptoSurveyRows, ptoOperRows, ptoColumnWidths, ptoRowHeights, ptoHeaderLabels, ptoBucketValues, ptoBucketManualRows, reportDate, ptoTab, ptoPlanYear, ptoAreaFilter, expandedPtoMonths]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (vehicleSaveTimerRef.current !== null) {
      window.clearTimeout(vehicleSaveTimerRef.current);
    }

    vehicleSaveTimerRef.current = window.setTimeout(() => {
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRowsRef.current));
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
      vehicleSaveTimerRef.current = null;
    }, 700);

    return () => {
      if (vehicleSaveTimerRef.current !== null) {
        window.clearTimeout(vehicleSaveTimerRef.current);
        vehicleSaveTimerRef.current = null;
      }
    };
  }, [adminDataLoaded, vehicleRows]);

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
    const uiState = state.uiState ?? {};

    window.localStorage.setItem(adminStorageKeys.ptoYears, JSON.stringify(state.manualYears));
    window.localStorage.setItem(adminStorageKeys.ptoPlanRows, JSON.stringify(state.planRows));
    window.localStorage.setItem(adminStorageKeys.ptoSurveyRows, JSON.stringify(state.surveyRows));
    window.localStorage.setItem(adminStorageKeys.ptoOperRows, JSON.stringify(state.operRows));
    window.localStorage.setItem(adminStorageKeys.ptoColumnWidths, JSON.stringify(uiState.ptoColumnWidths ?? {}));
    window.localStorage.setItem(adminStorageKeys.ptoRowHeights, JSON.stringify(uiState.ptoRowHeights ?? {}));
    window.localStorage.setItem(adminStorageKeys.ptoHeaderLabels, JSON.stringify(uiState.ptoHeaderLabels ?? {}));
    window.localStorage.setItem(adminStorageKeys.ptoBucketValues, JSON.stringify(state.bucketValues ?? {}));
    window.localStorage.setItem(adminStorageKeys.ptoBucketRows, JSON.stringify(state.bucketRows ?? []));

    if (ptoDatabaseLoadedRef.current) {
      window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
      hasStoredPtoStateRef.current = true;
    }
    window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
  }, []);

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

  const savePtoDatabaseChanges = useCallback(async (mode: "auto" | "manual" = "manual") => {
    if (!supabaseConfigured) {
      setPtoDatabaseMessage("База Supabase не настроена.");
      return;
    }

    if (!ptoDatabaseLoadedRef.current) return;

    const snapshotToSave = JSON.stringify(ptoDatabaseStateRef.current);
    if (mode === "auto" && snapshotToSave === ptoDatabaseSaveSnapshotRef.current) {
      setPtoDatabaseMessage("ПТО сохранено в Supabase.");
      return;
    }

    if (ptoDatabaseSavingRef.current) {
      ptoDatabaseSaveQueuedRef.current = true;
      return;
    }

    ptoDatabaseSavingRef.current = true;
    setPtoDatabaseMessage(mode === "auto" ? "Автосохраняю ПТО в Supabase..." : "Сохраняю ПТО в Supabase...");

    try {
      const { savePtoStateToSupabase } = await import("@/lib/supabase/pto");
      await savePtoStateToSupabase(ptoDatabaseStateRef.current);
      ptoDatabaseSaveSnapshotRef.current = snapshotToSave;
      setPtoDatabaseMessage(mode === "auto" ? "ПТО автосохранено в Supabase." : "ПТО сохранено в Supabase.");
    } catch (error) {
      setPtoDatabaseMessage(`Не удалось сохранить в Supabase: ${errorToMessage(error)}`);
    } finally {
      ptoDatabaseSavingRef.current = false;
      if (ptoDatabaseSaveQueuedRef.current) {
        ptoDatabaseSaveQueuedRef.current = false;
        if (JSON.stringify(ptoDatabaseStateRef.current) !== ptoDatabaseSaveSnapshotRef.current) {
          setPtoSaveRevision((current) => current + 1);
        }
      }
    }
  }, []);

  const requestPtoDatabaseSave = useCallback(() => {
    if (!supabaseConfigured || !ptoDatabaseLoadedRef.current) return;
    setPtoDatabaseMessage("Есть изменения. Автосохраняю после завершенного действия...");
    setPtoSaveRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!adminDataLoaded || !supabaseConfigured || !ptoDatabaseLoadedRef.current || ptoSaveRevision === 0) return;
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
  const renderedTopTab = topTab;
  const needsReportRows = renderedTopTab === "reports"
    || (renderedTopTab === "admin" && adminSection === "reports");
  const needsDerivedReportRows = renderedTopTab === "reports";
  const needsAdminReportRows = renderedTopTab === "admin" && adminSection === "reports";
  const needsReportIndexes = needsDerivedReportRows || needsAdminReportRows;
  const needsAutoReportRows = needsDerivedReportRows || needsAdminReportRows;

  const reportBaseRows = useMemo(() => {
    if (!needsReportRows) return [];

    const rowsByKey = new Map<string, ReportRow>();

    [...deferredPtoPlanRows, ...deferredPtoSurveyRows, ...deferredPtoOperRows].forEach((row) => {
      if (!row.structure.trim()) return;

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
        plan: buildReportPtoIndex(deferredPtoPlanRows),
        survey: buildReportPtoIndex(deferredPtoSurveyRows),
        oper: buildReportPtoIndex(deferredPtoOperRows),
      }
      : null
  ), [deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, needsReportIndexes]);

  const reportAreaOrderOptions = useMemo(() => (
    needsAdminReportRows
      ? sortAreaNamesByOrder(
      uniqueSorted(reportBaseRows.map((row) => row.area).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))),
        reportAreaOrder,
      )
      : []
  ), [needsAdminReportRows, reportAreaOrder, reportBaseRows]);

  const derivedReportRows = useMemo(() => (
    needsDerivedReportRows && reportPtoIndexes ? reportBaseRows.map((row) => {
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
  ), [needsDerivedReportRows, reportBaseRows, reportDate, reportPtoIndexes, reportReasons]);

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
  const adminReportRowsByKey = useMemo(() => (
    new Map(adminReportBaseRows.map((row) => [reportRowKey(row), row]))
  ), [adminReportBaseRows]);
  const reportPtoDateStatusByKey = useMemo(() => (
    (needsAdminReportRows || renderedTopTab === "reports") && reportPtoIndexes
      ? new Map(reportBaseRows.map((row) => [reportRowKey(row), reportPtoDateStatusFromIndexes(row, reportDate, reportPtoIndexes.plan, reportPtoIndexes.survey, reportPtoIndexes.oper)]))
      : new Map<string, ReturnType<typeof reportPtoDateStatusFromIndexes>>()
  ), [needsAdminReportRows, renderedTopTab, reportBaseRows, reportDate, reportPtoIndexes]);
  const autoReportRowKeys = useMemo(() => (
    needsAutoReportRows
      ? new Set(
        reportBaseRows
          .filter((row) => reportPtoDateStatusHasAny(reportPtoDateStatusByKey.get(reportRowKey(row))))
          .map(reportRowKey),
      )
      : new Set<string>()
  ), [needsAutoReportRows, reportBaseRows, reportPtoDateStatusByKey]);

  const adminReportWorkOrderGroups = useMemo(() => (
    needsAdminReportRows
      ? reportAreaOrderOptions.map((area) => ({
        area,
        rows: sortReportRowsByAreaOrder(
          reportBaseRows.filter((row) => normalizeLookupValue(row.area) === normalizeLookupValue(area)),
          [area],
          reportWorkOrder,
        ),
      }))
      : []
  ), [needsAdminReportRows, reportAreaOrderOptions, reportBaseRows, reportWorkOrder]);

  const activeAdminReportSelectedCount = useMemo(() => (
    needsAdminReportRows
      ? adminReportBaseRows.filter((row) => reportCustomerEffectiveRowKeys(activeAdminReportCustomer, autoReportRowKeys).has(reportRowKey(row))).length
      : 0
  ), [activeAdminReportCustomer, adminReportBaseRows, autoReportRowKeys, needsAdminReportRows]);
  const activeAdminReportRowLabelEntries = useMemo(() => (
    needsAdminReportRows
      ? Object.entries(activeAdminReportCustomer.rowLabels).flatMap(([rowKey, label]) => {
        const row = adminReportRowsByKey.get(rowKey);
        return row ? [{ rowKey, label, row }] : [];
      })
      : []
  ), [activeAdminReportCustomer, adminReportRowsByKey, needsAdminReportRows]);
  const activeAdminReportUsesSummaryRows = reportCustomerUsesSummaryRows(activeAdminReportCustomer);
  const visibleAdminReportCustomerSettingsTab: AdminReportCustomerSettingsTab = activeAdminReportUsesSummaryRows || adminReportCustomerSettingsTab !== "summary"
    ? adminReportCustomerSettingsTab
    : "display";

  const customerReportRows = useMemo(() => {
    if (!needsDerivedReportRows) return [];

    const visibleRowKeys = reportCustomerEffectiveRowKeys(activeReportCustomer, autoReportRowKeys);
    const selectedRows = derivedReportRows
      .filter((row) => visibleRowKeys.has(reportRowKey(row)))
      .map((row) => {
        const rowKey = reportRowKey(row);
        const customerLabel = activeReportCustomer.rowLabels[rowKey]?.trim();

        return customerLabel ? { ...row, name: customerLabel, displayKey: rowKey } : row;
      });
    const rowsByKey = new Map(derivedReportRows.map((row) => [reportRowKey(row), row]));
    const summaryRows = reportCustomerUsesSummaryRows(activeReportCustomer)
      ? activeReportCustomer.summaryRows.flatMap((summary) => {
        const sourceRows = summary.rowKeys
          .map((key) => rowsByKey.get(key))
          .filter((row): row is ReportRow => Boolean(row));
        const summaryRow = createReportSummaryRow(summary, sourceRows);
        return summaryRow ? [summaryRow] : [];
      })
      : [];

    return sortReportRowsByAreaOrder([...selectedRows, ...summaryRows], reportAreaOrder, reportWorkOrder);
  }, [activeReportCustomer, autoReportRowKeys, derivedReportRows, needsDerivedReportRows, reportAreaOrder, reportWorkOrder]);

  const reportAreaTabs = useMemo(() => [
    "Все участки",
    ...(
      needsDerivedReportRows
        ? sortAreaNamesByOrder(
            uniqueSorted(customerReportRows.map((row) => row.area).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))),
            reportAreaOrder,
          )
        : []
    ),
  ], [customerReportRows, needsDerivedReportRows, reportAreaOrder]);

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
        return `${formatNumber(row.dayProductivity || row.dayFact)} ${formatPercent(row.dayFact, row.dayPlan)}`;
      case "day-reason":
        return reportReason(row.dayFact, row.dayPlan, row.dayReason);
      case "month-total-plan":
        return formatNumber(row.monthTotalPlan);
      case "month-plan":
        return formatNumber(row.monthPlan);
      case "month-fact":
        return `${formatNumber(monthFact)} марк ${formatNumber(row.monthSurveyFact)} + опер ${formatNumber(row.monthOperFact)}`;
      case "month-delta":
        return formatNumber(delta(row.monthPlan, monthFact));
      case "month-productivity":
        return `${formatNumber(row.monthProductivity || monthFact)} ${formatPercent(monthFact, row.monthPlan)}`;
      case "year-plan":
        return formatNumber(row.yearPlan);
      case "year-fact":
        return `${formatNumber(yearFact)} марк ${formatNumber(row.yearSurveyFact)} + опер ${formatNumber(row.yearOperFact)}`;
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

  const autoReportColumnWidths = useMemo(() => (
    Object.fromEntries(reportColumnKeys.map((key, index) => {
      if (!needsDerivedReportRows) return [key, defaultReportColumnWidths[index] ?? 80];

      const header = reportHeaderLabels[key]?.trim() || reportColumnHeaderFallbacks[key];
      const values = filteredReports.map((row) => reportColumnTextValue(key, row));
      return [key, reportAutoColumnWidth(key, header, values)];
    })) as Record<ReportColumnKey, number>
  ), [filteredReports, needsDerivedReportRows, reportColumnTextValue, reportHeaderLabels]);

  const reportTableColumnWidths = useMemo(() => (
    reportColumnKeys.map((key, index) => (
      Math.min(520, Math.max(
        autoReportColumnWidths[key] ?? defaultReportColumnWidths[index] ?? 80,
        Math.round(reportColumnWidths[key] ?? 0),
      ))
    ))
  ), [autoReportColumnWidths, reportColumnWidths]);
  const reportColumnWidthByKey = useMemo(() => (
    new Map(reportColumnKeys.map((key, index) => [key, reportTableColumnWidths[index]]))
  ), [reportTableColumnWidths]);
  const reportTableMinWidth = useMemo(() => (
    reportTableColumnWidths.reduce((sum, width) => sum + width, 0)
  ), [reportTableColumnWidths]);

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
    isPtoBucketsSection ? [...ptoPlanRows, ...ptoSurveyRows, ...ptoOperRows] : activePtoDateRows
  ), [activePtoDateRows, isPtoBucketsSection, ptoOperRows, ptoPlanRows, ptoSurveyRows]);
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

    const rowsByKey = new Map<string, PtoBucketRow>();

    allPtoDateRows.forEach((row) => {
      const area = cleanAreaName(row.area).trim();
      const structure = row.structure.trim();
      if (!area || !structure) return;

      const key = ptoBucketRowKey(area, structure);
      if (!rowsByKey.has(key)) rowsByKey.set(key, { key, area, structure, source: "auto" });
    });

    ptoBucketManualRows.forEach((row) => {
      if (!rowsByKey.has(row.key)) rowsByKey.set(row.key, { ...row, source: "manual" });
    });

    return Array.from(rowsByKey.values())
      .filter((row) => ptoAreaMatches(row.area, ptoAreaFilter));
  }, [allPtoDateRows, isPtoBucketsSection, ptoAreaFilter, ptoBucketManualRows]);
  const ptoBucketColumns = useMemo<PtoBucketColumn[]>(() => {
    if (!isPtoBucketsSection) return [];

    const columnsByKey = new Map<string, PtoBucketColumn>();

    deferredVehicleRows
      .filter((vehicle) => vehicle.visible !== false)
      .filter(isLoadingEquipment)
      .forEach((vehicle) => {
        const label = loadingEquipmentLabel(vehicle);
        if (!label) return;

        const key = normalizeLookupValue(label);
        if (!columnsByKey.has(key)) columnsByKey.set(key, { key, label });
      });

    return Array.from(columnsByKey.values())
      .sort((left, right) => left.label.localeCompare(right.label, "ru"));
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
    setPtoTab(tab);
  }

  function selectPtoPlanYear(year: string) {
    setPtoPlanYear(year);
  }

  function selectPtoArea(area: string) {
    setPtoAreaFilter(area);
  }

  function selectReportDate(value: string) {
    setReportDate(value);
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

  function updateReportCustomer(customerId: string, patch: Partial<Pick<ReportCustomerConfig, "label" | "visible" | "autoShowRows">>) {
    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId ? { ...customer, ...patch } : customer
    )));
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
      visible: true,
      autoShowRows: false,
      rowKeys: [],
      hiddenRowKeys: [],
      rowLabels: {},
      summaryRows: [],
    };

    setReportCustomers((current) => [...current, customer]);
    setAdminReportCustomerId(customerId);
    setAdminReportTab("customer");
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
    setAdminReportTab("customer");
    addAdminLog({
      action: "Удаление",
      section: "Отчетность",
      details: `Удален заказчик отчета: ${customer.label}.`,
    });
  }

  function moveReportAreaOrder(area: string, direction: -1 | 1) {
    const sourceIndex = reportAreaOrderOptions.findIndex((item) => normalizeLookupValue(item) === normalizeLookupValue(area));
    const targetIndex = sourceIndex + direction;
    if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= reportAreaOrderOptions.length) return;

    const nextOrder = [...reportAreaOrderOptions];
    [nextOrder[sourceIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[sourceIndex]];
    setReportAreaOrder(nextOrder);
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен порядок отображения участков.",
    });
  }

  function moveReportWorkOrder(area: string, rowKey: string, direction: -1 | 1) {
    const areaKey = normalizeLookupValue(area);
    const areaRows = sortReportRowsByAreaOrder(
      reportBaseRows.filter((row) => normalizeLookupValue(row.area) === areaKey),
      [area],
      reportWorkOrder,
    );
    const rowKeys = areaRows.map(reportRowKey);
    const sourceIndex = rowKeys.indexOf(rowKey);
    const targetIndex = sourceIndex + direction;
    if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= rowKeys.length) return;

    const nextRowKeys = [...rowKeys];
    [nextRowKeys[sourceIndex], nextRowKeys[targetIndex]] = [nextRowKeys[targetIndex], nextRowKeys[sourceIndex]];
    setReportWorkOrder((current) => ({ ...current, [areaKey]: nextRowKeys }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен порядок видов работ внутри участка.",
    });
  }

  function toggleReportCustomerRow(customerId: string, rowKey: string) {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const effectiveRowKeys = reportCustomerEffectiveRowKeys(customer, autoReportRowKeys);
      const currentlyVisible = effectiveRowKeys.has(rowKey);
      const autoCanShow = customer.autoShowRows && autoReportRowKeys.has(rowKey);
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

    const customerVisibleRowKeys = reportCustomerEffectiveRowKeys(customer, autoReportRowKeys);
    const selectedRows = adminReportBaseRows.filter((row) => customerVisibleRowKeys.has(reportRowKey(row)));
    const sourceRows = selectedRows.length > 0 ? selectedRows : adminReportBaseRows;
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

    const currentRow = adminReportRowsByKey.get(currentRowKey);
    const nextRow = adminReportRowsByKey.get(nextRowKey);
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

  function reportRowsForSummaryArea(area: string) {
    const areaKey = normalizeLookupValue(area);
    return adminReportBaseRows.filter((row) => normalizeLookupValue(row.area) === areaKey);
  }

  function reportRowKeysForSummaryArea(area: string) {
    return reportRowsForSummaryArea(area).map(reportRowKey);
  }

  function addReportSummaryRow(customerId: string) {
    const customer = reportCustomers.find((item) => item.id === customerId);
    if (!customer || !reportCustomerUsesSummaryRows(customer)) return;
    const area = reportAreaOrderOptions[0] ?? adminReportBaseRows[0]?.area ?? "";
    const summaryId = createId();

    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? {
          ...customer,
          summaryRows: [
            ...customer.summaryRows,
            { id: summaryId, label: "Итоговая строка", unit: "", area, rowKeys: reportRowKeysForSummaryArea(area) },
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
              return { ...summary, area: value, rowKeys: reportRowKeysForSummaryArea(value) };
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

  function addLinkedPtoDateRow(overrides: Partial<PtoPlanRow> = {}, insertAfterRow?: PtoPlanRow) {
    const id = createId();
    const sharedOverrides = {
      area: overrides.area,
      location: overrides.location,
      structure: overrides.structure,
      unit: overrides.unit,
      coefficient: overrides.coefficient,
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
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО",
      details: `Удален год ${year}.`,
    });
  }

  function updatePtoDateRow(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, field: keyof Omit<PtoPlanRow, "id" | "dailyPlans">, value: string) {
    const numericFields: Array<keyof PtoPlanRow> = ["coefficient", "carryover"];
    const sharedFields: Array<keyof Omit<PtoPlanRow, "id" | "dailyPlans">> = ["area", "location", "structure", "unit", "coefficient"];
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
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const dailyPlans = { ...row.dailyPlans };
        const year = day.slice(0, 4);
        if (value.trim() === "") {
          delete dailyPlans[day];
        } else {
          dailyPlans[day] = parseDecimalValue(value);
        }

        return {
          ...row,
          dailyPlans,
          years: uniqueSorted([...(row.years ?? []), year]),
        };
      }),
    );
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменено значение за день ${day} в ${currentPtoTableLabel()}.`,
    });
  }

  function updatePtoMonthTotal(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, days: string[], value: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const nextDailyPlans = { ...row.dailyPlans };
        days.forEach((day) => {
          delete nextDailyPlans[day];
        });

        if (value.trim()) {
          Object.assign(nextDailyPlans, distributeMonthlyTotal(parseDecimalValue(value), days));
        }

        return {
          ...row,
          dailyPlans: nextDailyPlans,
          years: days[0] ? uniqueSorted([...(row.years ?? []), days[0].slice(0, 4)]) : row.years,
        };
      }),
    );
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Распределен итог месяца в ${currentPtoTableLabel()}.`,
    });
  }

  function removeLinkedPtoDateRow(row: PtoPlanRow) {
    const rowName = [cleanAreaName(row.area), row.structure].filter(Boolean).join(" / ") || "строку ПТО";
    const confirmed = window.confirm(`Вы точно хотите удалить ${rowName}? Строка удалится из Плана, Оперучета и Замера.`);
    if (!confirmed) return;

    const signature = ptoLinkedRowSignature(row);
    const removeRow = (current: PtoPlanRow[]) => current.filter((item) => !ptoLinkedRowMatches(item, row.id, signature));

    setPtoPlanRows(removeRow);
    setPtoOperRows(removeRow);
    setPtoSurveyRows(removeRow);
    requestPtoDatabaseSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО",
      details: `Удалена строка: ${rowName}.`,
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

  function addCustomTab() {
    const title = customTabForm.title.trim();
    if (!title) return;

    const nextTab: CustomTab = {
      id: createId(),
      title,
      description: customTabForm.description.trim(),
      items: [],
      visible: true,
    };

    setCustomTabs((current) => [...current, nextTab]);
    setCustomTabForm(defaultCustomTabForm);
    setTopTab(customTabKey(nextTab.id));
  }

  function updateTopTabLabel(id: BaseTopTab, label: string) {
    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, label } : tab)),
    );
  }

  function hideTopTab(id: BaseTopTab) {
    if (id === "admin") return;

    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, visible: false } : tab)),
    );

    if (topTab === id) {
      setTopTab("admin");
    }
  }

  function showTopTab(id: BaseTopTab) {
    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, visible: true } : tab)),
    );
  }

  function updateCustomTab(id: string, patch: Partial<CustomTab>) {
    setCustomTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)),
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

  function updateSubTabLabel(group: EditableSubtabGroup, id: string, label: string) {
    const currentTab = subTabs[group].find((tab) => tab.id === id);

    setSubTabs((current) => ({
      ...current,
      [group]: current[group].map((tab) =>
        tab.id === id
          ? { ...tab, label, value: group === "reports" && tab.value !== "Все участки" ? label : tab.value }
          : tab,
      ),
    }));

    if (group === "reports" && currentTab && currentTab.value !== "Все участки") {
      if (reportArea === currentTab.value) {
        setReportArea(label);
      }
    }
  }

  function updateSubTabContent(group: EditableSubtabGroup, id: string, content: string) {
    setSubTabs((current) => ({
      ...current,
      [group]: current[group].map((tab) => (tab.id === id ? { ...tab, content } : tab)),
    }));
  }

  function addSubTab() {
    const label = newSubTabForm.label.trim();
    if (!label) return;

    const id = createId();
    const nextTab: SubTabConfig = {
      id,
      label,
      value: newSubTabForm.group === "reports" ? label : `custom:${id}`,
      visible: true,
      content: newSubTabForm.content.trim(),
    };

    setSubTabs((current) => ({
      ...current,
      [newSubTabForm.group]: [...current[newSubTabForm.group], nextTab],
    }));
    setNewSubTabForm({ group: "reports", label: "", content: "" });
  }

  function removeSubTab(group: EditableSubtabGroup, id: string) {
    const removedTab = subTabs[group].find((tab) => tab.id === id);
    if (!removedTab) return;

    setSubTabs((current) => ({
      ...current,
      [group]: removedTab.builtIn
        ? current[group].map((tab) => (tab.id === id ? { ...tab, visible: false } : tab))
        : current[group].filter((tab) => tab.id !== id),
    }));

    if (group === "reports" && reportArea === removedTab.value) setReportArea("Все участки");
    if (group === "dispatch" && dispatchTab === removedTab.value) setDispatchTab("daily");
    if (group === "fleet" && fleetTab === removedTab.value) setFleetTab("all");
    if (group === "contractors" && contractorTab === removedTab.value) setContractorTab("AA Mining");
    if (group === "fuel" && fuelTab === removedTab.value) setFuelTab("general");
    if (group === "pto" && ptoTab === removedTab.value) setPtoTab("bodies");
    if (group === "tb" && tbTab === removedTab.value) setTbTab("list");
  }

  function showSubTab(group: EditableSubtabGroup, id: string) {
    setSubTabs((current) => ({
      ...current,
      [group]: current[group].map((tab) => (tab.id === id ? { ...tab, visible: true } : tab)),
    }));
  }

  function addQuickSubTab(group: EditableSubtabGroup) {
    const id = createId();
    const label = "Новая подвкладка";
    const nextTab: SubTabConfig = {
      id,
      label,
      value: group === "reports" ? label : `custom:${id}`,
      visible: true,
      content: "",
    };

    setSubTabs((current) => ({
      ...current,
      [group]: [...current[group], nextTab],
    }));
    setEditingSubTabId(id);
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

  function getSubTabGroup(id: BaseTopTab): EditableSubtabGroup | null {
    return id in subTabs ? (id as EditableSubtabGroup) : null;
  }

  function restoreDefaultNavigation() {
    setTopTabs(defaultTopTabs);
    setSubTabs(defaultSubTabs);
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
    const rows = createPtoPlanExportRows(meta.rows, ptoPlanYear, ptoAreaFilter);
    const fileName = ptoDateExportFileName(meta, ptoPlanYear, ptoAreaFilter);
    const blob = createXlsxBlob(rows, meta.label, {
      columns: createPtoPlanExportColumns(ptoPlanYear),
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

    setPtoPlanRows((current) => mergeImportedPtoPlanRows(current, importedRows));
    setPtoOperRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
    setPtoSurveyRows((current) => ensureImportedRowsInLinkedPtoTable(current, importedRows, ptoPlanYear));
  }

  async function importPtoDateTableFromExcel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const meta = currentPtoDateExcelMeta();

    try {
      const importedRows = createPtoPlanRowsFromImportTable(await parseTableImportFile(file), ptoPlanYear, meta.rows);
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
    const editableMonthTotal = options.editableMonthTotal === true;
    const filteredRows = rows.filter((row) => ptoAreaMatches(row.area, ptoAreaFilter) && ptoRowHasYear(row, ptoPlanYear));
    const rowById = new Map(rows.map((row) => [row.id, row] as const));
    const rowDateTotalsCache = new Map<string, {
      monthTotals: Map<string, { hasValue: boolean; value: number }>;
      yearDailyTotal: number;
    }>();
    const effectiveCarryoverCache = new Map<string, number>();
    const getRowDateTotals = (row: PtoPlanRow) => {
      const cached = rowDateTotalsCache.get(row.id);
      if (cached) return cached;

      const monthTotals = new Map<string, { hasValue: boolean; value: number }>();
      let yearDailyTotal = 0;

      Object.entries(row.dailyPlans).forEach(([date, value]) => {
        if (!date.startsWith(ptoPlanYear) || !Number.isFinite(value)) return;

        yearDailyTotal += value;
        const month = date.slice(0, 7);
        const current = monthTotals.get(month) ?? { hasValue: false, value: 0 };
        current.hasValue = true;
        current.value += value;
        monthTotals.set(month, current);
      });

      const totals = {
        monthTotals,
        yearDailyTotal: Math.round(yearDailyTotal * 1000000) / 1000000,
      };
      rowDateTotalsCache.set(row.id, totals);
      return totals;
    };
    const getEffectiveCarryover = (row: PtoPlanRow) => {
      const cached = effectiveCarryoverCache.get(row.id);
      if (cached !== undefined) return cached;

      const value = ptoEffectiveCarryover(row, ptoPlanYear, rows);
      effectiveCarryoverCache.set(row.id, value);
      return value;
    };
    const carryoverHeader = `Остатки ${previousPtoYearLabel(ptoPlanYear)}`;
    const columnWidth = (key: string, fallback: number) => Math.min(800, Math.max(44, Math.round(ptoColumnWidths[key] ?? fallback)));
    const readonlyExpandedMonth = reportDate.startsWith(`${ptoPlanYear}-`) ? reportDate.slice(0, 7) : (ptoYearMonths[0] ?? `${ptoPlanYear}-01`);
    const displayPtoMonthGroups = ptoDateEditing
      ? ptoMonthGroups
      : ptoMonthGroups.map((group) => ({
          ...group,
          expanded: group.month === readonlyExpandedMonth,
        }));
    const baseColumns: PtoTableColumn[] = [
      { key: "area", width: columnWidth("area", ptoColumnDefaults.area) },
      ...(showLocation ? [{ key: "location", width: columnWidth("location", ptoColumnDefaults.location) }] : []),
      { key: "structure", width: columnWidth("structure", ptoColumnDefaults.structure) },
      { key: "unit", width: columnWidth("unit", ptoColumnDefaults.unit) },
      { key: "coefficient", width: columnWidth("coefficient", ptoColumnDefaults.coefficient) },
      { key: "status", width: columnWidth("status", ptoColumnDefaults.status) },
      { key: `carryover:${ptoPlanYear}`, width: columnWidth(`carryover:${ptoPlanYear}`, ptoColumnDefaults.carryover) },
      { key: "year-total", width: columnWidth("year-total", ptoColumnDefaults.yearTotal) },
    ];
    const dateColumns = displayPtoMonthGroups.flatMap((group) => [
      { key: `month-total:${group.month}`, width: columnWidth(`month-total:${group.month}`, ptoColumnDefaults.monthTotal) },
      ...(group.expanded ? group.days.map((day) => ({ key: `day:${day}`, width: columnWidth(`day:${day}`, ptoColumnDefaults.day) })) : []),
    ]);
    const tableColumns = [...baseColumns, ...dateColumns];
    const tableMinWidth = tableColumns.reduce((sum, column) => sum + column.width, 0);
    const columnWidthByKey = new Map(tableColumns.map((column) => [column.key, column.width]));
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
    };
    const renderReadonlyTextCell = (value: string, align: React.CSSProperties["textAlign"] = "left") => (
      <div style={{ ...ptoReadonlyCellTextStyle, textAlign: align }} title={value || undefined}>
        {value || ""}
      </div>
    );
    const renderReadonlyNumberCell = (value: number | undefined, options: { bold?: boolean } = {}) => (
      <div
        style={{
          ...ptoReadonlyCellNumberStyle,
          ...(options.bold ? { fontWeight: 800 } : null),
        }}
        title={formatPtoFormulaNumber(value)}
      >
        {formatPtoCellNumber(value)}
      </div>
    );

    if (!ptoDateEditing) {
      return (
        <div style={ptoDateTableLayoutStyle}>
          <div style={ptoToolbarStyle}>
            <div style={ptoToolbarBlockStyle}>
              <span style={ptoToolbarLabelStyle}>Участки</span>
              <div style={ptoToolbarRowStyle}>
                {ptoAreaTabs.map((area) => (
                  <PtoToolbarButton key={area} active={ptoAreaFilter === area} onClick={() => selectPtoArea(area)} label={area} />
                ))}
              </div>
            </div>

            {(["plan", "oper", "survey"] as string[]).includes(ptoTab) ? (
              <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
                <span style={ptoToolbarLabelStyle}>Excel</span>
                <div style={ptoToolbarRowStyle}>
                  <PtoToolbarIconButton label={`Скачать ${currentPtoDateExcelMeta().label} в Excel`} onClick={exportPtoDateTableToExcel}>
                    <Download size={14} aria-hidden />
                  </PtoToolbarIconButton>
                  <PtoToolbarIconButton label={`Загрузить ${currentPtoDateExcelMeta().label} из Excel`} onClick={openPtoDateImportFilePicker}>
                    <Upload size={14} aria-hidden />
                  </PtoToolbarIconButton>
                  <PtoToolbarIconButton label="Редактировать таблицу" onClick={togglePtoDateEditing}>
                    <Pencil size={14} aria-hidden />
                  </PtoToolbarIconButton>
                </div>
                <input
                  ref={ptoPlanImportInputRef}
                  accept=".xlsx,.csv"
                  onChange={importPtoDateTableFromExcel}
                  style={{ display: "none" }}
                  type="file"
                />
              </div>
            ) : null}

            <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
              <span style={ptoToolbarLabelStyle}>Годы</span>
              <div style={ptoToolbarRowStyle}>
                <PtoToolbarIconButton label="Удалить выбранный год" onClick={deletePtoYear}>
                  <span aria-hidden>−</span>
                </PtoToolbarIconButton>
                {ptoYearTabs.map((year) => (
                  <PtoToolbarButton key={year} active={ptoPlanYear === year} onClick={() => {
                    selectPtoPlanYear(year);
                  }} label={year} />
                ))}
                <PtoToolbarIconButton label="Добавить год" onClick={() => {
                  setPtoYearInput("");
                  setPtoYearDialogOpen(true);
                }}>
                  <span aria-hidden>+</span>
                </PtoToolbarIconButton>
              </div>
              {ptoYearDialogOpen ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    addPtoYear();
                  }}
                  style={ptoYearDialogStyle}
                >
                  <label style={{ display: "grid", gap: 3 }}>
                    <span style={ptoToolbarLabelStyle}>Новый год</span>
                    <input
                      autoFocus
                      type="number"
                      min="1900"
                      max="2100"
                      value={ptoYearInput}
                      onChange={(event) => setPtoYearInput(event.target.value)}
                      style={{ ...inputStyle, width: 96, padding: "5px 8px", borderRadius: 8, fontSize: 12 }}
                    />
                  </label>
                  <PtoToolbarButton active onClick={addPtoYear} label="ОК" />
                  <PtoToolbarButton active={false} onClick={() => {
                    setPtoYearDialogOpen(false);
                    setPtoYearInput("");
                  }} label="Отмена" />
                </form>
              ) : null}
            </div>
          </div>

          <div ref={ptoDateTableScrollRef} style={ptoDateTableScrollStyle}>
            <table style={{ ...ptoPlanTableStyle, width: tableMinWidth, minWidth: tableMinWidth, marginRight: 40 }}>
              <colgroup>
                {tableColumns.map((column) => (
                  <col key={column.key} style={{ width: column.width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <PtoPlanTh rowSpan={2} columnKey="area" width={columnWidthByKey.get("area")}>{ptoHeaderLabel("area", "Участок")}</PtoPlanTh>
                  {showLocation ? <PtoPlanTh rowSpan={2} columnKey="location" width={columnWidthByKey.get("location")}>{ptoHeaderLabel("location", "Местонахождение")}</PtoPlanTh> : null}
                  <PtoPlanTh rowSpan={2} columnKey="structure" width={columnWidthByKey.get("structure")}>{ptoHeaderLabel("structure", "Структура")}</PtoPlanTh>
                  <PtoPlanTh rowSpan={2} align="center" columnKey="unit" width={columnWidthByKey.get("unit")}>{ptoHeaderLabel("unit", "Ед.")}</PtoPlanTh>
                  <PtoPlanTh rowSpan={2} align="center" columnKey="coefficient" width={columnWidthByKey.get("coefficient")}>{ptoHeaderLabel("coefficient", "Коэфф.")}</PtoPlanTh>
                  <PtoPlanTh rowSpan={2} align="center" columnKey="status" width={columnWidthByKey.get("status")}>{ptoHeaderLabel("status", "Статус")}</PtoPlanTh>
                  <PtoPlanTh rowSpan={2} align="center" columnKey={`carryover:${ptoPlanYear}`} width={columnWidthByKey.get(`carryover:${ptoPlanYear}`)}>{ptoHeaderLabel(`carryover:${ptoPlanYear}`, carryoverHeader)}</PtoPlanTh>
                  <PtoPlanTh rowSpan={2} align="center" columnKey="year-total" width={columnWidthByKey.get("year-total")}>{ptoHeaderLabel("year-total", "Итого год")}</PtoPlanTh>
                  {displayPtoMonthGroups.map((group) => (
                    <PtoPlanTh key={group.month} colSpan={1 + (group.expanded ? group.days.length : 0)}>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedPtoMonths((current) => ({ ...current, [group.month]: !current[group.month] }));
                          requestPtoDatabaseSave();
                        }}
                        style={monthToggleStyle}
                        title="Клик — свернуть/развернуть"
                      >
                        {group.expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                        {ptoHeaderLabel(`month-group:${group.month}`, group.label)}
                      </button>
                    </PtoPlanTh>
                  ))}
                </tr>
                <tr>
                  {displayPtoMonthGroups.map((group) => (
                    <Fragment key={`${group.month}-days-readonly`}>
                      <PtoPlanTh align="center" columnKey={`month-total:${group.month}`} width={columnWidthByKey.get(`month-total:${group.month}`)}>Итого</PtoPlanTh>
                      {group.expanded && group.days.map((day) => (
                        <PtoPlanTh key={day} align="center" columnKey={`day:${day}`} width={columnWidthByKey.get(`day:${day}`)}>{day.slice(8, 10)}</PtoPlanTh>
                      ))}
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const rowStatus = ptoAutomatedStatus(row, reportDate);
                  const effectiveCarryover = getEffectiveCarryover(row);
                  const rowDateTotals = getRowDateTotals(row);
                  const rowHeightKey = `${ptoTab}:${row.id}`;
                  const rowHeight = ptoRowHeights[rowHeightKey];
                  const rowYearTotalWithCarryover = Math.round(((rowDateTotals.yearDailyTotal ?? 0) + effectiveCarryover) * 1000000) / 1000000;

                  return (
                    <tr key={row.id} style={{ background: ptoStatusRowBackground(rowStatus), ...(rowHeight ? { height: rowHeight } : null) }}>
                      <PtoPlanTd>{renderReadonlyTextCell(row.area)}</PtoPlanTd>
                      {showLocation ? <PtoPlanTd>{renderReadonlyTextCell(row.location)}</PtoPlanTd> : null}
                      <PtoPlanTd>{renderReadonlyTextCell(row.structure)}</PtoPlanTd>
                      <PtoPlanTd align="center">{renderReadonlyTextCell(normalizePtoUnit(row.unit), "center")}</PtoPlanTd>
                      <PtoPlanTd align="center">{renderReadonlyNumberCell(row.coefficient)}</PtoPlanTd>
                      <PtoPlanTd align="center">
                        <span
                          title="Статус рассчитывается по рабочей дате и заполненным значениям месяца"
                          style={{ ...ptoStatusBadgeStyle, ...ptoStatusControlStyle(rowStatus) }}
                        >
                          {rowStatus}
                        </span>
                      </PtoPlanTd>
                      <PtoPlanTd align="center">{renderReadonlyNumberCell(effectiveCarryover)}</PtoPlanTd>
                      <PtoPlanTd align="center">{renderReadonlyNumberCell(rowYearTotalWithCarryover, { bold: true })}</PtoPlanTd>
                      {displayPtoMonthGroups.map((group) => {
                        const monthValue = rowDateTotals.monthTotals.get(group.month)?.value;
                        return (
                          <Fragment key={`${row.id}-${group.month}-readonly`}>
                            <PtoPlanTd align="center">{renderReadonlyNumberCell(monthValue, { bold: true })}</PtoPlanTd>
                            {group.expanded && group.days.map((day) => (
                              <PtoPlanTd key={`${row.id}-${day}-readonly`} align="center">{renderReadonlyNumberCell(row.dailyPlans[day])}</PtoPlanTd>
                            ))}
                          </Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    const activeFormulaCell = ptoFormulaCell?.table === ptoTab && ptoFormulaCell.year === ptoPlanYear ? ptoFormulaCell : null;
    const activeInlineEditCell = ptoInlineEditCell?.table === ptoTab && ptoInlineEditCell.year === ptoPlanYear ? ptoInlineEditCell : null;
    const activeFormulaRow = activeFormulaCell ? rowById.get(activeFormulaCell.rowId) : undefined;
    const activeFormulaRowTotals = activeFormulaRow ? getRowDateTotals(activeFormulaRow) : undefined;
    const activeFormulaValue = activeFormulaRow && activeFormulaCell
      ? activeFormulaCell.kind === "coefficient"
        ? activeFormulaRow.coefficient
        : activeFormulaCell.kind === "carryover"
          ? getEffectiveCarryover(activeFormulaRow)
          : activeFormulaCell.kind === "month" && activeFormulaCell.month
            ? activeFormulaRowTotals?.monthTotals.get(activeFormulaCell.month)?.value
            : activeFormulaCell.kind === "day" && activeFormulaCell.day
              ? activeFormulaRow.dailyPlans[activeFormulaCell.day]
              : undefined
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
    const formulaCellRows = renderedRows.map((row) => {
      const cells: Array<Omit<PtoFormulaCell, "table" | "year">> = [
        { rowId: row.id, kind: "coefficient", label: "Коэфф." },
        { rowId: row.id, kind: "carryover", label: carryoverHeader },
        ...displayPtoMonthGroups.flatMap((group) => [
          ...(editableMonthTotal
            ? [{
                rowId: row.id,
                kind: "month" as const,
                month: group.month,
                days: group.days,
                label: group.label,
                editable: true,
              }]
            : []),
          ...(group.expanded
            ? group.days.map((day) => ({
                rowId: row.id,
                kind: "day" as const,
                day,
                label: `${day.slice(8, 10)}.${day.slice(5, 7)}`,
              }))
            : []),
        ]),
      ];

      return { row, cells };
    });

    const formulaCellKey = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => `${cell.rowId}:${cell.kind}:${cell.month ?? cell.day ?? ""}`;
    const formulaCellDomKey = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => `${ptoTab}:${ptoPlanYear}:${formulaCellKey(cell)}`;
    const formulaSelectionKey = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => formulaCellDomKey(cell);
    const formulaCellsByRowId = new Map(formulaCellRows.map((formulaRow) => [formulaRow.row.id, formulaRow.cells] as const));
    const formulaSelectionScope = `${ptoTab}:${ptoPlanYear}:`;
    const selectedFormulaCellKeys = new Set(ptoSelectedCellKeys.filter((key) => key.startsWith(formulaSelectionScope)));
    const formulaCellTemplates: Array<Omit<PtoFormulaCell, "table" | "year" | "rowId">> = [
      { kind: "coefficient", label: "coefficient" },
      { kind: "carryover", label: carryoverHeader },
      ...displayPtoMonthGroups.flatMap((group) => [
        ...(editableMonthTotal
          ? [{
              kind: "month" as const,
              month: group.month,
              days: group.days,
              label: group.label,
              editable: true,
            }]
          : []),
        ...(group.expanded
          ? group.days.map((day) => ({
              kind: "day" as const,
              day,
              label: `${day.slice(8, 10)}.${day.slice(5, 7)}`,
            }))
          : []),
      ]),
    ];
    const formulaTemplateKey = (cell: Pick<PtoFormulaCell, "kind" | "day" | "month">) => `${cell.kind}:${cell.month ?? cell.day ?? ""}`;
    const formulaTemplateIndexByKey = new Map(formulaCellTemplates.map((cell, index) => [formulaTemplateKey(cell), index] as const));
    const formulaRowIndexById = new Map(filteredRows.map((row, index) => [row.id, index] as const));
    const formulaCellFromTemplate = (
      rowId: string,
      template: Omit<PtoFormulaCell, "table" | "year" | "rowId">,
    ): Omit<PtoFormulaCell, "table" | "year"> => ({ rowId, ...template });
    const formulaCellFromSelectionKey = (key: string): Omit<PtoFormulaCell, "table" | "year"> | null => {
      if (!key.startsWith(formulaSelectionScope)) return null;

      const [rowId, kind, value = ""] = key.slice(formulaSelectionScope.length).split(":");
      if (!rowId || !formulaRowIndexById.has(rowId)) return null;

      const template = formulaCellTemplates.find((cell) => (
        cell.kind === kind
          && (kind === "month" ? cell.month === value : kind === "day" ? cell.day === value : value === "")
      ));

      return template ? formulaCellFromTemplate(rowId, template) : null;
    };
    const getFormulaCellValue = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => {
      const row = rowById.get(cell.rowId);
      if (!row) return undefined;

      if (cell.kind === "coefficient") return row.coefficient;
      if (cell.kind === "carryover") return getEffectiveCarryover(row);
      if (cell.kind === "month" && cell.month) return getRowDateTotals(row).monthTotals.get(cell.month)?.value;
      if (cell.kind === "day" && cell.day) return row.dailyPlans[cell.day];
      return undefined;
    };

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

    const formulaRangeKeys = (anchor: PtoFormulaCell, target: PtoFormulaCell) => {
      const anchorRowIndex = formulaRowIndexById.get(anchor.rowId);
      const targetRowIndex = formulaRowIndexById.get(target.rowId);
      const anchorColumnIndex = formulaTemplateIndexByKey.get(formulaTemplateKey(anchor));
      const targetColumnIndex = formulaTemplateIndexByKey.get(formulaTemplateKey(target));

      if (
        anchorRowIndex === undefined
        || targetRowIndex === undefined
        || anchorColumnIndex === undefined
        || targetColumnIndex === undefined
      ) {
        return [formulaSelectionKey(target)];
      }

      const rowStart = Math.min(anchorRowIndex, targetRowIndex);
      const rowEnd = Math.max(anchorRowIndex, targetRowIndex);
      const columnStart = Math.min(anchorColumnIndex, targetColumnIndex);
      const columnEnd = Math.max(anchorColumnIndex, targetColumnIndex);
      const keys: string[] = [];

      for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
        const row = filteredRows[rowIndex];
        if (!row) continue;

        for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex += 1) {
          const template = formulaCellTemplates[columnIndex];
          if (template) keys.push(formulaSelectionKey(formulaCellFromTemplate(row.id, template)));
        }
      }

      return keys.length ? keys : [formulaSelectionKey(target)];
    };

    const selectFormulaCell = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      if (!ptoDateEditing) return;

      const nextCell = { ...cell, table: ptoTab, year: ptoPlanYear };
      setPtoFormulaCell(nextCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(nextCell);
      setPtoSelectedCellKeys([formulaSelectionKey(nextCell)]);
    };

    const selectFormulaRange = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      if (!ptoDateEditing) return;

      const targetCell = { ...cell, table: ptoTab, year: ptoPlanYear };
      const anchorCell = ptoSelectionAnchorCell?.table === ptoTab && ptoSelectionAnchorCell.year === ptoPlanYear
        ? ptoSelectionAnchorCell
        : targetCell;

      setPtoFormulaCell(targetCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(anchorCell);
      setPtoSelectedCellKeys(formulaRangeKeys(anchorCell, targetCell));
    };

    const toggleFormulaCell = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      if (!ptoDateEditing) return;

      const targetCell = { ...cell, table: ptoTab, year: ptoPlanYear };
      const targetKey = formulaSelectionKey(targetCell);
      const selectionScope = `${ptoTab}:${ptoPlanYear}:`;

      setPtoFormulaCell(targetCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(targetCell);
      setPtoSelectedCellKeys((currentKeys) => {
        const scopedKeys = currentKeys.filter((key) => key.startsWith(selectionScope));
        return toggleEditableGridSelectionKey(scopedKeys, targetKey);
      });
    };

    const startInlineFormulaEdit = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, draftOverride?: string) => {
      if (!ptoDateEditing) return;

      const nextCell = { ...cell, table: ptoTab, year: ptoPlanYear };
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

    const formulaCellMatches = (cell: PtoFormulaCell | null, rowId: string, kind: PtoFormulaCell["kind"], key?: string) => {
      if (!cell) return false;

      return cell.rowId === rowId
        && cell.kind === kind
        && cell.table === ptoTab
        && cell.year === ptoPlanYear
        && (kind === "month" ? cell.month === key : kind === "day" ? cell.day === key : true);
    };

    const formulaCellActive = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => formulaCellMatches(activeFormulaCell, rowId, kind, key);
    const formulaCellEditing = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => formulaCellMatches(activeInlineEditCell, rowId, kind, key);
    const formulaCellSelected = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => selectedFormulaCellKeys.has(formulaSelectionKey({
      rowId,
      kind,
      ...(kind === "month" ? { month: key } : kind === "day" ? { day: key } : {}),
    }));

    const commitFormulaCellValue = (cell: PtoFormulaCell, value: string) => {
      if (!ptoDateEditing) return false;
      if (cell.editable === false) return false;
      if (value.trim() !== "" && parseDecimalInput(value) === null) return false;

      if (cell.kind === "coefficient") {
        updatePtoDateRow(setRows, cell.rowId, "coefficient", value);
        return true;
      }

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

    const selectedFormulaCells = () => Array.from(selectedFormulaCellKeys)
      .map((key) => formulaCellFromSelectionKey(key))
      .filter((formulaCell): formulaCell is Omit<PtoFormulaCell, "table" | "year"> => formulaCell !== null);

    const clearSelectedFormulaCells = (fallbackCell: Omit<PtoFormulaCell, "table" | "year">) => {
      const cellsToClear = selectedFormulaCells();
      const targetCells = cellsToClear.length ? cellsToClear : [fallbackCell];
      let committed = false;

      targetCells.forEach((targetCell) => {
        committed = commitFormulaCellValue({ ...targetCell, table: ptoTab, year: ptoPlanYear }, "") || committed;
      });

      if (!committed) return false;

      const nextActiveCell = activeFormulaCell && targetCells.some((targetCell) => formulaCellKey(targetCell) === formulaCellKey(activeFormulaCell))
        ? activeFormulaCell
        : { ...targetCells[0], table: ptoTab, year: ptoPlanYear };

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
      const nextActiveCell = activeFormulaCell ?? { ...fallbackCell, table: ptoTab, year: ptoPlanYear };

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

      const offset = editableGridArrowOffset(key);
      const currentRowIndex = formulaRowIndexById.get(activeFormulaCell.rowId);
      const currentColumnIndex = formulaTemplateIndexByKey.get(formulaTemplateKey(activeFormulaCell));
      if (currentRowIndex === undefined || currentColumnIndex === undefined || formulaCellTemplates.length === 0) return;

      const nextRowIndex = Math.min(filteredRows.length - 1, Math.max(0, currentRowIndex + offset.rowOffset));
      const nextColumnIndex = Math.min(formulaCellTemplates.length - 1, Math.max(0, currentColumnIndex + offset.columnOffset));
      const nextRow = filteredRows[nextRowIndex];
      const nextTemplate = formulaCellTemplates[nextColumnIndex];
      const nextCell = nextRow && nextTemplate ? formulaCellFromTemplate(nextRow.id, nextTemplate) : null;

      if (!nextCell) return;
      selectFormulaCell(nextCell, getFormulaCellValue(nextCell));
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
        unit: row.unit,
      }, row);
      setPtoPendingFieldFocus({ rowId: nextRowId, field: "structure" });
    };

    const commitPtoDraftField = (field: "area" | "location" | "structure" | "unit" | "coefficient", value: string) => {
      if (!ptoDateEditing) return;
      if (!value.trim()) return;
      if (field === "coefficient" && parseDecimalInput(value) === null) return;

      const nextRowId = addLinkedPtoDateRow({
        [field]: field === "unit" ? normalizePtoUnit(value) : field === "coefficient" ? parseDecimalValue(value) : value,
      });
      setPtoPendingFieldFocus({ rowId: nextRowId, field });
      requestPtoDatabaseSave();
    };

    const addPtoRowFromDraft = () => {
      if (!ptoDateEditing) return;

      const nextRowId = addLinkedPtoDateRow();
      setPtoPendingFieldFocus({ rowId: nextRowId, field: ptoAreaFilter === "Все участки" ? "area" : "structure" });
    };

    const renderPtoHeaderText = (key: string, fallback: string, align: React.CSSProperties["textAlign"] = "left") => {
      const isEditing = editingPtoHeaderKey === key;

      if (isEditing) {
        return (
          <input
            autoFocus
            value={ptoHeaderDraft}
            onChange={(event) => setPtoHeaderDraft(event.target.value)}
            onBlur={(event) => {
              if (event.currentTarget.dataset.cancelHeaderEdit === "true") return;
              commitPtoHeaderEdit(key, fallback);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitPtoHeaderEdit(key, fallback);
              }

              if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.dataset.cancelHeaderEdit = "true";
                cancelPtoHeaderEdit();
              }
            }}
            onClick={(event) => event.stopPropagation()}
            style={{ ...ptoHeaderInputStyle, textAlign: align }}
          />
        );
      }

      return (
        <button
          type="button"
          onDoubleClick={(event) => {
            if (!ptoDateEditing) return;
            event.stopPropagation();
            startPtoHeaderEdit(key, fallback);
          }}
          style={{ ...ptoHeaderLabelButtonStyle, textAlign: align }}
          title={ptoDateEditing ? "Двойной клик — переименовать заголовок" : undefined}
        >
          {ptoHeaderLabel(key, fallback)}
        </button>
      );
    };

    const renderPtoMonthHeader = (month: string, fallback: string, expanded: boolean) => {
      const key = `month-group:${month}`;
      const isEditing = editingPtoHeaderKey === key;

      if (isEditing) {
        return renderPtoHeaderText(key, fallback);
      }

      return (
        <button
          type="button"
          onClick={() => {
            setExpandedPtoMonths((current) => ({ ...current, [month]: !current[month] }));
            requestPtoDatabaseSave();
          }}
          onDoubleClick={(event) => {
            if (!ptoDateEditing) return;
            event.stopPropagation();
            startPtoHeaderEdit(key, fallback);
          }}
          style={monthToggleStyle}
          title="Клик — свернуть/развернуть, двойной клик — переименовать"
        >
          {expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
          {ptoHeaderLabel(key, fallback)}
        </button>
      );
    };

    return (
      <div style={ptoDateTableLayoutStyle}>
        <div style={ptoToolbarStyle}>
          <div style={ptoToolbarBlockStyle}>
            <span style={ptoToolbarLabelStyle}>Участки</span>
            <div style={ptoToolbarRowStyle}>
              {ptoAreaTabs.map((area) => (
                <PtoToolbarButton key={area} active={ptoAreaFilter === area} onClick={() => selectPtoArea(area)} label={area} />
              ))}
            </div>
          </div>

          {(["plan", "oper", "survey"] as string[]).includes(ptoTab) ? (
            <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
              <span style={ptoToolbarLabelStyle}>Excel</span>
              <div style={ptoToolbarRowStyle}>
                <PtoToolbarIconButton label={`Скачать ${currentPtoDateExcelMeta().label} в Excel`} onClick={exportPtoDateTableToExcel}>
                  <Download size={14} aria-hidden />
                </PtoToolbarIconButton>
                <PtoToolbarIconButton label={`Загрузить ${currentPtoDateExcelMeta().label} из Excel`} onClick={openPtoDateImportFilePicker}>
                  <Upload size={14} aria-hidden />
                </PtoToolbarIconButton>
                <PtoToolbarIconButton label={ptoDateEditing ? "Завершить редактирование таблицы" : "Редактировать таблицу"} onClick={togglePtoDateEditing}>
                  {ptoDateEditing ? <Check size={14} aria-hidden /> : <Pencil size={14} aria-hidden />}
                </PtoToolbarIconButton>
              </div>
              <input
                ref={ptoPlanImportInputRef}
                accept=".xlsx,.csv"
                onChange={importPtoDateTableFromExcel}
                style={{ display: "none" }}
                type="file"
              />
            </div>
          ) : null}

          <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
            <span style={ptoToolbarLabelStyle}>Годы</span>
            <div style={ptoToolbarRowStyle}>
              <PtoToolbarIconButton label="Удалить выбранный год" onClick={deletePtoYear}>
                <span aria-hidden>−</span>
              </PtoToolbarIconButton>
              {ptoYearTabs.map((year) => (
                <PtoToolbarButton key={year} active={ptoPlanYear === year} onClick={() => {
                  selectPtoPlanYear(year);
                }} label={year} />
              ))}
              <PtoToolbarIconButton label="Добавить год" onClick={() => {
                setPtoYearInput("");
                setPtoYearDialogOpen(true);
              }}>
                <span aria-hidden>+</span>
              </PtoToolbarIconButton>
            </div>
            {ptoYearDialogOpen ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addPtoYear();
                }}
                style={ptoYearDialogStyle}
              >
                <label style={{ display: "grid", gap: 3 }}>
                  <span style={ptoToolbarLabelStyle}>Новый год</span>
                  <input
                    autoFocus
                    type="number"
                    min="1900"
                    max="2100"
                    value={ptoYearInput}
                    onChange={(event) => setPtoYearInput(event.target.value)}
                    style={{ ...inputStyle, width: 96, padding: "5px 8px", borderRadius: 8, fontSize: 12 }}
                  />
                </label>
                <PtoToolbarButton active onClick={addPtoYear} label="ОК" />
                <PtoToolbarButton active={false} onClick={() => {
                  setPtoYearDialogOpen(false);
                  setPtoYearInput("");
                }} label="Отмена" />
              </form>
            ) : null}
          </div>
        </div>

        {ptoDateEditing ? (
          <div style={ptoFormulaBarStyle}>
            <input
              type="text"
              inputMode="decimal"
              value={activeFormulaCell ? ptoFormulaDraft : ""}
              onChange={(event) => updateFormulaValue(event.target.value)}
              onBlur={() => {
                if (activeFormulaCell) setPtoFormulaDraft(formatPtoFormulaNumber(activeFormulaValue));
                requestPtoDatabaseSave();
              }}
              disabled={formulaInputDisabled}
              placeholder="Выбери числовую ячейку"
              style={ptoFormulaInputStyle}
            />
          </div>
        ) : null}

        <div ref={ptoDateTableScrollRef} onScroll={ptoDateEditing ? handlePtoDateTableScroll : undefined} style={ptoDateTableScrollStyle}>
          <table style={{ ...ptoPlanTableStyle, width: tableMinWidth, minWidth: tableMinWidth, marginRight: 40 }}>
            <colgroup>
              {tableColumns.map((column) => (
                <col key={column.key} style={{ width: column.width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <PtoPlanTh rowSpan={2} columnKey="area" width={columnWidthByKey.get("area")} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText("area", "Участок")}</PtoPlanTh>
                {showLocation ? <PtoPlanTh rowSpan={2} columnKey="location" width={columnWidthByKey.get("location")} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText("location", "Местонахождение")}</PtoPlanTh> : null}
                <PtoPlanTh rowSpan={2} columnKey="structure" width={columnWidthByKey.get("structure")} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText("structure", "Структура")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey="unit" width={columnWidthByKey.get("unit")} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText("unit", "Ед.", "center")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey="coefficient" width={columnWidthByKey.get("coefficient")} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText("coefficient", "Коэфф.", "center")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey="status" width={columnWidthByKey.get("status")} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText("status", "Статус", "center")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey={`carryover:${ptoPlanYear}`} width={columnWidthByKey.get(`carryover:${ptoPlanYear}`)} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText(`carryover:${ptoPlanYear}`, carryoverHeader, "center")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey="year-total" width={columnWidthByKey.get("year-total")} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText("year-total", "Итого год", "center")}</PtoPlanTh>
                {displayPtoMonthGroups.map((group) => (
                  <PtoPlanTh key={group.month} colSpan={1 + (group.expanded ? group.days.length : 0)}>
                    {renderPtoMonthHeader(group.month, group.label, group.expanded)}
                  </PtoPlanTh>
                ))}
              </tr>
              <tr>
                {displayPtoMonthGroups.map((group) => (
                  <Fragment key={`${group.month}-days`}>
                    <PtoPlanTh align="center" columnKey={`month-total:${group.month}`} width={columnWidthByKey.get(`month-total:${group.month}`)} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText(`month-total:${group.month}`, "Итого", "center")}</PtoPlanTh>
                    {group.expanded && group.days.map((day) => (
                      <PtoPlanTh key={day} align="center" columnKey={`day:${day}`} width={columnWidthByKey.get(`day:${day}`)} onResizeStart={ptoColumnResizeHandler}>{renderPtoHeaderText(`day:${day}`, day.slice(8, 10), "center")}</PtoPlanTh>
                    ))}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {topSpacerHeight > 0 ? (
                <tr aria-hidden>
                  <td colSpan={tableSpacerColSpan} style={{ height: topSpacerHeight, padding: 0, border: "none", background: "transparent" }} />
                </tr>
              ) : null}
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
                const coefficientCellActive = ptoDateEditing && formulaCellActive(row.id, "coefficient");
                const carryoverCellActive = ptoDateEditing && formulaCellActive(row.id, "carryover");
                const coefficientCellSelected = ptoDateEditing && formulaCellSelected(row.id, "coefficient");
                const carryoverCellSelected = ptoDateEditing && formulaCellSelected(row.id, "carryover");
                const coefficientCellEditing = ptoDateEditing && formulaCellEditing(row.id, "coefficient");
                const carryoverCellEditing = ptoDateEditing && formulaCellEditing(row.id, "carryover");
                const rowStatus = ptoAutomatedStatus(row, reportDate);
                const effectiveCarryover = getEffectiveCarryover(row);
                const rowDateTotals = getRowDateTotals(row);
                const rowYearTotalWithCarryover = Math.round(((rowDateTotals?.yearDailyTotal ?? 0) + effectiveCarryover) * 1000000) / 1000000;
                const rowFormulaCells = formulaCellsByRowId.get(row.id) ?? [];
                const coefficientCell = rowFormulaCells.find((cell) => cell.kind === "coefficient") ?? { rowId: row.id, kind: "coefficient" as const, label: "Коэфф." };
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
                        {ptoDateEditing ? (
                          <input data-pto-row-field={ptoRowFieldDomKey(row.id, "area")} list="pto-area-options" value={row.area} onChange={(e) => updatePtoDateRow(setRows, row.id, "area", e.target.value)} onBlur={requestPtoDatabaseSave} placeholder="Уч_Аксу" style={ptoPlanInputStyle} />
                        ) : renderReadonlyTextCell(row.area)}
                      </div>
                    </PtoPlanTd>
                    {showLocation ? (
                      <PtoPlanTd>
                        {ptoDateEditing ? (
                          <>
                            <input data-pto-row-field={ptoRowFieldDomKey(row.id, "location")} list={locationListId} value={row.location} onChange={(e) => updatePtoDateRow(setRows, row.id, "location", e.target.value)} onBlur={requestPtoDatabaseSave} placeholder="Карьер" style={ptoPlanInputStyle} />
                            <datalist id={locationListId}>
                              {locationOptions.map((location) => (
                                <option key={location} value={location} />
                              ))}
                            </datalist>
                          </>
                        ) : renderReadonlyTextCell(row.location)}
                      </PtoPlanTd>
                    ) : null}
                    <PtoPlanTd>
                      {ptoDateEditing ? (
                        <>
                          <input data-pto-row-field={ptoRowFieldDomKey(row.id, "structure")} list={structureListId} value={row.structure} onChange={(e) => updatePtoDateRow(setRows, row.id, "structure", e.target.value)} onBlur={requestPtoDatabaseSave} placeholder="Вид работ" style={ptoPlanInputStyle} />
                          <datalist id={structureListId}>
                            {structureOptions.map((structure) => (
                              <option key={structure} value={structure} />
                            ))}
                          </datalist>
                        </>
                      ) : renderReadonlyTextCell(row.structure)}
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      {ptoDateEditing ? (
                        <select data-pto-row-field={ptoRowFieldDomKey(row.id, "unit")} value={normalizePtoUnit(row.unit)} onChange={(e) => {
                          updatePtoDateRow(setRows, row.id, "unit", e.target.value);
                          requestPtoDatabaseSave();
                        }} style={{ ...ptoPlanInputStyle, textAlign: "center" }}>
                          {ptoUnitOptions.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      ) : renderReadonlyTextCell(normalizePtoUnit(row.unit), "center")}
                    </PtoPlanTd>
                    <PtoPlanTd active={coefficientCellActive} selected={coefficientCellSelected} editing={coefficientCellEditing} align="center">
                      {ptoDateEditing ? (
                        <input
                          readOnly={!coefficientCellEditing}
                          data-pto-row-field={ptoRowFieldDomKey(row.id, "coefficient")}
                          data-pto-cell-key={formulaCellDomKey(coefficientCell)}
                          type="text"
                          inputMode="decimal"
                          value={coefficientCellEditing ? ptoFormulaDraft : formatPtoCellNumber(row.coefficient)}
                          onFocus={() => {
                            if (!ptoSelectionDraggingRef.current) selectFormulaCell(coefficientCell, row.coefficient);
                          }}
                          onMouseDown={(event) => handleFormulaCellMouseDown(event, coefficientCell, row.coefficient, coefficientCellEditing)}
                          onMouseEnter={(event) => handleFormulaCellMouseEnter(event, coefficientCell, row.coefficient, coefficientCellEditing)}
                          onClick={(event) => {
                            if (event.shiftKey && !coefficientCellEditing) selectFormulaRange(coefficientCell, row.coefficient);
                          }}
                          onDoubleClick={(event) => {
                            startInlineFormulaEdit(coefficientCell, row.coefficient);
                            event.currentTarget.select();
                          }}
                          onChange={(event) => updateFormulaValue(event.target.value)}
                          onBlur={() => {
                            if (coefficientCellEditing) commitInlineFormulaEdit();
                          }}
                          onKeyDown={(event) => handleFormulaCellKeyDown(event, coefficientCell, row.coefficient, coefficientCellEditing)}
                          title={formatPtoFormulaNumber(row.coefficient)}
                          style={{ ...ptoPlanInputStyle, ...ptoCompactNumberInputStyle }}
                        />
                      ) : renderReadonlyNumberCell(row.coefficient)}
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <span
                        title="Статус рассчитывается по рабочей дате и заполненным значениям месяца"
                        style={{ ...ptoStatusBadgeStyle, ...ptoStatusControlStyle(rowStatus) }}
                      >
                        {rowStatus}
                      </span>
                    </PtoPlanTd>
                    <PtoPlanTd active={carryoverCellActive} selected={carryoverCellSelected} editing={carryoverCellEditing} align="center">
                      {ptoDateEditing ? (
                        <input
                          readOnly={!carryoverCellEditing}
                          data-pto-cell-key={formulaCellDomKey(carryoverCell)}
                          type="text"
                          inputMode="decimal"
                          value={carryoverCellEditing ? ptoFormulaDraft : formatPtoCellNumber(effectiveCarryover)}
                          onFocus={() => {
                            if (!ptoSelectionDraggingRef.current) selectFormulaCell(carryoverCell, effectiveCarryover);
                          }}
                          onMouseDown={(event) => handleFormulaCellMouseDown(event, carryoverCell, effectiveCarryover, carryoverCellEditing)}
                          onMouseEnter={(event) => handleFormulaCellMouseEnter(event, carryoverCell, effectiveCarryover, carryoverCellEditing)}
                          onClick={(event) => {
                            if (event.shiftKey && !carryoverCellEditing) selectFormulaRange(carryoverCell, effectiveCarryover);
                          }}
                          onDoubleClick={(event) => {
                            startInlineFormulaEdit(carryoverCell, effectiveCarryover);
                            event.currentTarget.select();
                          }}
                          onChange={(event) => updateFormulaValue(event.target.value)}
                          onBlur={() => {
                            if (carryoverCellEditing) commitInlineFormulaEdit();
                          }}
                          onKeyDown={(event) => handleFormulaCellKeyDown(event, carryoverCell, effectiveCarryover, carryoverCellEditing)}
                          title={formatPtoFormulaNumber(effectiveCarryover)}
                          style={{ ...ptoPlanInputStyle, ...ptoCompactNumberInputStyle }}
                        />
                      ) : renderReadonlyNumberCell(effectiveCarryover)}
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
                              <input
                                readOnly={!monthCellEditing}
                                data-pto-cell-key={formulaCellDomKey(monthCell)}
                                type="text"
                                inputMode="decimal"
                                value={monthCellEditing ? ptoFormulaDraft : formatPtoCellNumber(monthValue)}
                                onFocus={() => {
                                  if (!ptoSelectionDraggingRef.current) selectFormulaCell(monthCell, monthValue);
                                }}
                                onMouseDown={(event) => handleFormulaCellMouseDown(event, monthCell, monthValue, monthCellEditing)}
                                onMouseEnter={(event) => handleFormulaCellMouseEnter(event, monthCell, monthValue, monthCellEditing)}
                                onClick={(event) => {
                                  if (event.shiftKey && !monthCellEditing) selectFormulaRange(monthCell, monthValue);
                                }}
                                onDoubleClick={(event) => {
                                  startInlineFormulaEdit(monthCell, monthValue);
                                  event.currentTarget.select();
                                }}
                                onChange={(event) => updateFormulaValue(event.target.value)}
                                onBlur={() => {
                                  if (monthCellEditing) commitInlineFormulaEdit();
                                }}
                                onKeyDown={(event) => handleFormulaCellKeyDown(event, monthCell, monthValue, monthCellEditing)}
                                placeholder="Месяц"
                                title={formatPtoFormulaNumber(monthValue)}
                                style={{ ...ptoPlanDayInputStyle, ...ptoCompactNumberInputStyle, fontWeight: 800 }}
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
                            ) : renderReadonlyNumberCell(monthValue, { bold: true })}
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
                                  <input
                                    readOnly={!dayCellEditing}
                                    data-pto-cell-key={formulaCellDomKey(dayCell)}
                                    type="text"
                                    inputMode="decimal"
                                    value={dayCellEditing ? ptoFormulaDraft : formatPtoCellNumber(dayValue)}
                                    onFocus={() => {
                                      if (!ptoSelectionDraggingRef.current) selectFormulaCell(dayCell, dayValue);
                                    }}
                                    onMouseDown={(event) => handleFormulaCellMouseDown(event, dayCell, dayValue, dayCellEditing)}
                                    onMouseEnter={(event) => handleFormulaCellMouseEnter(event, dayCell, dayValue, dayCellEditing)}
                                    onClick={(event) => {
                                      if (event.shiftKey && !dayCellEditing) selectFormulaRange(dayCell, dayValue);
                                    }}
                                    onDoubleClick={(event) => {
                                      startInlineFormulaEdit(dayCell, dayValue);
                                      event.currentTarget.select();
                                    }}
                                    onChange={(event) => updateFormulaValue(event.target.value)}
                                    onBlur={() => {
                                      if (dayCellEditing) commitInlineFormulaEdit();
                                    }}
                                    onKeyDown={(event) => handleFormulaCellKeyDown(event, dayCell, dayValue, dayCellEditing)}
                                    title={formatPtoFormulaNumber(dayValue)}
                                    style={{ ...ptoPlanDayInputStyle, ...ptoCompactNumberInputStyle }}
                                  />
                                ) : renderReadonlyNumberCell(dayValue)}
                              </PtoPlanTd>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tr>
                );
              })}
              {bottomSpacerHeight > 0 ? (
                <tr aria-hidden>
                  <td colSpan={tableSpacerColSpan} style={{ height: bottomSpacerHeight, padding: 0, border: "none", background: "transparent" }} />
                </tr>
              ) : null}
              {ptoDateEditing ? <tr style={ptoDraftRowStyle}>
                <PtoPlanTd>
                  <div style={ptoAreaCellStyle}>
                    <button
                      type="button"
                      onClick={addPtoRowFromDraft}
                      style={ptoDraftAddButtonStyle}
                      title="Добавить строку"
                      aria-label="Добавить строку"
                    >
                      +
                    </button>
                    <input value="" onChange={(event) => commitPtoDraftField("area", event.target.value)} placeholder="Новая строка" style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }} />
                  </div>
                </PtoPlanTd>
                {showLocation ? (
                  <PtoPlanTd>
                    <input value="" onChange={(event) => commitPtoDraftField("location", event.target.value)} placeholder="Местонахождение" style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }} />
                  </PtoPlanTd>
                ) : null}
                <PtoPlanTd>
                  <input value="" onChange={(event) => commitPtoDraftField("structure", event.target.value)} placeholder="Структура" style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }} />
                </PtoPlanTd>
                <PtoPlanTd align="center">
                  <select value="" onChange={(event) => commitPtoDraftField("unit", event.target.value)} style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle, textAlign: "center" }}>
                    <option value="">Ед.</option>
                    {ptoUnitOptions.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </PtoPlanTd>
                <PtoPlanTd align="center">
                  <input value="" inputMode="decimal" onChange={(event) => commitPtoDraftField("coefficient", event.target.value)} placeholder="0" style={{ ...ptoPlanInputStyle, ...ptoCompactNumberInputStyle, ...ptoDraftInputStyle }} />
                </PtoPlanTd>
                <PtoPlanTd align="center">
                  <span style={ptoDraftStatusStyle}>Новая</span>
                </PtoPlanTd>
                <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
                <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
                {displayPtoMonthGroups.map((group) => (
                  <Fragment key={`draft-${group.month}`}>
                    <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
                    {group.expanded && group.days.map((day) => (
                      <PtoPlanTd key={`draft-${day}`} align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
                    ))}
                  </Fragment>
                ))}
              </tr> : null}
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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px", fontFamily: "var(--app-font)", color: "#0f172a", lineHeight: 1.35 }}>
      <style>{reportPrintCss}</style>
      <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ background: "#ffffff", borderRadius: 18, padding: 20, boxShadow: "0 4px 16px rgba(15,23,42,0.06)", marginBottom: 20 }}>
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
          <ReportsSection
            reportAreaTabs={reportAreaTabs}
            reportArea={reportArea}
            onSelectReportArea={setReportArea}
            onPrintReport={printReport}
            activeReportCustomerLabel={activeReportCustomer.label}
            reportDate={reportDate}
            reportCompletionCards={reportCompletionCards}
            reportTableMinWidth={reportTableMinWidth}
            reportTableColumnWidths={reportTableColumnWidths}
            reportColumnKeys={reportColumnKeys}
            reportColumnWidthByKey={reportColumnWidthByKey}
            renderReportHeaderText={renderReportHeaderText}
            onStartReportColumnResize={startReportColumnResize}
            filteredReportAreaGroups={filteredReportAreaGroups}
            filteredReportsCount={filteredReports.length}
            reportReasons={reportReasons}
            onCommitReportDayReason={commitReportDayReason}
            onUpdateReportDayReasonDraft={updateReportDayReasonDraft}
            onCommitReportYearReason={commitReportYearReason}
          />
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
            {adminSection === "menu" && (
              <div style={{ ...blockStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>Вкладки</div>
                  <IconButton label="Вернуть стандартное меню" onClick={restoreDefaultNavigation}>
                    <RotateCcw size={16} aria-hidden />
                  </IconButton>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                        <CompactTh>Вкладка</CompactTh>
                        <CompactTh>Тип</CompactTh>
                        <CompactTh>Показ</CompactTh>
                        <CompactTh>Подвкладки</CompactTh>
                        <CompactTh>Действия</CompactTh>
                      </tr>
                    </thead>
                    <tbody>
                      {topTabs.map((tab) => {
                        const group = getSubTabGroup(tab.id);
                        const isExpanded = expandedAdminTab === tab.id;
                        const isEditing = editingTopTabId === tab.id;
                        const visibleSubtabs = group ? subTabs[group].filter((subtab) => subtab.visible).length : 0;
                        const totalSubtabs = group ? subTabs[group].length : 0;

                        return (
                          <Fragment key={tab.id}>
                            <tr>
                              <CompactTd>
                                <div style={vehicleNameStyle}>{tab.label}</div>
                                <VehicleMeta label="В меню" value={compactTopTabLabel(tab)} />
                              </CompactTd>
                              <CompactTd>Основная</CompactTd>
                              <CompactTd>{tab.locked ? "Защищена" : tab.visible ? "Показывается" : "Скрыта"}</CompactTd>
                              <CompactTd>{group ? `${visibleSubtabs} / ${totalSubtabs}` : "—"}</CompactTd>
                              <CompactTd>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <IconButton label={isExpanded ? "Свернуть вкладку" : "Развернуть вкладку"} onClick={() => setExpandedAdminTab(isExpanded ? null : tab.id)}>
                                    {isExpanded ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать вкладку"} onClick={() => setEditingTopTabId(isEditing ? null : tab.id)}>
                                    {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton
                                    disabled={tab.locked}
                                    label={tab.locked ? "Эту вкладку нельзя скрыть" : tab.visible ? "Скрыть вкладку" : "Вернуть вкладку"}
                                    onClick={() => (tab.visible ? hideTopTab(tab.id) : showTopTab(tab.id))}
                                  >
                                    {tab.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                  </IconButton>
                                </div>
                              </CompactTd>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} style={adminDetailCellStyle}>
                                  <div style={{ display: "grid", gap: 10 }}>
                                    {isEditing && (
                                      <Field label="Название вкладки">
                                        <input value={tab.label} onChange={(e) => updateTopTabLabel(tab.id, e.target.value)} style={inputStyle} />
                                      </Field>
                                    )}
                                    {group ? (
                                      <>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                          <div style={{ color: "#475569", fontWeight: 700 }}>Подвкладки внутри раздела</div>
                                          <IconButton label="Добавить подвкладку" onClick={() => addQuickSubTab(group)}>
                                            <Plus size={16} aria-hidden />
                                          </IconButton>
                                        </div>
                                        <div style={{ display: "grid", gap: 8 }}>
                                          {subTabs[group].map((subtab) => {
                                            const isSubtabEditing = editingSubTabId === subtab.id;

                                            return (
                                              <div key={subtab.id} style={compactRowStyle}>
                                                <div>
                                                  <div style={{ fontWeight: 700 }}>{subtab.label}</div>
                                                  <div style={{ color: "#64748b", marginTop: 3 }}>{subtab.visible ? "Показывается" : "Скрыта"}</div>
                                                </div>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                  <IconButton label={isSubtabEditing ? "Завершить редактирование" : "Редактировать подвкладку"} onClick={() => setEditingSubTabId(isSubtabEditing ? null : subtab.id)}>
                                                    {isSubtabEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                                  </IconButton>
                                                  <IconButton label={subtab.visible ? "Скрыть подвкладку" : "Вернуть подвкладку"} onClick={() => (subtab.visible ? removeSubTab(group, subtab.id) : showSubTab(group, subtab.id))}>
                                                    {subtab.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                                  </IconButton>
                                                </div>
                                                {isSubtabEditing && (
                                                  <div style={adminInlineEditStyle}>
                                                    <Field label="Название подвкладки">
                                                      <input value={subtab.label} onChange={(e) => updateSubTabLabel(group, subtab.id, e.target.value)} style={inputStyle} />
                                                    </Field>
                                                    <Field label="Текст подвкладки">
                                                      <input value={subtab.content ?? ""} onChange={(e) => updateSubTabContent(group, subtab.id, e.target.value)} placeholder="Текст для этой подвкладки" style={inputStyle} />
                                                    </Field>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </>
                                    ) : (
                                      <div style={{ color: "#64748b" }}>У этого раздела нет подвкладок.</div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                      {customTabs.map((tab) => {
                        const key = customTabKey(tab.id);
                        const isExpanded = expandedAdminTab === key;
                        const isEditing = editingTopTabId === key;

                        return (
                          <Fragment key={tab.id}>
                            <tr>
                              <CompactTd>
                                <div style={adminTabNameWithDeleteStyle}>
                                  <span style={{ ...vehicleNameStyle, marginBottom: 0 }}>{tab.title}</span>
                                  {isExpanded ? (
                                    <button
                                      type="button"
                                      aria-label={`Удалить вкладку ${tab.title}`}
                                      onClick={() => deleteCustomTab(tab.id)}
                                      style={adminInlineTrashButtonStyle}
                                      title={`Удалить вкладку ${tab.title}`}
                                    >
                                      <Trash2 size={14} aria-hidden />
                                    </button>
                                  ) : null}
                                </div>
                                <VehicleMeta label="Описание" value={tab.description} />
                              </CompactTd>
                              <CompactTd>Пользовательская</CompactTd>
                              <CompactTd>{tab.visible === false ? "Скрыта" : "Показывается"}</CompactTd>
                              <CompactTd>{tab.items.length}</CompactTd>
                              <CompactTd>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <IconButton label={isExpanded ? "Свернуть вкладку" : "Развернуть вкладку"} onClick={() => setExpandedAdminTab(isExpanded ? null : key)}>
                                    {isExpanded ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать вкладку"} onClick={() => setEditingTopTabId(isEditing ? null : key)}>
                                    {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label={tab.visible === false ? "Вернуть вкладку" : "Скрыть вкладку"} onClick={() => updateCustomTab(tab.id, { visible: tab.visible === false })}>
                                    {tab.visible === false ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
                                  </IconButton>
                                </div>
                              </CompactTd>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} style={adminDetailCellStyle}>
                                  {isEditing ? (
                                    <div style={adminInlineEditStyle}>
                                      <Field label="Название вкладки">
                                        <input value={tab.title} onChange={(e) => updateCustomTab(tab.id, { title: e.target.value })} style={inputStyle} />
                                      </Field>
                                      <Field label="Описание вкладки">
                                        <input value={tab.description} onChange={(e) => updateCustomTab(tab.id, { description: e.target.value })} placeholder="Описание" style={inputStyle} />
                                      </Field>
                                    </div>
                                  ) : (
                                    <div style={{ color: "#64748b" }}>{tab.description || "Описание не заполнено."}</div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(180px, 1fr) auto", gap: 10, alignItems: "end" }}>
                  <Field label="Название новой вкладки">
                    <input value={customTabForm.title} onChange={(e) => setCustomTabForm((current) => ({ ...current, title: e.target.value }))} placeholder="Например: Справочники" style={inputStyle} />
                  </Field>
                  <Field label="Описание новой вкладки">
                    <input value={customTabForm.description} onChange={(e) => setCustomTabForm((current) => ({ ...current, description: e.target.value }))} placeholder="Краткое описание" style={inputStyle} />
                  </Field>
                  <IconButton label="Добавить вкладку" onClick={addCustomTab}>
                    <Plus size={16} aria-hidden />
                  </IconButton>
                </div>
              </div>
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
                      <SourceNote title="ПТО" source="План, ПланС, График, Объемы кузова" text="план по датам, объем кузова, коэффициенты и плановые показатели" />
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
              </div>
            )}

            {adminSection === "subtabs" && (
            <div style={{ ...blockStyle, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Подвкладки</div>
              <div style={{ display: "grid", gap: 14 }}>
                {(Object.keys(subTabs) as EditableSubtabGroup[]).map((group) => (
                  <div key={group} style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ color: "#475569", fontWeight: 700 }}>{subtabGroupLabels[group]}</div>
                      <TopButton active={false} onClick={() => setNewSubTabForm((current) => ({ ...current, group }))} label="Добавить сюда" />
                    </div>
                    {subTabs[group].map((tab) => (
                      <div key={tab.id} style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{tab.label}</div>
                            <div style={{ color: "#64748b", marginTop: 4 }}>{tab.visible ? "Показывается" : "Скрыта"}</div>
                          </div>
                          <TopButton active={editingSubTabId === tab.id} onClick={() => setEditingSubTabId(editingSubTabId === tab.id ? null : tab.id)} label={editingSubTabId === tab.id ? "Готово" : "Редактировать"} />
                          <TopButton
                            active={tab.visible}
                            onClick={() => (tab.visible ? removeSubTab(group, tab.id) : showSubTab(group, tab.id))}
                            label={tab.visible ? "Удалить" : "Вернуть"}
                          />
                        </div>
                        {editingSubTabId === tab.id && (
                          <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 260px) 1fr", gap: 10, alignItems: "center" }}>
                            <Field label="Название подвкладки">
                              <input value={tab.label} onChange={(e) => updateSubTabLabel(group, tab.id, e.target.value)} style={inputStyle} />
                            </Field>
                            <Field label="Текст подвкладки">
                              <input value={tab.content ?? ""} onChange={(e) => updateSubTabContent(group, tab.id, e.target.value)} placeholder="Текст для этой подвкладки" style={inputStyle} />
                            </Field>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "180px minmax(180px, 1fr) minmax(180px, 1fr) auto", gap: 10, alignItems: "center" }}>
                <Field label="Раздел">
                  <select value={newSubTabForm.group} onChange={(e) => setNewSubTabForm((current) => ({ ...current, group: e.target.value as EditableSubtabGroup }))} style={inputStyle}>
                    {(Object.keys(subtabGroupLabels) as EditableSubtabGroup[]).map((group) => (
                      <option key={group} value={group}>{subtabGroupLabels[group]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Название подвкладки">
                  <input value={newSubTabForm.label} onChange={(e) => setNewSubTabForm((current) => ({ ...current, label: e.target.value }))} placeholder="Например: Сменный журнал" style={inputStyle} />
                </Field>
                <Field label="Текст подвкладки">
                  <input value={newSubTabForm.content} onChange={(e) => setNewSubTabForm((current) => ({ ...current, content: e.target.value }))} placeholder="Текст для новой подвкладки" style={inputStyle} />
                </Field>
                <TopButton active onClick={addSubTab} label="Добавить подвкладку" />
              </div>
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

            {adminSection === "logs" && (
              <div style={{ ...blockStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Логи админки</div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>История редактирования, загрузки и выгрузки таблиц.</div>
                  </div>
                  <IconButton label="Очистить логи" onClick={clearAdminLogs} disabled={adminLogs.length === 0}>
                    <Trash2 size={16} aria-hidden />
                  </IconButton>
                </div>

                <div style={adminLogSummaryGridStyle}>
                  <div style={adminLogSummaryCardStyle}>
                    <div style={adminLogSummaryLabelStyle}>Последнее редактирование</div>
                    {lastChangeLog ? (
                      <>
                        <div style={adminLogSummaryValueStyle}>{formatAdminLogDate(lastChangeLog.at)}</div>
                        <div style={adminLogSummaryMetaStyle}>{lastChangeLog.section} · {lastChangeLog.user}</div>
                        <div style={adminLogSummaryDetailsStyle}>{lastChangeLog.details}</div>
                      </>
                    ) : (
                      <div style={adminLogSummaryEmptyStyle}>Редактирований пока нет.</div>
                    )}
                  </div>

                  <div style={adminLogSummaryCardStyle}>
                    <div style={adminLogSummaryLabelStyle}>Последняя загрузка таблицы</div>
                    {lastUploadLog ? (
                      <>
                        <div style={adminLogSummaryValueStyle}>{formatAdminLogDate(lastUploadLog.at)}</div>
                        <div style={adminLogSummaryMetaStyle}>{lastUploadLog.fileName || "Файл не указан"} · {lastUploadLog.user}</div>
                        <div style={adminLogSummaryDetailsStyle}>{lastUploadLog.details}</div>
                      </>
                    ) : (
                      <div style={adminLogSummaryEmptyStyle}>Загрузок пока нет.</div>
                    )}
                  </div>
                </div>

                <div style={adminLogTableScrollStyle}>
                  <table style={adminLogTableStyle}>
                    <thead>
                      <tr>
                        <CompactTh>Дата и время</CompactTh>
                        <CompactTh>Пользователь</CompactTh>
                        <CompactTh>Раздел</CompactTh>
                        <CompactTh>Действие</CompactTh>
                        <CompactTh>Описание</CompactTh>
                        <CompactTh>Файл / строки</CompactTh>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLogs.map((log) => (
                        <tr key={log.id}>
                          <CompactTd>{formatAdminLogDate(log.at)}</CompactTd>
                          <CompactTd>{log.user}</CompactTd>
                          <CompactTd>{log.section}</CompactTd>
                          <CompactTd>{log.action}</CompactTd>
                          <CompactTd>{log.details}</CompactTd>
                          <CompactTd>{[log.fileName, log.rowsCount !== undefined ? `${log.rowsCount} строк` : ""].filter(Boolean).join(" · ") || "—"}</CompactTd>
                        </tr>
                      ))}
                      {adminLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={adminLogEmptyCellStyle}>Логов пока нет. Новые изменения и загрузки будут появляться здесь автоматически.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminSection === "reports" && (
            <div style={{ marginTop: 16, display: "grid", gap: 12, alignItems: "start" }}>
              <div style={adminReportSectionHeaderStyle}>
                <div style={{ fontWeight: 700 }}>Настройка отчетности</div>
              </div>

              <div style={adminReportCustomerTabsStyle}>
                <TopButton active={adminReportTab === "order"} onClick={() => setAdminReportTab("order")} label="Порядок" />
                {reportCustomers.map((customer) => (
                  <TopButton
                    key={customer.id}
                    active={adminReportTab === "customer" && activeAdminReportCustomer.id === customer.id}
                    onClick={() => {
                      setAdminReportCustomerId(customer.id);
                      setAdminReportTab("customer");
                    }}
                    label={customer.label}
                    showDelete={adminReportTab === "customer" && activeAdminReportCustomer.id === customer.id && reportCustomers.length > 1}
                    deleteLabel={`Удалить заказчика ${customer.label}`}
                    onDelete={() => deleteReportCustomer(customer.id)}
                  />
                ))}
                <IconButton label="Добавить заказчика" onClick={addReportCustomer}>
                  <Plus size={16} aria-hidden />
                </IconButton>
              </div>

              {adminReportTab === "order" ? (
                <div style={adminReportOrderPanelStyle}>
                  <div style={adminReportCompactPanelStyle}>
                    <div style={adminReportPanelTitleStyle}>Порядок отображения участков в отчетах</div>
                    <div style={adminReportAreaOrderListStyle}>
                      {reportAreaOrderOptions.length === 0 ? (
                        <div style={adminReportEmptyTextStyle}>Участков пока нет.</div>
                      ) : (
                        reportAreaOrderOptions.map((area, index) => (
                          <div key={area} style={adminReportAreaOrderRowStyle}>
                            <span style={adminReportAreaOrderNameStyle}>{index + 1}. {area}</span>
                            <div style={adminReportAreaOrderActionsStyle}>
                              <MiniIconButton label="Поднять участок" onClick={() => moveReportAreaOrder(area, -1)} disabled={index === 0}>
                                <ChevronDown size={13} style={{ transform: "rotate(180deg)" }} aria-hidden />
                              </MiniIconButton>
                              <MiniIconButton label="Опустить участок" onClick={() => moveReportAreaOrder(area, 1)} disabled={index === reportAreaOrderOptions.length - 1}>
                                <ChevronDown size={13} aria-hidden />
                              </MiniIconButton>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={adminReportOrderWorkPanelStyle}>
                    <div style={adminReportPanelTitleStyle}>Порядок видов работ внутри участков</div>
                    {adminReportWorkOrderGroups.length === 0 ? (
                      <div style={adminReportEmptyTextStyle}>Видов работ пока нет.</div>
                    ) : (
                      <div style={adminReportWorkGroupGridStyle}>
                        {adminReportWorkOrderGroups.map((group) => (
                          <div key={group.area} style={adminReportWorkGroupStyle}>
                            <div style={adminReportWorkGroupTitleStyle}>{group.area}</div>
                            <div style={adminReportAreaOrderListStyle}>
                              {group.rows.map((row, index) => {
                                const rowKey = reportRowKey(row);
                                return (
                                  <div key={rowKey} style={adminReportWorkOrderRowStyle}>
                                    <span style={adminReportWorkOrderNameStyle}>{index + 1}. {row.name}</span>
                                    <span style={adminReportWorkOrderUnitStyle}>{row.unit}</span>
                                    <div style={adminReportAreaOrderActionsStyle}>
                                      <MiniIconButton label="Поднять вид работ" onClick={() => moveReportWorkOrder(group.area, rowKey, -1)} disabled={index === 0}>
                                        <ChevronDown size={13} style={{ transform: "rotate(180deg)" }} aria-hidden />
                                      </MiniIconButton>
                                      <MiniIconButton label="Опустить вид работ" onClick={() => moveReportWorkOrder(group.area, rowKey, 1)} disabled={index === group.rows.length - 1}>
                                        <ChevronDown size={13} aria-hidden />
                                      </MiniIconButton>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={adminReportCustomerCardStyle}>
                <div style={adminReportCustomerSummaryStyle}>
                  <input
                    aria-label="Заказчик"
                    value={activeAdminReportCustomer.label}
                    onChange={(e) => updateReportCustomer(activeAdminReportCustomer.id, { label: e.target.value })}
                    style={adminReportCustomerNameInputStyle}
                  />
                  <div style={adminReportCustomerMetaStyle}>
                    {activeAdminReportSelectedCount} строк{activeAdminReportUsesSummaryRows ? ` · ${activeAdminReportCustomer.summaryRows.length} итоговых` : ""}
                  </div>
                  <label style={adminReportVisibleToggleStyle}>
                    <input type="checkbox" checked={activeAdminReportCustomer.visible} onChange={(e) => updateReportCustomer(activeAdminReportCustomer.id, { visible: e.target.checked })} />
                    Показывать вкладку
                  </label>
                  <label style={adminReportVisibleToggleStyle}>
                    <input type="checkbox" checked={activeAdminReportCustomer.autoShowRows} onChange={(e) => updateReportCustomer(activeAdminReportCustomer.id, { autoShowRows: e.target.checked })} />
                    Автоматический показ строк
                  </label>
                </div>

                <div style={adminReportCustomerBodyStyle}>
                  <div style={adminReportCustomerSettingsTabsStyle}>
                    <AdminReportSettingsButton active={visibleAdminReportCustomerSettingsTab === "display"} onClick={() => setAdminReportCustomerSettingsTab("display")} label="Отображение" />
                    <AdminReportSettingsButton active={visibleAdminReportCustomerSettingsTab === "rename"} onClick={() => setAdminReportCustomerSettingsTab("rename")} label="Переименование строк" />
                    <AdminReportSettingsButton
                      active={visibleAdminReportCustomerSettingsTab === "summary"}
                      disabled={!activeAdminReportUsesSummaryRows}
                      onClick={() => setAdminReportCustomerSettingsTab("summary")}
                      label="Итоговые строки"
                    />
                  </div>

                  {visibleAdminReportCustomerSettingsTab === "display" ? (
                  <div style={adminReportRowsColumnStyle}>
                    <div style={adminReportTableWrapStyle}>
                      <table style={adminReportRowsTableStyle}>
                        <colgroup>
                          <col style={{ width: 54 }} />
                          <col style={{ width: 130 }} />
                          <col style={{ width: 360 }} />
                          <col style={{ width: 56 }} />
                          <col style={{ width: 116 }} />
                          <col style={{ width: 116 }} />
                          <col style={{ width: 116 }} />
                        </colgroup>
                        <thead>
                          <tr style={{ background: "#f8fafc" }}>
                            <th style={adminReportThStyle}>Показ</th>
                            <th style={adminReportThStyle}>Участок</th>
                            <th style={adminReportThStyle}>Строка из ПТО</th>
                            <th style={adminReportThStyle}>Ед.</th>
                            <th style={adminReportThStyle}>План</th>
                            <th style={adminReportThStyle}>Оперучет</th>
                            <th style={adminReportThStyle}>Замер</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminReportBaseRows.map((row) => {
                            const rowKey = reportRowKey(row);
                            const rowStatus = reportPtoDateStatusByKey.get(rowKey);
                            const visibleRowKeys = reportCustomerEffectiveRowKeys(activeAdminReportCustomer, autoReportRowKeys);
                            return (
                              <tr key={`${activeAdminReportCustomer.id}-${rowKey}`}>
                                <td style={{ ...adminReportTdStyle, textAlign: "center" }}>
                                  <input
                                    type="checkbox"
                                    checked={visibleRowKeys.has(rowKey)}
                                    disabled={activeAdminReportCustomer.autoShowRows}
                                    onChange={() => toggleReportCustomerRow(activeAdminReportCustomer.id, rowKey)}
                                    style={activeAdminReportCustomer.autoShowRows ? adminReportDisabledCheckboxStyle : undefined}
                                    title={activeAdminReportCustomer.autoShowRows ? "Автоматический показ включен" : "Показать строку в отчете"}
                                  />
                              </td>
                              <td style={adminReportTdStyle}>{row.area}</td>
                              <td style={adminReportNameTdStyle}>{row.name}</td>
                              <td style={{ ...adminReportTdStyle, textAlign: "center" }}>{row.unit}</td>
                              <td style={{ ...adminReportTdStyle, textAlign: "center" }}>
                                <span style={{ ...adminReportPtoStatusBadgeStyle, ...ptoStatusControlStyle(rowStatus?.plan ?? "Новая") }}>{rowStatus?.plan ?? "Новая"}</span>
                              </td>
                              <td style={{ ...adminReportTdStyle, textAlign: "center" }}>
                                <span style={{ ...adminReportPtoStatusBadgeStyle, ...ptoStatusControlStyle(rowStatus?.oper ?? "Новая") }}>{rowStatus?.oper ?? "Новая"}</span>
                              </td>
                              <td style={{ ...adminReportTdStyle, textAlign: "center" }}>
                                <span style={{ ...adminReportPtoStatusBadgeStyle, ...ptoStatusControlStyle(rowStatus?.survey ?? "Новая") }}>{rowStatus?.survey ?? "Новая"}</span>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  ) : null}

                  {visibleAdminReportCustomerSettingsTab === "rename" ? (
                    <div style={adminReportRowsColumnStyle}>
                      <div style={adminReportRenamePanelStyle}>
                        <div style={adminReportSectionHeaderStyle}>
                          <IconButton label="Добавить переименование строки" onClick={() => addReportCustomerRowLabel(activeAdminReportCustomer.id)}>
                            <Plus size={16} aria-hidden />
                          </IconButton>
                        </div>

                        {activeAdminReportRowLabelEntries.length === 0 ? (
                          <div style={adminReportEmptyTextStyle}>Переименований пока нет.</div>
                        ) : (
                          <div style={adminReportRenameListStyle}>
                            <div style={adminReportRenameHeaderStyle}>
                              <span>Участок</span>
                              <span>Вид работ</span>
                              <span>Название для заказчика</span>
                              <span />
                              <span />
                            </div>
                            {activeAdminReportRowLabelEntries.map(({ rowKey, label, row }) => {
                              const hasStoredArea = reportAreaOrderOptions.some((area) => normalizeLookupValue(area) === normalizeLookupValue(row.area));
                              const visibleArea = hasStoredArea ? row.area : reportAreaOrderOptions[0] ?? row.area;
                              const areaRows = reportRowsForSummaryArea(visibleArea);
                              const hasStoredRow = areaRows.some((areaRow) => reportRowKey(areaRow) === rowKey);
                              const rowLabelEditing = editingReportRowLabelKeys.includes(rowKey);

                              return (
                                <div key={`${activeAdminReportCustomer.id}-rename-${rowKey}`} style={adminReportRenameRowStyle}>
                                  {rowLabelEditing ? (
                                    <>
                                      <select
                                        value={visibleArea}
                                        onChange={(e) => {
                                          const nextRow = reportRowsForSummaryArea(e.target.value)[0];
                                          if (nextRow) changeReportCustomerRowLabelSource(activeAdminReportCustomer.id, rowKey, reportRowKey(nextRow));
                                        }}
                                        style={adminReportRenameInputStyle}
                                        aria-label="Участок строки для заказчика"
                                      >
                                        {reportAreaOrderOptions.map((area) => (
                                          <option key={area} value={area}>{area}</option>
                                        ))}
                                        {!hasStoredArea && row.area ? <option value={row.area}>{row.area}</option> : null}
                                      </select>
                                      <select
                                        value={hasStoredRow ? rowKey : ""}
                                        onChange={(e) => changeReportCustomerRowLabelSource(activeAdminReportCustomer.id, rowKey, e.target.value)}
                                        style={adminReportRenameInputStyle}
                                        aria-label="Вид работ для заказчика"
                                      >
                                        {!hasStoredRow ? <option value="">{row.name}</option> : null}
                                        {areaRows.map((areaRow) => {
                                          const areaRowKey = reportRowKey(areaRow);
                                          return <option key={areaRowKey} value={areaRowKey}>{areaRow.name}</option>;
                                        })}
                                      </select>
                                      <input
                                        value={label}
                                        onChange={(e) => updateReportCustomerRowLabel(activeAdminReportCustomer.id, rowKey, e.target.value, row.name)}
                                        placeholder={row.name}
                                        style={adminReportRenameInputStyle}
                                        title={`Связка с ПТО: ${row.name}`}
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <span style={adminReportSummaryValueStyle}>{visibleArea || "-"}</span>
                                      <span style={adminReportSummaryValueStyle} title={row.name}>{row.name}</span>
                                      <span style={adminReportSummaryValueStyle} title={label || row.name}>{label || row.name}</span>
                                    </>
                                  )}
                                  <MiniIconButton label={rowLabelEditing ? "Сохранить переименование строки" : "Редактировать переименование строки"} onClick={() => (rowLabelEditing ? finishReportRowLabelEdit(rowKey) : startReportRowLabelEdit(rowKey))}>
                                    {rowLabelEditing ? <Check size={13} aria-hidden /> : <Pencil size={13} aria-hidden />}
                                  </MiniIconButton>
                                  <MiniIconButton label="Удалить переименование строки" onClick={() => removeReportCustomerRowLabel(activeAdminReportCustomer.id, rowKey)}>
                                    <Trash2 size={14} aria-hidden />
                                  </MiniIconButton>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {visibleAdminReportCustomerSettingsTab === "summary" && activeAdminReportUsesSummaryRows ? (
                    <div style={adminReportSummaryColumnStyle}>
                      <div style={adminReportSectionHeaderStyle}>
                        <IconButton label="Добавить итоговую строку" onClick={() => addReportSummaryRow(activeAdminReportCustomer.id)}>
                          <Plus size={16} aria-hidden />
                        </IconButton>
                      </div>

                      {activeAdminReportCustomer.summaryRows.length === 0 && (
                        <div style={adminReportEmptyTextStyle}>Итоговых строк пока нет.</div>
                      )}

                      {activeAdminReportCustomer.summaryRows.length > 0 ? (
                        <div style={adminReportSummaryListHeaderStyle}>
                          <span>Участок</span>
                          <span>Название итоговой строки</span>
                          <span>Ед.</span>
                          <span />
                          <span />
                        </div>
                      ) : null}

                      {activeAdminReportCustomer.summaryRows.map((summary) => {
                        const hasStoredArea = reportAreaOrderOptions.some((area) => normalizeLookupValue(area) === normalizeLookupValue(summary.area));
                        const visibleSummaryArea = hasStoredArea ? summary.area : reportAreaOrderOptions[0] ?? summary.area;
                        const summaryAreaRows = reportRowsForSummaryArea(visibleSummaryArea);
                        const selectedSummaryRows = summaryAreaRows.filter((row) => summary.rowKeys.includes(reportRowKey(row)));
                        const summaryExpanded = expandedReportSummaryIds.includes(summary.id);
                        const selectedSummaryLabels = selectedSummaryRows.map((row) => {
                          const rowKey = reportRowKey(row);
                          return activeAdminReportCustomer.rowLabels[rowKey]?.trim() || row.name;
                        });
                        const selectedSummaryText = selectedSummaryLabels.length > 0 ? selectedSummaryLabels.join(" + ") : "Строки не выбраны.";

                        return (
                          <div key={summary.id} style={adminReportSummaryCardStyle}>
                            <div style={adminReportSummaryFormStyle}>
                              {summaryExpanded ? (
                                <>
                                  <select value={visibleSummaryArea} onChange={(e) => updateReportSummaryRow(activeAdminReportCustomer.id, summary.id, "area", e.target.value)} style={adminReportSummaryCompactInputStyle} aria-label="Участок итоговой строки">
                                    {reportAreaOrderOptions.map((area) => (
                                      <option key={area} value={area}>{area}</option>
                                    ))}
                                    {!hasStoredArea && summary.area ? <option value={summary.area}>{summary.area}</option> : null}
                                  </select>
                                  <input value={summary.label} onChange={(e) => updateReportSummaryRow(activeAdminReportCustomer.id, summary.id, "label", e.target.value)} style={adminReportSummaryCompactInputStyle} aria-label="Название итоговой строки" />
                                  <select value={summary.unit} onChange={(e) => updateReportSummaryRow(activeAdminReportCustomer.id, summary.id, "unit", e.target.value)} style={adminReportSummaryCompactInputStyle} aria-label="Единица измерения итоговой строки">
                                    <option value="">Авто</option>
                                    <option value="м2">м2</option>
                                    <option value="м3">м3</option>
                                    <option value="тн">тн</option>
                                  </select>
                                </>
                              ) : (
                                <>
                                  <span style={adminReportSummaryValueStyle}>{visibleSummaryArea || "-"}</span>
                                  <span style={adminReportSummaryValueStyle}>{summary.label || "Без названия"}</span>
                                  <span style={{ ...adminReportSummaryValueStyle, textAlign: "right" }}>{summary.unit || "Авто"}</span>
                                </>
                              )}
                              <MiniIconButton label={summaryExpanded ? "Сохранить суммирование" : "Редактировать суммирование"} onClick={() => (summaryExpanded ? finishReportSummaryEdit(summary.id) : startReportSummaryEdit(summary.id))}>
                                {summaryExpanded ? <Check size={13} aria-hidden /> : <Pencil size={13} aria-hidden />}
                              </MiniIconButton>
                              <MiniIconButton label="Удалить итоговую строку" onClick={() => removeReportSummaryRow(activeAdminReportCustomer.id, summary.id)}>
                                <Trash2 size={16} aria-hidden />
                              </MiniIconButton>
                            </div>
                            <div style={adminReportSummaryNoteStyle} title={selectedSummaryText}>Строки в сумме: {selectedSummaryText}</div>

                            {summaryExpanded ? (
                              <div style={adminReportSummarySelectionPanelStyle}>
                                <div style={adminReportSummaryRowsHeaderStyle}>Выберите виды работ для суммирования: {selectedSummaryRows.length} из {summaryAreaRows.length}</div>
                                <div style={adminReportSummaryRowsGridStyle}>
                                {summaryAreaRows.length === 0 ? (
                                  <div style={adminReportEmptyTextStyle}>В выбранном участке строк пока нет.</div>
                                ) : (
                                  summaryAreaRows.map((row) => {
                                    const rowKey = reportRowKey(row);
                                    const customerRowLabel = activeAdminReportCustomer.rowLabels[rowKey]?.trim() || row.name;
                                    return (
                                      <label key={`${summary.id}-${rowKey}`} style={adminReportSummaryRowOptionStyle}>
                                        <input type="checkbox" checked={summary.rowKeys.includes(rowKey)} onChange={() => toggleReportSummaryRowKey(activeAdminReportCustomer.id, summary.id, rowKey)} />
                                        <span style={adminReportSummaryRowNameStyle}>{customerRowLabel}</span>
                                        <span style={adminReportSummaryRowUnitStyle}>{row.unit}</span>
                                      </label>
                                    );
                                  })
                                )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              )}
            </div>
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

function AdminReportSettingsButton({ active, onClick, label, disabled = false }: { active: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (disabled) return;
        onClick();
        event.currentTarget.blur();
      }}
      style={{
        ...adminReportCustomerSettingsTabStyle,
        ...(active ? adminReportCustomerSettingsTabActiveStyle : null),
        ...(disabled ? adminReportCustomerSettingsTabDisabledStyle : null),
      }}
    >
      {label}
    </button>
  );
}

const blockStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};

const adminReportSectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  flexWrap: "wrap",
};

const adminReportCompactPanelStyle: React.CSSProperties = {
  ...blockStyle,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  borderRadius: 8,
  padding: 12,
};

const adminReportPanelTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 8,
};

const adminReportAreaOrderListStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  justifyItems: "start",
};

const adminReportAreaOrderRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(170px, 260px) auto",
  alignItems: "center",
  gap: 8,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: "5px 6px 5px 8px",
};

const adminReportAreaOrderNameStyle: React.CSSProperties = {
  minWidth: 0,
  fontSize: 13,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const adminReportAreaOrderActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const adminReportCustomerTabsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 6,
  flexWrap: "wrap",
  maxWidth: "100%",
};

const adminReportOrderPanelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 360px) minmax(560px, 1fr)",
  gap: 12,
  alignItems: "start",
  justifyItems: "stretch",
  width: "100%",
  maxWidth: "100%",
  overflowX: "auto",
};

const adminReportOrderWorkPanelStyle: React.CSSProperties = {
  ...blockStyle,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  borderRadius: 8,
  padding: 12,
};

const adminReportWorkGroupGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 10,
  maxWidth: "100%",
};

const adminReportWorkGroupStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
};

const adminReportWorkGroupTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  marginBottom: 8,
};

const adminReportWorkOrderRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) 44px auto",
  alignItems: "center",
  gap: 8,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: "5px 6px 5px 8px",
};

const adminReportWorkOrderNameStyle: React.CSSProperties = {
  minWidth: 0,
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.25,
  overflowWrap: "normal",
  wordBreak: "normal",
};

const adminReportWorkOrderUnitStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  textAlign: "center",
};

const adminReportDisabledCheckboxStyle: React.CSSProperties = {
  cursor: "not-allowed",
  opacity: 0.45,
};

const adminReportPtoStatusBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 24,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.15,
  opacity: 1,
  padding: "3px 6px",
  whiteSpace: "normal",
};

const adminReportCustomerCardStyle: React.CSSProperties = {
  ...blockStyle,
  display: "grid",
  gap: 0,
  width: "fit-content",
  maxWidth: "100%",
  borderRadius: 8,
  padding: 0,
  overflow: "hidden",
};

const adminReportCustomerSummaryStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 300px) auto auto auto",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  background: "#ffffff",
};

const adminReportCustomerNameInputStyle: React.CSSProperties = {
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.25,
  outline: "none",
  padding: "7px 9px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const adminReportCustomerMetaStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const adminReportVisibleToggleStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const adminReportCustomerSettingsTabsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  width: "100%",
  maxWidth: "100%",
};

const adminReportCustomerSettingsTabStyle: React.CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  outline: "none",
  padding: "6px 9px",
  userSelect: "none",
};

const adminReportCustomerSettingsTabActiveStyle: React.CSSProperties = {
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const adminReportCustomerSettingsTabDisabledStyle: React.CSSProperties = {
  cursor: "not-allowed",
  opacity: 0.45,
};

const adminReportCustomerBodyStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "start",
  padding: 10,
  borderTop: "1px solid #e2e8f0",
  width: "100%",
  boxSizing: "border-box",
  overflowX: "auto",
};

const adminReportRowsColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "start",
};

const adminReportRenamePanelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  width: "100%",
  maxWidth: 720,
  boxSizing: "border-box",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
};

const adminReportRenameListStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const adminReportRenameHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "112px minmax(180px, 1fr) minmax(190px, 1fr) 22px 22px",
  gap: 6,
  alignItems: "center",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.15,
  padding: "0 2px",
};

const adminReportRenameRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "112px minmax(180px, 1fr) minmax(190px, 1fr) 22px 22px",
  gap: 6,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 6,
};

const adminReportRenameInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.2,
  outline: "none",
  padding: "5px 6px",
};

const adminReportSummaryColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  alignContent: "start",
  minWidth: 420,
  maxWidth: 720,
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
};

const adminReportTableWrapStyle: React.CSSProperties = {
  maxWidth: "100%",
  overflowX: "auto",
};

const adminReportRowsTableStyle: React.CSSProperties = {
  width: "max-content",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 13,
  background: "#ffffff",
};

const adminReportThStyle: React.CSSProperties = {
  padding: "7px 8px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  fontWeight: 800,
  textAlign: "left",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
};

const adminReportTdStyle: React.CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #e2e8f0",
  verticalAlign: "middle",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
};

const adminReportNameTdStyle: React.CSSProperties = {
  ...adminReportTdStyle,
  lineHeight: 1.25,
};

const adminReportSummaryCardStyle: React.CSSProperties = {
  background: "#f8fafc",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  display: "grid",
  gap: 6,
  width: "100%",
  boxSizing: "border-box",
  maxWidth: "100%",
  padding: 6,
};

const adminReportSummaryFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "118px minmax(170px, 1fr) fit-content(96px) 22px 22px",
  gap: 6,
  alignItems: "center",
};

const adminReportSummaryListHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "118px minmax(170px, 1fr) fit-content(96px) 22px 22px",
  gap: 6,
  alignItems: "center",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.15,
  padding: "0 7px",
};

const adminReportSummaryCompactInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.2,
  outline: "none",
  padding: "5px 6px",
};

const adminReportSummaryValueStyle: React.CSSProperties = {
  minWidth: 0,
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const adminReportSummaryRowsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 6,
  justifyContent: "start",
  maxWidth: "100%",
  maxHeight: 240,
  overflowY: "auto",
  paddingRight: 2,
};

const adminReportSummaryRowsHeaderStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 700,
};

const adminReportSummaryNoteStyle: React.CSSProperties = {
  minWidth: 0,
  color: "#64748b",
  fontSize: 11,
  fontStyle: "italic",
  lineHeight: 1.25,
  overflowWrap: "normal",
  wordBreak: "normal",
  whiteSpace: "normal",
};

const adminReportSummarySelectionPanelStyle: React.CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  display: "grid",
  gap: 6,
  paddingTop: 6,
};

const adminReportSummaryRowOptionStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) max-content",
  gap: 8,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 8,
  background: "#f8fafc",
  fontWeight: 400,
};

const adminReportSummaryRowNameStyle: React.CSSProperties = {
  minWidth: 0,
  fontWeight: 400,
  lineHeight: 1.25,
  overflowWrap: "normal",
  wordBreak: "normal",
};

const adminReportSummaryRowUnitStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 400,
  justifySelf: "end",
  textAlign: "right",
  whiteSpace: "nowrap",
};

const adminReportEmptyTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
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

const ptoPlanTableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
  background: "#ffffff",
};

const monthToggleStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 4,
  padding: 0,
  cursor: "pointer",
  maxWidth: "100%",
  overflow: "visible",
  textAlign: "left",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
};

const ptoHeaderLabelButtonStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "text",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  padding: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
};

const ptoHeaderInputStyle: React.CSSProperties = {
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
};

const ptoDateTableLayoutStyle: React.CSSProperties = {
  height: "100%",
  minHeight: 0,
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  gap: 10,
};

const ptoDateTableScrollStyle: React.CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  paddingLeft: 34,
  paddingRight: 40,
  background: "#ffffff",
  height: "100%",
  minHeight: 0,
};

const ptoToolbarStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: "8px 10px",
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) auto auto",
  gap: 8,
  alignItems: "end",
};

const ptoToolbarBlockStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  alignContent: "start",
};

const ptoToolbarRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  alignItems: "center",
};

const ptoToolbarLabelStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
};

const ptoYearDialogStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 7,
  display: "flex",
  gap: 6,
  alignItems: "end",
  flexWrap: "wrap",
};

const ptoFormulaBarStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
  display: "grid",
  gridTemplateColumns: "minmax(240px, 1fr)",
  gap: 8,
  alignItems: "center",
};

const ptoFormulaInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  fontVariantNumeric: "tabular-nums",
  outline: "none",
};

const ptoAreaCellStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const ptoRowToolsStyle: React.CSSProperties = {
  position: "absolute",
  left: -32,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 30,
  display: "grid",
  placeItems: "center",
};

const dragHandleStyle: React.CSSProperties = {
  width: 18,
  height: 24,
  border: "none",
  background: "transparent",
  color: "#475569",
  cursor: "grab",
  fontFamily: "inherit",
  display: "inline-grid",
  placeItems: "center",
  padding: 0,
  flex: "0 0 auto",
};

const ptoRowDeleteButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 24,
  height: 26,
  border: "none",
  background: "transparent",
  color: "#991b1b",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  opacity: 0.72,
  zIndex: 6,
};

const ptoInlineAddRowButtonStyle: React.CSSProperties = {
  position: "absolute",
  left: -27,
  bottom: -10,
  width: 18,
  height: 18,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#bfdbfe",
  borderRadius: 4,
  background: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: "16px",
  opacity: 0.28,
  padding: 0,
  transition: "opacity 120ms ease, background 120ms ease, border-color 120ms ease",
  zIndex: 6,
};

const ptoInlineAddRowButtonHoverStyle: React.CSSProperties = {
  opacity: 1,
  background: "#dbeafe",
  borderColor: "#60a5fa",
};

const ptoDropIndicatorStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  height: 3,
  background: "#2563eb",
  borderRadius: 999,
  pointerEvents: "none",
  zIndex: 3,
};

const ptoRowResizeHandleStyle: React.CSSProperties = {
  position: "absolute",
  left: -24,
  right: 0,
  bottom: -4,
  height: 8,
  cursor: "row-resize",
  zIndex: 8,
};

const dragHandleDotsStyle: React.CSSProperties = {
  width: 6,
  display: "grid",
  gap: 3,
  justifyItems: "center",
};

const dragHandleDotStyle: React.CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: 999,
  background: "#64748b",
};

const ptoDraftRowStyle: React.CSSProperties = {
  background: "#f8fafc",
  color: "#64748b",
};

const ptoDraftAddButtonStyle: React.CSSProperties = {
  position: "absolute",
  left: -28,
  top: "50%",
  transform: "translateY(-50%)",
  width: 20,
  height: 20,
  border: "1px solid #bfdbfe",
  borderRadius: 4,
  background: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: "18px",
  opacity: 0.75,
  padding: 0,
};

const ptoDraftInputStyle: React.CSSProperties = {
  background: "transparent",
  borderColor: "transparent",
  color: "#64748b",
  fontStyle: "italic",
};

const ptoDraftStatusStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 29,
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: "6px 8px",
};

const ptoDraftCellHintStyle: React.CSSProperties = {
  display: "block",
  minHeight: 29,
};

const ptoPlanInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  padding: "3px 4px",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  outline: "none",
  fontVariantNumeric: "tabular-nums",
  background: "transparent",
};

const ptoCompactNumberInputStyle: React.CSSProperties = {
  minWidth: 0,
  cursor: "cell",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

const ptoStatusBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 25,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 4,
  padding: "3px 6px",
  fontWeight: 800,
  lineHeight: 1.15,
  textAlign: "center",
  whiteSpace: "normal",
};

const ptoReadonlyTotalStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 92,
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  cursor: "cell",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.25,
  padding: "3px 4px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

const ptoReadonlyCellTextStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  padding: "4px 5px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const ptoReadonlyCellNumberStyle: React.CSSProperties = {
  ...ptoReadonlyCellTextStyle,
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

const ptoPlanDayInputStyle: React.CSSProperties = {
  ...ptoPlanInputStyle,
  minWidth: 82,
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

const adminLogSummaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 10,
  marginBottom: 12,
};

const adminLogSummaryCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 12,
};

const adminLogSummaryLabelStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};

const adminLogSummaryValueStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 800,
};

const adminLogSummaryMetaStyle: React.CSSProperties = {
  color: "#475569",
  fontSize: 12,
  marginTop: 4,
};

const adminLogSummaryDetailsStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 13,
  marginTop: 8,
};

const adminLogSummaryEmptyStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
};

const adminLogTableScrollStyle: React.CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
};

const adminLogTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
  fontSize: 13,
};

const adminLogEmptyCellStyle: React.CSSProperties = {
  padding: "14px 10px",
  color: "#64748b",
  textAlign: "center",
};

const adminDetailCellStyle: React.CSSProperties = {
  padding: "10px 12px 14px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const adminTabNameWithDeleteStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 6,
  maxWidth: "100%",
};

const adminInlineTrashButtonStyle: React.CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  width: 22,
  height: 22,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#991b1b",
  cursor: "pointer",
  display: "inline-grid",
  flex: "0 0 auto",
  placeItems: "center",
  padding: 0,
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
