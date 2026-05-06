"use client";

import { useEffect, useMemo, type Dispatch, type SetStateAction } from "react";

import type {
  AiAssistantDocument,
  AiAssistantDocumentologItem,
  AiAssistantMailDraft,
} from "@/features/ai-assistant/types";
import type { AiAssistantWorkspaceSessionState } from "@/features/ai-assistant/lib/workspaceSessionState";
import { WorkspaceDraftList } from "./workspace/WorkspaceDraftList";
import { WorkspaceDraftViewer } from "./workspace/WorkspaceDraftViewer";
import { createWorkspaceDrafts } from "./workspace/workspaceDrafts";
import { workspaceStyle } from "./workspace/workspaceStyles";

export function AiAssistantWorkspacePanel({
  documents,
  documentologItems,
  mailDrafts,
  onSessionStateChange,
  sessionState,
}: {
  documents: AiAssistantDocument[];
  documentologItems: AiAssistantDocumentologItem[];
  mailDrafts: AiAssistantMailDraft[];
  onSessionStateChange: Dispatch<SetStateAction<AiAssistantWorkspaceSessionState>>;
  sessionState: AiAssistantWorkspaceSessionState;
}) {
  const drafts = useMemo(
    () => createWorkspaceDrafts(documents, mailDrafts, documentologItems),
    [documents, documentologItems, mailDrafts],
  );
  const { editingBody, editingId, feedback, savedBodies, selectedId } = sessionState;
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

  const updateSessionState = (patch: Partial<AiAssistantWorkspaceSessionState>) => {
    onSessionStateChange((current) => ({ ...current, ...patch }));
  };

  useEffect(() => {
    if (!hasUnsavedChanges && !hasSessionOnlyDrafts) return undefined;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasSessionOnlyDrafts, hasUnsavedChanges]);

  const startEdit = () => {
    if (!selectedDraft) return;
    if (editingId === selectedDraft.id) return;
    updateSessionState({
      editingBody: persistedText,
      editingId: selectedDraft.id,
      feedback: "",
    });
  };

  const saveDraft = () => {
    if (!selectedDraft) return;
    onSessionStateChange((current) => ({
      ...current,
      editingBody: "",
      editingId: null,
      feedback: "Локальная версия сохранена только в текущем сеансе. Постоянное сохранение через backend еще не подключено.",
      savedBodies: {
        ...current.savedBodies,
        [selectedDraft.id]: current.editingBody,
      },
    }));
  };

  const cancelEdit = () => {
    updateSessionState({
      editingBody: "",
      editingId: null,
      feedback: "Локальные правки отменены.",
    });
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
    updateSessionState({
      feedback: "Черновик только помечен для согласования в текущем сеансе. Серверная отправка в approval-flow еще не подключена.",
    });
  };

  return (
    <section style={workspaceStyle}>
      <WorkspaceDraftList
        drafts={drafts}
        hasUnsavedChanges={hasUnsavedChanges}
        onResetSelectionState={() => {
          updateSessionState({
            editingBody: "",
            editingId: null,
            feedback: "",
          });
        }}
        onSelectDraft={(nextSelectedId) => updateSessionState({ selectedId: nextSelectedId })}
        selectedDraftId={selectedDraft?.id}
      />
      <WorkspaceDraftViewer
        feedback={feedback}
        isEditing={isEditing}
        onCancelEdit={cancelEdit}
        onChangeText={(text) => updateSessionState({ editingBody: text })}
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
