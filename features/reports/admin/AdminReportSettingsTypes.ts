import type { AdminReportCustomerSettingsTab } from "@/lib/domain/admin/navigation";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";

export type AdminReportWorkOrderGroup = {
  area: string;
  rows: ReportRow[];
};

export type AdminReportRowLabelEntry = {
  rowKey: string;
  label: string;
  row: ReportRow;
};

export type SummaryUpdateField = Exclude<keyof ReportSummaryRowConfig, "id" | "rowKeys">;

export type AdminReportSettingsSectionProps = {
  customers: ReportCustomerConfig[];
  activeCustomer: ReportCustomerConfig;
  settingsTab: AdminReportCustomerSettingsTab;
  canToggleAutoShowRows: boolean;
  selectedCount: number;
  usesSummaryRows: boolean;
  areaOptions: string[];
  summaryAreaOptions: string[];
  workOrderGroups: AdminReportWorkOrderGroup[];
  baseRows: ReportRow[];
  rowsByKey: Map<string, ReportRow>;
  visibleRowKeys: Set<string>;
  derivedRowsByKey: Map<string, ReportRow>;
  editingFactSourceRow: ReportRow | null;
  editingFactSourceOptions: ReportRow[];
  rowLabelEntries: AdminReportRowLabelEntry[];
  editingRowLabelKeys: string[];
  expandedSummaryIds: string[];
  rowsForArea: (area: string) => ReportRow[];
  onSelectCustomer: (customerId: string) => void;
  onAddCustomer: () => void;
  onDeleteCustomer: (customerId: string) => void;
  onUpdateCustomer: (customerId: string, patch: Partial<Pick<ReportCustomerConfig, "label" | "ptoCode" | "visible" | "autoShowRows">>) => void;
  onSetSettingsTab: (tab: AdminReportCustomerSettingsTab) => void;
  onMoveArea: (area: string, direction: -1 | 1) => void;
  onMoveWork: (area: string, rowKey: string, direction: -1 | 1) => void;
  onToggleCustomerRow: (customerId: string, rowKey: string) => void;
  onEditFactSource: (rowKey: string | null) => void;
  onSetFactSourceMode: (customerId: string, targetRowKey: string, enabled: boolean) => void;
  onToggleFactSourceRow: (customerId: string, targetRowKey: string, sourceRowKey: string) => void;
  onAddRowLabel: (customerId: string) => void;
  onChangeRowLabelSource: (customerId: string, currentRowKey: string, nextRowKey: string) => void;
  onUpdateRowLabel: (customerId: string, rowKey: string, value: string, fallback: string) => void;
  onStartRowLabelEdit: (rowKey: string) => void;
  onFinishRowLabelEdit: (rowKey: string) => void;
  onRemoveRowLabel: (customerId: string, rowKey: string) => void;
  onAddSummaryRow: (customerId: string) => void;
  onUpdateSummaryRow: (customerId: string, summaryId: string, field: SummaryUpdateField, value: string) => void;
  onToggleSummaryRow: (customerId: string, summaryId: string, rowKey: string) => void;
  onStartSummaryEdit: (summaryId: string) => void;
  onFinishSummaryEdit: (summaryId: string) => void;
  onRemoveSummaryRow: (customerId: string, summaryId: string) => void;
};
