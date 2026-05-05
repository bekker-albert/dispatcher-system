"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AiAssistantDocument,
  AiAssistantDocumentologItem,
  AiAssistantMailDraft,
} from "@/features/ai-assistant/types";
import { WorkspaceDraftList } from "./workspace/WorkspaceDraftList";
import { WorkspaceDraftViewer } from "./workspace/WorkspaceDraftViewer";
import { createWorkspaceDrafts } from "./workspace/workspaceDrafts";
import { workspaceStyle } from "./workspace/workspaceStyles";

export function AiAssistantWorkspacePanel({
  documents,
  documentologItems,
  mailDrafts,
}: {
  documents: AiAssistantDocument[];
  documentologItems: AiAssistantDocumentologItem[];
  mailDrafts: AiAssistantMailDraft[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedBodies, setSavedBodies] = useState<Record<string, string>>({});
  const [editingBody, setEditingBody] = useState("");
  const [feedback, setFeedback] = useState("");
  const drafts = useMemo(
    () => createWorkspaceDrafts(documents, mailDrafts, documentologItems),
    [documents, documentologItems, mailDrafts],
  );
  const selectedDraft = drafts.find((draft) => draft.id === selectedId) ?? drafts[0];
  const persistedText = selectedDraft
    ? savedBodies[selectedDraft.id] ?? selectedDraft.body
    : "";
  const viewerText = selectedDraft
    ? editingId === selectedDraft.id
      ? editingBody
      : persistedText
    : "";
  const isEditing = Boolean(selectedDraft && editingId === selectedDraft.id);
  const hasUnsavedChanges = isEditing && editingBody !== persistedText;
  const hasSessionOnlyDrafts = Object.keys(savedBodies).length > 0;

  useEffect(() => {
    if (!hasUnsavedChanges && !hasSessionOnlyDrafts) return undefined;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasSessionOnlyDrafts, hasUnsavedChanges]);

  const startEdit = () => {
    if (!selectedDraft) return;
    setEditingId(selectedDraft.id);
    setEditingBody(persistedText);
    setFeedback("");
  };

  const saveDraft = () => {
    if (!selectedDraft) return;
    setSavedBodies((current) => ({
      ...current,
      [selectedDraft.id]: editingBody,
    }));
    setEditingId(null);
    setEditingBody("");
    setFeedback("Локальная версия сохранена только в текущем сеансе. Постоянное сохранение через backend еще не подключено.");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingBody("");
    setFeedback("Локальные правки отменены.");
  };

  const downloadDraft = () => {
    if (!selectedDraft) return;
    if (
      selectedDraft.status !== "approved"
      && !window.confirm("Черновик еще не согласован. Скачать локальную копию без отправки во внешний контур?")
    ) {
      return;
    }

    const blob = new Blob([viewerText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedDraft.title.replace(/[^\p{L}\p{N}]+/gu, "-") || "ai-draft"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const requestApproval = () => {
    if (!selectedDraft) return;
    setFeedback("Черновик только помечен для согласования в текущем сеансе. Серверная отправка в approval-flow еще не подключена.");
  };

  return (
    <section style={workspaceStyle}>
      <WorkspaceDraftList
        drafts={drafts}
        hasUnsavedChanges={hasUnsavedChanges}
        onResetSelectionState={() => {
          setEditingId(null);
          setEditingBody("");
          setFeedback("");
        }}
        onSelectDraft={setSelectedId}
        selectedDraftId={selectedDraft?.id}
      />
      <WorkspaceDraftViewer
        feedback={feedback}
        isEditing={isEditing}
        onCancelEdit={cancelEdit}
        onChangeText={setEditingBody}
        onDownload={downloadDraft}
        onRequestApproval={requestApproval}
        onSave={saveDraft}
        onStartEdit={startEdit}
        selectedDraft={selectedDraft}
        viewerText={viewerText}
      />
    </section>
  );
}
