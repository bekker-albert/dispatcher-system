"use client";

import { Check, Pencil } from "lucide-react";
import type { CSSProperties } from "react";
import { MiniIconButton } from "@/shared/ui/buttons";
import { reportRowKey } from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";

type ReportFactSourceCellProps = {
  sourceRowKeys: string[];
  rowsByKey: Map<string, ReportRow>;
  rowLabels: ReportCustomerConfig["rowLabels"];
  onEdit: () => void;
};

type ReportFactSourceModalProps = {
  customer: ReportCustomerConfig;
  targetRow: ReportRow | null;
  sourceOptions: ReportRow[];
  onClose: () => void;
  onSetMode: (customerId: string, targetRowKey: string, enabled: boolean) => void;
  onToggleSource: (customerId: string, targetRowKey: string, sourceRowKey: string) => void;
};

export function ReportFactSourceCell({
  sourceRowKeys,
  rowsByKey,
  rowLabels,
  onEdit,
}: ReportFactSourceCellProps) {
  const selectedRows = sourceRowKeys
    .map((sourceRowKey) => rowsByKey.get(sourceRowKey))
    .filter((row): row is ReportRow => Boolean(row));
  const isSumMode = sourceRowKeys.length > 0;
  const selectedText = selectedRows.length > 0
    ? selectedRows.map((row) => rowLabels[reportRowKey(row)]?.trim() || row.name).join(" + ")
    : "Свой факт";

  return (
    <div style={factSourceCellStyle}>
      <span style={isSumMode ? factSourceSumBadgeStyle : factSourceOwnBadgeStyle} title={selectedText}>
        {isSumMode ? `Сумма: ${sourceRowKeys.length}` : "Свой"}
      </span>
      <MiniIconButton label="Настроить источник факта" onClick={onEdit}>
        <Pencil size={13} aria-hidden />
      </MiniIconButton>
    </div>
  );
}

export function ReportFactSourceModal({
  customer,
  targetRow,
  sourceOptions,
  onClose,
  onSetMode,
  onToggleSource,
}: ReportFactSourceModalProps) {
  if (!targetRow) return null;

  const targetRowKey = reportRowKey(targetRow);
  const targetRowLabel = customer.rowLabels[targetRowKey]?.trim() || targetRow.name;
  const sourceRowKeys = customer.factSourceRowKeys[targetRowKey] ?? [];
  const isSumMode = sourceRowKeys.length > 0;

  return (
    <div style={modalOverlayStyle} role="dialog" aria-modal="true" aria-label="Настройка источника факта">
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <div style={modalTitleStyle}>Факт/замер</div>
          <MiniIconButton label="Закрыть настройку источника факта" onClick={onClose}>
            <Check size={13} aria-hidden />
          </MiniIconButton>
        </div>
        <div style={targetStyle} title={targetRowLabel}>
          {targetRow.area} · {targetRowLabel}
        </div>
        <div style={modeRowStyle}>
          <button
            type="button"
            style={isSumMode ? modeButtonStyle : modeActiveStyle}
            onClick={() => onSetMode(customer.id, targetRowKey, false)}
          >
            Свой факт
          </button>
          <button
            type="button"
            style={isSumMode ? modeActiveStyle : modeButtonStyle}
            onClick={() => onSetMode(customer.id, targetRowKey, true)}
          >
            Сумма строк
          </button>
        </div>
        {isSumMode ? (
          <>
            <div style={helperTextStyle}>Выбери строки, которые нужно суммировать. Видимость строк в отчете не меняется.</div>
            <div style={sourceGridStyle}>
              {sourceOptions.map((sourceRow) => {
                const sourceRowKey = reportRowKey(sourceRow);
                const sourceRowLabel = customer.rowLabels[sourceRowKey]?.trim() || sourceRow.name;

                return (
                  <label key={`${targetRowKey}-fact-source-${sourceRowKey}`} style={sourceOptionStyle}>
                    <input
                      type="checkbox"
                      checked={sourceRowKeys.includes(sourceRowKey)}
                      onChange={() => onToggleSource(customer.id, targetRowKey, sourceRowKey)}
                    />
                    <span style={sourceNameStyle}>{sourceRowLabel}</span>
                    <span style={sourceUnitStyle}>{sourceRow.unit}</span>
                  </label>
                );
              })}
            </div>
          </>
        ) : (
          <div style={helperTextStyle}>Строка берет факт и замер из своей строки ПТО.</div>
        )}
      </div>
    </div>
  );
}

const helperTextStyle: CSSProperties = {
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
};

const factSourceCellStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 22px",
  alignItems: "center",
  gap: 4,
};

const factSourceOwnBadgeStyle: CSSProperties = {
  minWidth: 0,
  color: "#334155",
  fontSize: 12,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const factSourceSumBadgeStyle: CSSProperties = {
  ...factSourceOwnBadgeStyle,
  color: "#0f172a",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 50,
  display: "grid",
  placeItems: "center",
  background: "rgba(15, 23, 42, 0.18)",
  padding: 16,
};

const modalStyle: CSSProperties = {
  width: "min(760px, calc(100vw - 32px))",
  maxHeight: "min(680px, calc(100vh - 32px))",
  overflow: "auto",
  display: "grid",
  gap: 10,
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.22)",
  padding: 12,
};

const modalHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 22px",
  alignItems: "center",
  gap: 8,
};

const modalTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 800,
};

const targetStyle: CSSProperties = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.3,
};

const modeRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const modeButtonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  padding: "7px 10px",
};

const modeActiveStyle: CSSProperties = {
  ...modeButtonStyle,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const sourceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 6,
};

const sourceOptionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) max-content",
  gap: 6,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  background: "#ffffff",
  padding: "5px 7px",
};

const sourceNameStyle: CSSProperties = {
  minWidth: 0,
  fontSize: 11,
  fontWeight: 400,
  lineHeight: 1.18,
  overflowWrap: "normal",
  wordBreak: "normal",
};

const sourceUnitStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 400,
  justifySelf: "end",
  textAlign: "right",
};
