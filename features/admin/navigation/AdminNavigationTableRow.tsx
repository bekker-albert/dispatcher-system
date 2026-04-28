import { Check, Eye, Pencil, Trash2, X } from "lucide-react";
import type { TopTabDefinition } from "@/lib/domain/navigation/tabs";
import { IconButton } from "@/shared/ui/buttons";
import type { AdminNavigationEditingTarget, AdminNavigationRow } from "./adminNavigationRows";
import { actionsTdStyle, inlineInputStyle, nameStyle, tdStyle } from "./adminNavigationStyles";

type AdminNavigationTableRowProps = {
  row: AdminNavigationRow;
  isEditing: boolean;
  draftLabel: string;
  setDraftLabel: (label: string) => void;
  startEditing: (nextEditing: AdminNavigationEditingTarget, label: string) => void;
  cancelEditing: () => void;
  commitEditing: () => void;
  onDeleteTopTab: (id: TopTabDefinition["id"]) => void;
  onShowTopTab: (id: TopTabDefinition["id"]) => void;
  onDeleteCustomTab: (id: string) => void;
  onShowCustomTab: (id: string) => void;
};

export function AdminNavigationTableRow({
  row,
  isEditing,
  draftLabel,
  setDraftLabel,
  startEditing,
  cancelEditing,
  commitEditing,
  onDeleteTopTab,
  onShowTopTab,
  onDeleteCustomTab,
  onShowCustomTab,
}: AdminNavigationTableRowProps) {
  return (
    <tr>
      <td style={tdStyle}>
        {isEditing ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(event) => setDraftLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitEditing();
              if (event.key === "Escape") cancelEditing();
            }}
            style={inlineInputStyle}
          />
        ) : (
          <span style={nameStyle}>{row.label}</span>
        )}
      </td>
      <td style={tdStyle}>{row.typeLabel}</td>
      <td style={tdStyle}>{row.statusLabel}</td>
      <td style={actionsTdStyle}>
        {isEditing ? (
          <>
            <IconButton label="Сохранить название" onClick={commitEditing}>
              <Check size={16} aria-hidden />
            </IconButton>
            <IconButton label="Отменить" onClick={cancelEditing}>
              <X size={16} aria-hidden />
            </IconButton>
          </>
        ) : (
          <>
            <IconButton label="Редактировать название" onClick={() => startEditing(row.editingTarget, row.label)}>
              <Pencil size={16} aria-hidden />
            </IconButton>
            {row.editingTarget.type === "top" ? (
              renderTopTabVisibilityAction(row.editingTarget.id, row.visible, row.locked, onDeleteTopTab, onShowTopTab)
            ) : (
              renderCustomTabVisibilityAction(row.editingTarget.id, row.visible, onDeleteCustomTab, onShowCustomTab)
            )}
          </>
        )}
      </td>
    </tr>
  );
}

function renderTopTabVisibilityAction(
  id: TopTabDefinition["id"],
  visible: boolean,
  locked: boolean,
  onDeleteTopTab: (id: TopTabDefinition["id"]) => void,
  onShowTopTab: (id: TopTabDefinition["id"]) => void,
) {
  return visible ? (
    <IconButton label={locked ? "Эту вкладку нельзя удалить" : "Удалить вкладку"} onClick={() => onDeleteTopTab(id)} disabled={locked}>
      {locked ? <Eye size={16} aria-hidden /> : <Trash2 size={16} aria-hidden />}
    </IconButton>
  ) : (
    <IconButton label="Вернуть вкладку" onClick={() => onShowTopTab(id)}>
      <Eye size={16} aria-hidden />
    </IconButton>
  );
}

function renderCustomTabVisibilityAction(
  id: string,
  visible: boolean,
  onDeleteCustomTab: (id: string) => void,
  onShowCustomTab: (id: string) => void,
) {
  return visible ? (
    <IconButton label="Удалить вкладку" onClick={() => onDeleteCustomTab(id)}>
      <Trash2 size={16} aria-hidden />
    </IconButton>
  ) : (
    <IconButton label="Вернуть вкладку" onClick={() => onShowCustomTab(id)}>
      <Eye size={16} aria-hidden />
    </IconButton>
  );
}
