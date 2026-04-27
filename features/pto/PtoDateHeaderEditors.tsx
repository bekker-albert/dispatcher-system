import type { CSSProperties, ReactNode } from "react";

import {
  monthToggleStyle,
  ptoHeaderInputStyle,
  ptoHeaderLabelButtonStyle,
} from "@/features/pto/ptoDateTableStyles";

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
      title={editingEnabled ? "Р”РІРѕР№РЅРѕР№ РєР»РёРє - РїРµСЂРµРёРјРµРЅРѕРІР°С‚СЊ Р·Р°РіРѕР»РѕРІРѕРє" : undefined}
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
      title="РљР»РёРє - СЃРІРµСЂРЅСѓС‚СЊ/СЂР°Р·РІРµСЂРЅСѓС‚СЊ, РґРІРѕР№РЅРѕР№ РєР»РёРє - РїРµСЂРµРёРјРµРЅРѕРІР°С‚СЊ"
      aria-expanded={expanded}
    >
      {icon}
      {label}
    </button>
  );
}
