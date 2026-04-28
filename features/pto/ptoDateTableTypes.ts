import type {
  ChangeEvent,
  Dispatch,
  DragEvent,
  MouseEvent,
  ReactNode,
  RefObject,
  SetStateAction,
  UIEvent,
  UIEventHandler,
} from "react";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaTypes";
import type { PtoDropTarget } from "@/features/pto/ptoDateInteractionTypes";
import type { PtoMonthGroupView, PtoRowDateTotals, PtoTableColumn } from "@/features/pto/ptoDateTableModel";
import type { PtoDatabaseSaveMode } from "@/features/pto/ptoPersistenceModel";
import type { PtoDateExcelMetaWithRows } from "@/features/pto/usePtoDateExcelTransfer";
import type { PtoDateViewport } from "@/features/pto/usePtoDateViewport";
import type { PtoRowTextField } from "@/features/pto/usePtoRowTextDrafts";
import type { PtoPersistenceDayValuePatch } from "@/lib/domain/pto/persistence-shared";
import type { PtoDraftRowFields, PtoDropPosition, PtoPlanRow } from "@/lib/domain/pto/date-table";

export type PtoRowsSetter = Dispatch<SetStateAction<PtoPlanRow[]>>;
export type PtoDayPatch = PtoPersistenceDayValuePatch;

export type PtoDateTableOptions = {
  showLocation?: boolean;
  editableMonthTotal?: boolean;
};

export type PtoDateReadonlyTableProps = {
  rows: PtoPlanRow[];
  showCustomerCode: boolean;
  showLocation: boolean;
  ptoPlanYear: string;
  ptoTab: string;
  reportDate: string;
  bottomSpacerHeight: number;
  carryoverHeader: string;
  displayMonthGroups: PtoMonthGroupView[];
  tableColumns: PtoTableColumn[];
  tableMinWidth: number;
  columnWidthByKey: Map<string, number>;
  rowHeights: Record<string, number>;
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: UIEventHandler<HTMLDivElement>;
  tableSpacerColSpan: number;
  topSpacerHeight: number;
  getEffectiveCarryover: (row: PtoPlanRow) => number;
  getRowDateTotals: (row: PtoPlanRow) => PtoRowDateTotals;
  headerLabel: (key: string, fallback: string) => string;
  onToggleMonth: (month: string) => void;
  toolbar: ReactNode;
};

export type PtoDateOptionMaps = {
  allAreasKey: string;
  locationsByArea: Map<string, string[]>;
  structuresByArea: Map<string, string[]>;
  structuresByAreaLocation: Map<string, string[]>;
};

export type PtoHeaderEditor = {
  ptoHeaderLabel: (key: string, fallback: string) => string;
  editingPtoHeaderKey: string | null;
  ptoHeaderDraft: string;
  setPtoHeaderDraft: Dispatch<SetStateAction<string>>;
  startPtoHeaderEdit: (key: string, fallback: string) => void;
  commitPtoHeaderEdit: (key: string, fallback: string) => void;
  cancelPtoHeaderEdit: () => void;
};

export type PtoDateTableContainerProps = PtoHeaderEditor & {
  rows: PtoPlanRow[];
  setRows: PtoRowsSetter;
  options?: PtoDateTableOptions;
  ptoTab: string;
  ptoAreaFilter: string;
  ptoPlanYear: string;
  reportDate: string;
  ptoYearMonths: string[];
  ptoMonthGroups: PtoMonthGroupView[];
  ptoAreaTabs: string[];
  ptoYearTabs: string[];
  ptoYearDialogOpen: boolean;
  ptoYearInput: string;
  ptoDateEditing: boolean;
  ptoColumnWidths: Record<string, number>;
  ptoRowHeights: Record<string, number>;
  ptoDateViewport: PtoDateViewport;
  ptoDateOptionMaps: PtoDateOptionMaps;
  ptoDateTableScrollRef: RefObject<HTMLDivElement | null>;
  ptoPlanImportInputRef: RefObject<HTMLInputElement | null>;
  draggedPtoRowId: string | null;
  ptoDropTarget: PtoDropTarget | null;
  hoveredPtoAddRowId: string | null;
  ptoFormulaCell: PtoFormulaCell | null;
  ptoFormulaDraft: string;
  ptoInlineEditCell: PtoFormulaCell | null;
  ptoInlineEditInitialDraft: string;
  ptoSelectionAnchorCell: PtoFormulaCell | null;
  ptoSelectedCellKeys: string[];
  ptoSelectionDraggingRef: RefObject<boolean>;
  ptoDraftRowFields: PtoDraftRowFields;
  setPtoDateEditing: Dispatch<SetStateAction<boolean>>;
  setDraggedPtoRowId: Dispatch<SetStateAction<string | null>>;
  setPtoDropTarget: Dispatch<SetStateAction<PtoDropTarget | null>>;
  setPtoFormulaCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoFormulaDraft: Dispatch<SetStateAction<string>>;
  setPtoInlineEditCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoInlineEditInitialDraft: Dispatch<SetStateAction<string>>;
  setPtoSelectionAnchorCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoSelectedCellKeys: Dispatch<SetStateAction<string[]>>;
  setPtoYearInput: Dispatch<SetStateAction<string>>;
  setPtoYearDialogOpen: Dispatch<SetStateAction<boolean>>;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  setHoveredPtoAddRowId: Dispatch<SetStateAction<string | null>>;
  setPtoDraftRowFields: Dispatch<SetStateAction<PtoDraftRowFields>>;
  setPtoPendingFieldFocus: Dispatch<SetStateAction<{ rowId: string; field: string } | null>>;
  savePtoLocalState: () => void;
  requestPtoDatabaseSave: () => void;
  savePtoDatabaseChanges: (mode: PtoDatabaseSaveMode) => boolean | Promise<boolean>;
  selectPtoArea: (area: string) => void;
  currentPtoDateExcelMeta: () => PtoDateExcelMetaWithRows;
  exportPtoDateTableToExcel: () => void | Promise<void>;
  openPtoDateImportFilePicker: () => void;
  importPtoDateTableFromExcel: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  selectPtoPlanYear: (year: string) => void;
  deletePtoYear: () => void;
  addPtoYear: () => void;
  updatePtoDateViewportFromElement: (element: HTMLDivElement, threshold?: number) => void;
  handlePtoDateTableScroll: (event: UIEvent<HTMLDivElement>) => void;
  startPtoColumnResize: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
  startPtoRowResize: (event: MouseEvent<HTMLElement>, key: string) => void;
  addLinkedPtoDateRow: (overrides?: Partial<PtoPlanRow>, insertAfterRow?: PtoPlanRow) => string;
  removeLinkedPtoDateRow: (row: PtoPlanRow) => void;
  getPtoDropPosition: (event: DragEvent<HTMLTableRowElement>) => PtoDropPosition;
  moveLinkedPtoDateRow: (sourceId: string, targetId: string, visibleRows: PtoPlanRow[], position: PtoDropPosition) => void;
  updatePtoDateRow: (setRows: PtoRowsSetter, id: string, field: keyof Omit<PtoPlanRow, "id" | "dailyPlans">, value: string) => void;
  clearPtoCarryoverOverride: (setRows: PtoRowsSetter, id: string, year: string) => void;
  updatePtoDateDay: (setRows: PtoRowsSetter, id: string, day: string, value: string) => void;
  updatePtoMonthTotal: (setRows: PtoRowsSetter, id: string, days: string[], value: string) => void;
  beginPtoRowTextDraft: (row: PtoPlanRow, field: PtoRowTextField) => void;
  getPtoRowTextDraft: (row: PtoPlanRow, field: PtoRowTextField) => string;
  updatePtoRowTextDraft: (rowId: string, field: PtoRowTextField, value: string) => void;
  commitPtoRowTextDraft: (setRows: PtoRowsSetter, row: PtoPlanRow, field: PtoRowTextField) => void;
  cancelPtoRowTextDraft: (rowId: string, field: PtoRowTextField) => void;
};
