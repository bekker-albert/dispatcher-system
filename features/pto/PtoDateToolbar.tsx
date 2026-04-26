import { Check, Download, Pencil, Upload } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import {
  ptoToolbarBlockStyle,
  ptoToolbarLabelStyle,
  ptoToolbarRowStyle,
  ptoToolbarStyle,
  ptoYearDialogStyle,
} from "./ptoDateTableStyles";
import { PtoToolbarButton, PtoToolbarIconButton } from "./PtoToolbarButtons";

type PtoDateToolbarProps = {
  areaTabs: string[];
  areaFilter: string;
  onSelectArea: (area: string) => void;
  showExcelControls: boolean;
  excelLabel: string;
  editing: boolean;
  onExport: () => void;
  onOpenImport: () => void;
  onImportChange: (event: ChangeEvent<HTMLInputElement>) => void;
  importInputRef: RefObject<HTMLInputElement | null>;
  onToggleEditing: () => void;
  yearTabs: string[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  onDeleteYear: () => void;
  onOpenYearDialog: () => void;
  yearDialogOpen: boolean;
  yearInput: string;
  onYearInputChange: (value: string) => void;
  onAddYear: () => void;
  onCloseYearDialog: () => void;
};

export function PtoDateToolbar({
  areaTabs,
  areaFilter,
  onSelectArea,
  showExcelControls,
  excelLabel,
  editing,
  onExport,
  onOpenImport,
  onImportChange,
  importInputRef,
  onToggleEditing,
  yearTabs,
  selectedYear,
  onSelectYear,
  onDeleteYear,
  onOpenYearDialog,
  yearDialogOpen,
  yearInput,
  onYearInputChange,
  onAddYear,
  onCloseYearDialog,
}: PtoDateToolbarProps) {
  return (
    <div style={ptoToolbarStyle}>
      <div style={ptoToolbarBlockStyle}>
        <span style={ptoToolbarLabelStyle}>Участки</span>
        <div style={ptoToolbarRowStyle}>
          {areaTabs.map((area) => (
            <PtoToolbarButton key={area} active={areaFilter === area} onClick={() => onSelectArea(area)} label={area} />
          ))}
        </div>
      </div>

      {showExcelControls ? (
        <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
          <span style={ptoToolbarLabelStyle}>Excel</span>
          <div style={ptoToolbarRowStyle}>
            <PtoToolbarIconButton label={`Скачать ${excelLabel} в Excel`} onClick={onExport}>
              <Download size={14} aria-hidden />
            </PtoToolbarIconButton>
            <PtoToolbarIconButton label={`Загрузить ${excelLabel} из Excel`} onClick={onOpenImport}>
              <Upload size={14} aria-hidden />
            </PtoToolbarIconButton>
            <PtoToolbarIconButton label={editing ? "Завершить редактирование таблицы" : "Редактировать таблицу"} onClick={onToggleEditing}>
              {editing ? <Check size={14} aria-hidden /> : <Pencil size={14} aria-hidden />}
            </PtoToolbarIconButton>
          </div>
          <input
            ref={importInputRef}
            accept=".xlsx,.csv"
            onChange={onImportChange}
            style={{ display: "none" }}
            type="file"
          />
        </div>
      ) : null}

      <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
        <span style={ptoToolbarLabelStyle}>Годы</span>
        <div style={ptoToolbarRowStyle}>
          <PtoToolbarIconButton label="Удалить выбранный год" onClick={onDeleteYear}>
            <span aria-hidden>-</span>
          </PtoToolbarIconButton>
          {yearTabs.map((year) => (
            <PtoToolbarButton key={year} active={selectedYear === year} onClick={() => onSelectYear(year)} label={year} />
          ))}
          <PtoToolbarIconButton label="Добавить год" onClick={onOpenYearDialog}>
            <span aria-hidden>+</span>
          </PtoToolbarIconButton>
        </div>
        {yearDialogOpen ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onAddYear();
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
                value={yearInput}
                onChange={(event) => onYearInputChange(event.target.value)}
                style={ptoYearInputStyle}
              />
            </label>
            <PtoToolbarButton active onClick={onAddYear} label="ОК" />
            <PtoToolbarButton active={false} onClick={onCloseYearDialog} label="Отмена" />
          </form>
        ) : null}
      </div>
    </div>
  );
}

const ptoYearInputStyle = {
  width: 96,
  padding: "5px 8px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.35,
  background: "#ffffff",
};
