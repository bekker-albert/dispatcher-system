import { Download, Pencil, Save, Send, X } from "lucide-react";

import { aiAssistantMutedTextStyle } from "@/features/ai-assistant/aiAssistantStyles";

import type { WorkspaceDraft } from "./workspaceDrafts";
import {
  emptyWorkspaceStyle,
  feedbackStyle,
  primaryViewerButtonStyle,
  sectionTitleStyle,
  viewerActionsStyle,
  viewerBodyStyle,
  viewerButtonStyle,
  viewerHeaderStyle,
  viewerStyle,
  viewerTextareaStyle,
} from "./workspaceStyles";

export function WorkspaceDraftViewer({
  feedback,
  isEditing,
  onCancelEdit,
  onChangeText,
  onDownload,
  onRequestApproval,
  onSave,
  onStartEdit,
  selectedDraft,
  viewerText,
}: {
  feedback: string;
  isEditing: boolean;
  onCancelEdit: () => void;
  onChangeText: (text: string) => void;
  onDownload: () => void;
  onRequestApproval: () => void;
  onSave: () => void;
  onStartEdit: () => void;
  selectedDraft?: WorkspaceDraft;
  viewerText: string;
}) {
  return (
    <article style={viewerStyle}>
      {selectedDraft ? (
        <>
          <div style={viewerHeaderStyle}>
            <div>
              <div style={sectionTitleStyle}>{selectedDraft.title}</div>
              <div style={aiAssistantMutedTextStyle}>{selectedDraft.subtitle}</div>
            </div>
            <div style={viewerActionsStyle}>
              <button type="button" onClick={onStartEdit} style={viewerButtonStyle}>
                <Pencil size={15} /> Редактировать
              </button>
              <button type="button" onClick={onSave} style={viewerButtonStyle} disabled={!isEditing}>
                <Save size={15} /> Сохранить локально
              </button>
              <button type="button" onClick={onCancelEdit} style={viewerButtonStyle} disabled={!isEditing}>
                <X size={15} /> Отменить правки
              </button>
              <button type="button" onClick={onDownload} style={viewerButtonStyle}>
                <Download size={15} /> Скачать
              </button>
              <button type="button" onClick={onRequestApproval} style={primaryViewerButtonStyle}>
                <Send size={15} /> Пометить для согласования
              </button>
            </div>
          </div>
          {isEditing ? (
            <textarea
              value={viewerText}
              onChange={(event) => onChangeText(event.target.value)}
              style={viewerTextareaStyle}
            />
          ) : (
            <div style={viewerBodyStyle}>{viewerText}</div>
          )}
          {feedback && <div style={feedbackStyle}>{feedback}</div>}
        </>
      ) : (
        <div style={emptyWorkspaceStyle}>Черновиков пока нет.</div>
      )}
    </article>
  );
}
