import { useState } from "react";
import type { TopTabDefinition } from "@/lib/domain/navigation/tabs";
import type { AdminNavigationEditingTarget } from "./adminNavigationRows";
import { getAdminNavigationEditingKey } from "./adminNavigationRows";

type UseAdminNavigationEditorOptions = {
  onAddCustomTab: (title: string) => void;
  onUpdateTopTabLabel: (id: TopTabDefinition["id"], label: string) => void;
  onUpdateCustomTabTitle: (id: string, title: string) => void;
};

export function useAdminNavigationEditor({
  onAddCustomTab,
  onUpdateTopTabLabel,
  onUpdateCustomTabTitle,
}: UseAdminNavigationEditorOptions) {
  const [editing, setEditing] = useState<AdminNavigationEditingTarget | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [newTabTitle, setNewTabTitle] = useState("");

  function startEditing(nextEditing: AdminNavigationEditingTarget, label: string) {
    setEditing(nextEditing);
    setDraftLabel(label);
  }

  function cancelEditing() {
    setEditing(null);
    setDraftLabel("");
  }

  function commitEditing() {
    if (!editing) return;

    const label = draftLabel.trim();
    if (!label) return;

    if (editing.type === "top") {
      onUpdateTopTabLabel(editing.id, label);
    } else {
      onUpdateCustomTabTitle(editing.id, label);
    }

    cancelEditing();
  }

  function addTab() {
    const title = newTabTitle.trim();
    if (!title) return;

    onAddCustomTab(title);
    setNewTabTitle("");
  }

  return {
    editingKey: getAdminNavigationEditingKey(editing),
    draftLabel,
    newTabTitle,
    setDraftLabel,
    setNewTabTitle,
    startEditing,
    cancelEditing,
    commitEditing,
    addTab,
  };
}
