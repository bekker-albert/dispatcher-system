import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { PtoStatus } from "../../lib/domain/pto/date-table";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "../../lib/domain/pto/formatting";
import {
  monthToggleStyle,
  ptoFormulaBarStyle,
  ptoFormulaInputStyle,
  ptoHeaderInputStyle,
  ptoHeaderLabelButtonStyle,
  ptoReadonlyCellNumberStyle,
  ptoReadonlyCellTextStyle,
} from "./ptoDateTableStyles";

type PtoPlanThProps = {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  align?: CSSProperties["textAlign"];
  columnKey?: string;
  width?: number;
  onResizeStart?: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
};

type PtoPlanTdProps = {
  children: ReactNode;
  colSpan?: number;
  active?: boolean;
  selected?: boolean;
  editing?: boolean;
  align?: CSSProperties["textAlign"];
};

type PtoReadonlyTextCellProps = {
  value: string;
  align?: CSSProperties["textAlign"];
};

type PtoReadonlyNumberCellProps = {
  value: number | undefined;
  bold?: boolean;
};

type PtoEditableHeaderTextProps = {
  columnKey: string;
  fallback: string;
  label: string;
  align?: CSSProperties["textAlign"];
  editing: boolean;
  editingEnabled: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onStartEdit: (key: string, fallback: string) => void;
  onCommit: (key: string, fallback: string) => void;
  onCancel: () => void;
};

type PtoEditableMonthHeaderProps = PtoEditableHeaderTextProps & {
  expanded: boolean;
  icon: ReactNode;
  onToggle: () => void;
};

type PtoFormulaBarProps = {
  value: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
  onBlur: () => void;
};

export function PtoPlanTh({
  children,
  colSpan = 1,
  rowSpan = 1,
  align = "left",
  columnKey,
  width,
  onResizeStart,
}: PtoPlanThProps) {
  const justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={{
        ...ptoPlanThStyle,
        textAlign: align,
        ...(width ? { width, minWidth: width, maxWidth: width } : null),
      }}
    >
      <div style={{ ...ptoHeaderContentStyle, justifyContent, textAlign: align }}>{children}</div>
      {columnKey && width && onResizeStart ? (
        <span
          onMouseDown={(event) => onResizeStart(event, columnKey, width)}
          style={ptoColumnResizeHandleStyle}
          title="Потяни, чтобы изменить ширину столбца"
          aria-hidden
        />
      ) : null}
    </th>
  );
}

export function PtoPlanTd({
  children,
  colSpan = 1,
  active = false,
  selected = false,
  editing = false,
  align,
}: PtoPlanTdProps) {
  return (
    <td
      colSpan={colSpan}
      style={{
        ...ptoPlanTdStyle,
        ...(align ? { textAlign: align } : null),
        ...(selected ? ptoSelectedFormulaCellStyle : null),
        ...(editing ? ptoEditingFormulaCellStyle : null),
        ...(active ? ptoActiveFormulaCellStyle : null),
      }}
    >
      {children}
    </td>
  );
}

export function PtoReadonlyTextCell({ value, align = "left" }: PtoReadonlyTextCellProps) {
  return (
    <div style={{ ...ptoReadonlyCellTextStyle, textAlign: align }} title={value || undefined}>
      {value || ""}
    </div>
  );
}

export function PtoReadonlyNumberCell({ value, bold = false }: PtoReadonlyNumberCellProps) {
  return (
    <div
      style={{
        ...ptoReadonlyCellNumberStyle,
        ...(bold ? { fontWeight: 800 } : null),
      }}
      title={formatPtoFormulaNumber(value)}
    >
      {formatPtoCellNumber(value)}
    </div>
  );
}

export function PtoEditableHeaderText({
  columnKey,
  fallback,
  label,
  align = "left",
  editing,
  editingEnabled,
  draft,
  onDraftChange,
  onStartEdit,
  onCommit,
  onCancel,
}: PtoEditableHeaderTextProps) {
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onBlur={(event) => {
          if (event.currentTarget.dataset.cancelHeaderEdit === "true") return;
          onCommit(columnKey, fallback);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCommit(columnKey, fallback);
          }

          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.dataset.cancelHeaderEdit = "true";
            onCancel();
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
        if (!editingEnabled) return;
        event.stopPropagation();
        onStartEdit(columnKey, fallback);
      }}
      style={{ ...ptoHeaderLabelButtonStyle, textAlign: align }}
      title={editingEnabled ? "Двойной клик - переименовать заголовок" : undefined}
    >
      {label}
    </button>
  );
}

export function PtoEditableMonthHeader({
  columnKey,
  fallback,
  label,
  editing,
  editingEnabled,
  draft,
  expanded,
  icon,
  onDraftChange,
  onStartEdit,
  onCommit,
  onCancel,
  onToggle,
}: PtoEditableMonthHeaderProps) {
  if (editing) {
    return (
      <PtoEditableHeaderText
        columnKey={columnKey}
        fallback={fallback}
        label={label}
        editing={editing}
        editingEnabled={editingEnabled}
        draft={draft}
        onDraftChange={onDraftChange}
        onStartEdit={onStartEdit}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      onDoubleClick={(event) => {
        if (!editingEnabled) return;
        event.stopPropagation();
        onStartEdit(columnKey, fallback);
      }}
      style={monthToggleStyle}
      title="Клик - свернуть/развернуть, двойной клик - переименовать"
      aria-expanded={expanded}
    >
      {icon}
      {label}
    </button>
  );
}

export function PtoFormulaBar({ value, disabled, onValueChange, onBlur }: PtoFormulaBarProps) {
  return (
    <div style={ptoFormulaBarStyle}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="Выбери числовую ячейку"
        style={ptoFormulaInputStyle}
      />
    </div>
  );
}

const ptoPlanThStyle: CSSProperties = {
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  verticalAlign: "middle",
  whiteSpace: "normal",
  position: "relative",
  overflow: "visible",
};

const ptoHeaderContentStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  minWidth: 0,
  overflow: "visible",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
  textAlign: "inherit",
};

const ptoColumnResizeHandleStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: -3,
  width: 7,
  height: "100%",
  cursor: "col-resize",
  zIndex: 12,
};

const ptoPlanTdStyle: CSSProperties = {
  position: "relative",
  padding: 3,
  border: "1px solid #e2e8f0",
  verticalAlign: "middle",
  background: "inherit",
};

const ptoActiveFormulaCellStyle: CSSProperties = {
  boxShadow: "inset 0 0 0 2px #2563eb",
  zIndex: 3,
};

const ptoSelectedFormulaCellStyle: CSSProperties = {
  boxShadow: "inset 0 0 0 2px #2563eb",
  background: "#eff6ff",
  zIndex: 2,
};

const ptoEditingFormulaCellStyle: CSSProperties = {
  background: "#f1f5f9",
};

export function ptoStatusControlStyle(status: PtoStatus): CSSProperties {
  if (status === "Новая" || status === "Пусто") {
    return {
      background: "#f1f5f9",
      borderColor: "#cbd5e1",
      color: "#334155",
    };
  }

  if (status === "В работе") {
    return {
      background: "#dcfce7",
      borderColor: "#86efac",
      color: "#166534",
    };
  }

  if (status === "Завершена") {
    return {
      background: "#ffe4e6",
      borderColor: "#fda4af",
      color: "#9f1239",
    };
  }

  return {
    background: "#dbeafe",
    borderColor: "#93c5fd",
    color: "#1e40af",
  };
}
