import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";

export type ReportFactSourceCellProps = {
  sourceRowKeys: string[];
  rowsByKey: Map<string, ReportRow>;
  rowLabels: ReportCustomerConfig["rowLabels"];
  onEdit: () => void;
};

export type ReportFactSourceModalProps = {
  customer: ReportCustomerConfig;
  targetRow: ReportRow | null;
  sourceOptions: ReportRow[];
  onClose: () => void;
  onSetMode: (customerId: string, targetRowKey: string, enabled: boolean) => void;
  onToggleSource: (customerId: string, targetRowKey: string, sourceRowKey: string) => void;
};

export type ReportFactSourceOptionProps = {
  customer: ReportCustomerConfig;
  targetRowKey: string;
  sourceRow: ReportRow;
  sourceRowKeys: string[];
  onToggleSource: (customerId: string, targetRowKey: string, sourceRowKey: string) => void;
};
