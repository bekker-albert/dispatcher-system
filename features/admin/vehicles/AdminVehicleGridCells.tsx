import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";

export function AdminVehicleCellInput({
  active,
  selected,
  editing,
  draft,
  fieldKey,
  value,
  onChange,
  onSelect,
  onExtendSelection,
  onStartEdit,
  onDraftChange,
  onCommitEdit,
  onKeyDown,
  list,
  type = "text",
  numeric = false,
}: {
  active?: boolean;
  selected?: boolean;
  editing?: boolean;
  draft?: string;
  fieldKey: string;
  value: string | number;
  onChange: (value: string) => void;
  onSelect?: (event: MouseEvent<HTMLElement>) => void;
  onExtendSelection?: (event: MouseEvent<HTMLElement>) => void;
  onStartEdit?: () => void;
  onDraftChange?: (value: string) => void;
  onCommitEdit?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  list?: string;
  type?: "text" | "number";
  numeric?: boolean;
}) {
  const shellStyle = {
    ...adminVehicleCellShellStyle,
    ...(selected || active ? adminVehicleCellSelectedStyle : {}),
    ...(active ? adminVehicleCellActiveStyle : {}),
    ...(editing ? adminVehicleCellEditingStyle : {}),
  };
  const inputStyle = {
    ...adminVehicleInputStyle,
    ...(numeric ? adminVehicleNumberInputStyle : {}),
  };
  const displayStyle = {
    ...adminVehicleCellDisplayStyle,
    ...(numeric ? adminVehicleNumberDisplayStyle : {}),
  };

  return (
    <div
      data-admin-vehicle-cell={fieldKey}
      onMouseDown={(event) => {
        if (editing) return;
        event.preventDefault();
        event.currentTarget.focus();
        onSelect?.(event);
      }}
      onMouseEnter={(event) => {
        if (editing) return;
        onExtendSelection?.(event);
      }}
      onDoubleClick={(event) => {
        event.preventDefault();
        onStartEdit?.();
      }}
      onKeyDown={onKeyDown}
      role="gridcell"
      style={shellStyle}
      tabIndex={0}
    >
      {editing ? (
        <input
          data-admin-vehicle-input={fieldKey}
          list={list}
          type={type}
          value={draft ?? String(value)}
          onMouseDown={(event) => event.stopPropagation()}
          onBlur={onCommitEdit}
          onChange={(event) => (onDraftChange ?? onChange)(event.target.value)}
          onKeyDown={onKeyDown}
          style={inputStyle}
        />
      ) : (
        <span style={displayStyle}>{value}</span>
      )}
    </div>
  );
}

export function AdminVehicleReadOnlyCell({ value, numeric = false }: { value: string | number; numeric?: boolean }) {
  const text = String(value ?? "").trim();
  const displayValue = text || "—";

  return (
    <span
      title={text || undefined}
      style={{
        ...adminVehicleReadOnlyCellStyle,
        ...(numeric ? adminVehicleNumberDisplayStyle : null),
      }}
    >
      {displayValue}
    </span>
  );
}

const adminVehicleCellShellStyle: CSSProperties = {
  width: "100%",
  minHeight: 23,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  background: "transparent",
  cursor: "cell",
  display: "grid",
  alignItems: "center",
  outline: "none",
};

const adminVehicleCellSelectedStyle: CSSProperties = {
  borderColor: "#2563eb",
  background: "#eff6ff",
};

const adminVehicleCellActiveStyle: CSSProperties = {
  boxShadow: "inset 0 0 0 1px #2563eb",
};

const adminVehicleCellEditingStyle: CSSProperties = {
  background: "#f1f5f9",
};

const adminVehicleCellDisplayStyle: CSSProperties = {
  minWidth: 0,
  minHeight: 19,
  color: "#0f172a",
  fontSize: 12,
  lineHeight: 1.25,
  overflow: "hidden",
  padding: "3px 2px",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const adminVehicleNumberDisplayStyle: CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

const adminVehicleReadOnlyCellStyle: CSSProperties = {
  ...adminVehicleCellDisplayStyle,
  cursor: "default",
  padding: "1px 2px",
};

const adminVehicleInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  outline: "none",
  padding: "3px 2px",
};

const adminVehicleNumberInputStyle: CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};
