"use client";

import type { CustomTab, TopTabDefinition } from "@/lib/domain/navigation/tabs";
import { AdminNavigationHeader } from "./AdminNavigationHeader";
import { AdminNavigationTable } from "./AdminNavigationTable";
import { buildAdminNavigationRows } from "./adminNavigationRows";
import { sectionStyle } from "./adminNavigationStyles";
import { useAdminNavigationEditor } from "./useAdminNavigationEditor";

type AdminNavigationSectionProps = {
  topTabs: TopTabDefinition[];
  customTabs: CustomTab[];
  onAddCustomTab: (title: string) => void;
  onUpdateTopTabLabel: (id: TopTabDefinition["id"], label: string) => void;
  onUpdateCustomTabTitle: (id: string, title: string) => void;
  onDeleteTopTab: (id: TopTabDefinition["id"]) => void;
  onShowTopTab: (id: TopTabDefinition["id"]) => void;
  onDeleteCustomTab: (id: string) => void;
  onShowCustomTab: (id: string) => void;
};

export default function AdminNavigationSection({
  topTabs,
  customTabs,
  onAddCustomTab,
  onUpdateTopTabLabel,
  onUpdateCustomTabTitle,
  onDeleteTopTab,
  onShowTopTab,
  onDeleteCustomTab,
  onShowCustomTab,
}: AdminNavigationSectionProps) {
  const rows = buildAdminNavigationRows(topTabs, customTabs);
  const editor = useAdminNavigationEditor({
    onAddCustomTab,
    onUpdateTopTabLabel,
    onUpdateCustomTabTitle,
  });

  return (
    <div style={sectionStyle}>
      <AdminNavigationHeader
        newTabTitle={editor.newTabTitle}
        setNewTabTitle={editor.setNewTabTitle}
        addTab={editor.addTab}
      />

      <AdminNavigationTable
        rows={rows}
        editingKey={editor.editingKey}
        draftLabel={editor.draftLabel}
        setDraftLabel={editor.setDraftLabel}
        startEditing={editor.startEditing}
        cancelEditing={editor.cancelEditing}
        commitEditing={editor.commitEditing}
        onDeleteTopTab={onDeleteTopTab}
        onShowTopTab={onShowTopTab}
        onDeleteCustomTab={onDeleteCustomTab}
        onShowCustomTab={onShowCustomTab}
      />
    </div>
  );
}
