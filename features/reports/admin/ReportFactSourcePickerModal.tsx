"use client";

import { Check } from "lucide-react";
import { reportRowKey } from "@/lib/domain/reports/display";
import { MiniIconButton } from "@/shared/ui/buttons";
import { ReportFactSourcePickerSourceOption } from "./ReportFactSourcePickerSourceOption";
import {
  helperTextStyle,
  modalHeaderStyle,
  modalOverlayStyle,
  modalStyle,
  modalTitleStyle,
  modeActiveStyle,
  modeButtonStyle,
  modeRowStyle,
  sourceGridStyle,
  targetStyle,
} from "./ReportFactSourcePickerStyles";
import type { ReportFactSourceModalProps } from "./ReportFactSourcePickerTypes";
import { repairAdminReportText } from "./adminReportText";

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
  const targetRowLabel = repairAdminReportText(customer.rowLabels[targetRowKey]?.trim() || targetRow.name);
  const targetAreaLabel = repairAdminReportText(targetRow.area);
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
          {targetAreaLabel} · {targetRowLabel}
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

                return (
                  <ReportFactSourcePickerSourceOption
                    key={`${targetRowKey}-fact-source-${sourceRowKey}`}
                    customer={customer}
                    targetRowKey={targetRowKey}
                    sourceRow={sourceRow}
                    sourceRowKeys={sourceRowKeys}
                    onToggleSource={onToggleSource}
                  />
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
