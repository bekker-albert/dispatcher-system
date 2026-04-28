import type { TopTabDefinition } from "@/lib/domain/navigation/tabs";
import { AdminNavigationTableRow } from "./AdminNavigationTableRow";
import type { AdminNavigationEditingTarget, AdminNavigationRow } from "./adminNavigationRows";
import { actionThStyle, headRowStyle, tableStyle, tableWrapStyle, thStyle } from "./adminNavigationStyles";

type AdminNavigationTableProps = {
  rows: AdminNavigationRow[];
  editingKey: string;
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

export function AdminNavigationTable({
  rows,
  editingKey,
  draftLabel,
  setDraftLabel,
  startEditing,
  cancelEditing,
  commitEditing,
  onDeleteTopTab,
  onShowTopTab,
  onDeleteCustomTab,
  onShowCustomTab,
}: AdminNavigationTableProps) {
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr style={headRowStyle}>
            <th style={thStyle}>Название</th>
            <th style={thStyle}>Тип</th>
            <th style={thStyle}>Статус</th>
            <th style={actionThStyle} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AdminNavigationTableRow
              key={row.key}
              row={row}
              isEditing={editingKey === row.key}
              draftLabel={draftLabel}
              setDraftLabel={setDraftLabel}
              startEditing={startEditing}
              cancelEditing={cancelEditing}
              commitEditing={commitEditing}
              onDeleteTopTab={onDeleteTopTab}
              onShowTopTab={onShowTopTab}
              onDeleteCustomTab={onDeleteCustomTab}
              onShowCustomTab={onShowCustomTab}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
