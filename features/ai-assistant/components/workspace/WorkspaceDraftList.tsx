import { FileText, Mail, Send } from "lucide-react";

import { aiAssistantMutedTextStyle } from "@/features/ai-assistant/aiAssistantStyles";

import type { WorkspaceDraft } from "./workspaceDrafts";
import {
  draftButtonStyle,
  draftButtonsStyle,
  draftButtonTextStyle,
  draftButtonTitleStyle,
  draftListStyle,
  previewHintStyle,
  sectionTitleStyle,
} from "./workspaceStyles";

export function WorkspaceDraftList({
  drafts,
  hasUnsavedChanges,
  onResetSelectionState,
  onSelectDraft,
  selectedDraftId,
}: {
  drafts: WorkspaceDraft[];
  hasUnsavedChanges: boolean;
  onResetSelectionState: () => void;
  onSelectDraft: (draftId: string) => void;
  selectedDraftId?: string;
}) {
  return (
    <aside style={draftListStyle}>
      <div style={sectionTitleStyle}>Черновики</div>
      <div style={aiAssistantMutedTextStyle}>Документы, письма и Documentolog как рабочие материалы.</div>
      <div style={previewHintStyle}>Предпросмотр: локальное редактирование и пометки пока работают только в рамках текущего сеанса.</div>
      <div style={draftButtonsStyle}>
        {drafts.map((draft) => {
          const active = selectedDraftId === draft.id;
          const Icon = draft.kind === "mail" ? Mail : draft.kind === "documentolog" ? Send : FileText;

          return (
            <button
              key={draft.id}
              type="button"
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm("Есть несохраненные локальные правки. Открыть другой черновик и сбросить их?")) {
                  return;
                }

                onSelectDraft(draft.id);
                onResetSelectionState();
              }}
              style={{
                ...draftButtonStyle,
                borderColor: active ? "#0f172a" : "#dbe3ec",
                background: active ? "#f8fafc" : "#ffffff",
              }}
            >
              <Icon size={16} />
              <span style={draftButtonTextStyle}>
                <span style={draftButtonTitleStyle}>{draft.title}</span>
                <span style={aiAssistantMutedTextStyle}>{draft.subtitle}</span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
