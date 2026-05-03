"use client";

import { useId, type ChangeEvent } from "react";
import { Check, Download, Pencil, Upload } from "lucide-react";

import { PtoToolbarButton, PtoToolbarIconButton } from "@/features/pto/PtoToolbarButtons";
import {
  ptoToolbarBlockStyle,
  ptoToolbarLabelStyle,
  ptoToolbarRowStyle,
  ptoToolbarStyle,
} from "@/features/pto/ptoBucketsStyles";

type PtoBucketsToolbarProps = {
  editingMode: boolean;
  onSelectArea: (area: string) => void;
  onToggleEditingMode: () => void;
  onExportToExcel?: () => void | Promise<void>;
  onImportFromExcel?: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  ptoAreaFilter: string;
  ptoAreaTabs: string[];
};

export function PtoBucketsToolbar({
  editingMode,
  onSelectArea,
  onToggleEditingMode,
  onExportToExcel,
  onImportFromExcel,
  ptoAreaFilter,
  ptoAreaTabs,
}: PtoBucketsToolbarProps) {
  const importInputId = useId();
  const excelTransferEnabled = Boolean(onExportToExcel && onImportFromExcel);
  const handleExportToExcel = () => {
    void onExportToExcel?.();
  };
  const handleImportFromExcel = (event: ChangeEvent<HTMLInputElement>) => {
    void onImportFromExcel?.(event);
  };

  return (
    <div style={ptoToolbarStyle}>
      <div style={ptoToolbarBlockStyle}>
        <span style={ptoToolbarLabelStyle}>Участки</span>
        <div style={ptoToolbarRowStyle}>
          {ptoAreaTabs.map((area) => (
            <PtoToolbarButton key={area} active={ptoAreaFilter === area} onClick={() => onSelectArea(area)} label={area} />
          ))}
        </div>
      </div>

      <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
        <div style={ptoToolbarRowStyle}>
          {excelTransferEnabled ? (
            <>
              <PtoToolbarIconButton label="Загрузить таблицу из Excel" onClick={() => document.getElementById(importInputId)?.click()}>
                <Upload size={14} aria-hidden />
              </PtoToolbarIconButton>
              <PtoToolbarIconButton label="Выгрузить таблицу в Excel" onClick={handleExportToExcel}>
                <Download size={14} aria-hidden />
              </PtoToolbarIconButton>
            </>
          ) : null}
          <PtoToolbarIconButton
            label={editingMode ? "Завершить редактирование таблицы" : "Редактировать таблицу"}
            onClick={onToggleEditingMode}
          >
            {editingMode ? <Check size={14} aria-hidden /> : <Pencil size={14} aria-hidden />}
          </PtoToolbarIconButton>
          {excelTransferEnabled ? (
            <input
              id={importInputId}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleImportFromExcel}
              style={{ display: "none" }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
