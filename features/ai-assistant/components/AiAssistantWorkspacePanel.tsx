"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Download, FileText, Mail, Pencil, Save, Send } from "lucide-react";

import type {
  AiAssistantDocument,
  AiAssistantDocumentologItem,
  AiAssistantMailDraft,
} from "@/features/ai-assistant/types";
import { aiAssistantMutedTextStyle, aiAssistantPanelStyle } from "@/features/ai-assistant/aiAssistantStyles";

type WorkspaceDraft = {
  body: string;
  id: string;
  kind: "document" | "mail" | "documentolog";
  status: string;
  subtitle: string;
  title: string;
};

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
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const drafts = useMemo(
    () => createWorkspaceDrafts(documents, mailDrafts, documentologItems),
    [documents, documentologItems, mailDrafts],
  );
  const selectedDraft = drafts.find((draft) => draft.id === selectedId) ?? drafts[0];
  const viewerText = selectedDraft
    ? editedBodies[selectedDraft.id] ?? selectedDraft.body
    : "";
  const isEditing = Boolean(selectedDraft && editingId === selectedDraft.id);

  const startEdit = () => {
    if (!selectedDraft) return;
    setEditingId(selectedDraft.id);
    setEditedBodies((current) => ({
      ...current,
      [selectedDraft.id]: viewerText,
    }));
    setFeedback("");
  };

  const saveDraft = () => {
    if (!selectedDraft) return;
    setEditingId(null);
    setFeedback("Локальная версия сохранена только в текущем сеансе. Постоянное сохранение через backend еще не подключено.");
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
      <aside style={draftListStyle}>
        <div style={sectionTitleStyle}>Черновики</div>
        <div style={aiAssistantMutedTextStyle}>Документы, письма и Documentolog как рабочие материалы.</div>
        <div style={previewHintStyle}>Предпросмотр: локальное редактирование и пометки пока работают только в рамках текущего сеанса.</div>
        <div style={draftButtonsStyle}>
          {drafts.map((draft) => {
            const active = selectedDraft?.id === draft.id;
            const Icon = draft.kind === "mail" ? Mail : draft.kind === "documentolog" ? Send : FileText;

            return (
              <button
                key={draft.id}
                type="button"
                onClick={() => {
                  setSelectedId(draft.id);
                  setEditingId(null);
                  setFeedback("");
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

      <article style={viewerStyle}>
        {selectedDraft ? (
          <>
            <div style={viewerHeaderStyle}>
              <div>
                <div style={sectionTitleStyle}>{selectedDraft.title}</div>
                <div style={aiAssistantMutedTextStyle}>{selectedDraft.subtitle}</div>
              </div>
              <div style={viewerActionsStyle}>
                <button type="button" onClick={startEdit} style={viewerButtonStyle}>
                  <Pencil size={15} /> Редактировать
                </button>
                <button type="button" onClick={saveDraft} style={viewerButtonStyle} disabled={!isEditing}>
                  <Save size={15} /> Сохранить локально
                </button>
                <button type="button" onClick={downloadDraft} style={viewerButtonStyle}>
                  <Download size={15} /> Скачать
                </button>
                <button type="button" onClick={requestApproval} style={primaryViewerButtonStyle}>
                  <Send size={15} /> Пометить для согласования
                </button>
              </div>
            </div>
            {isEditing ? (
              <textarea
                value={viewerText}
                onChange={(event) => setEditedBodies((current) => ({
                  ...current,
                  [selectedDraft.id]: event.target.value,
                }))}
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
    </section>
  );
}

function createWorkspaceDrafts(
  documents: AiAssistantDocument[],
  mailDrafts: AiAssistantMailDraft[],
  documentologItems: AiAssistantDocumentologItem[],
): WorkspaceDraft[] {
  return [
    ...documents.map((document) => ({
      body: [
        document.title,
        "",
        `Тип: ${formatDocumentType(document.type)}`,
        `Статус: ${formatDocumentStatus(document.status)}`,
        document.linkedApprovalId ? `Согласование: ${document.linkedApprovalId}` : "",
        document.linkedTaskId ? `Задача: ${document.linkedTaskId}` : "",
      ].filter(Boolean).join("\n"),
      id: document.id,
      kind: "document" as const,
      status: document.status,
      subtitle: formatDocumentStatus(document.status),
      title: document.title,
    })),
    ...mailDrafts.map((draft) => ({
      body: [
        `Кому: ${draft.to.join(", ")}`,
        draft.cc.length > 0 ? `Копия: ${draft.cc.join(", ")}` : "",
        `Тема: ${draft.subject}`,
        "",
        draft.body,
      ].filter(Boolean).join("\n"),
      id: draft.id,
      kind: "mail" as const,
      status: draft.status,
      subtitle: formatMailStatus(draft.status),
      title: draft.subject,
    })),
    ...documentologItems.map((item) => ({
      body: [
        item.title,
        "",
        item.externalId ? `Documentolog: ${item.externalId}` : "",
        item.approver ? `Согласующий: ${item.approver}` : "",
        item.comment ? `Комментарий: ${item.comment}` : "",
      ].filter(Boolean).join("\n"),
      id: item.id,
      kind: "documentolog" as const,
      status: item.status,
      subtitle: formatDocumentologStatus(item.status),
      title: item.title,
    })),
  ];
}

function formatDocumentStatus(status: AiAssistantDocument["status"]) {
  const labels: Record<AiAssistantDocument["status"], string> = {
    draft: "Черновик",
    review: "На проверке",
    approved: "Согласовано",
    "sent-to-documentolog": "Передано в Documentolog",
    signing: "На подписании",
    signed: "Подписано",
    rejected: "Отклонено",
    archive: "Архив",
  };

  return labels[status];
}

function formatDocumentType(type: AiAssistantDocument["type"]) {
  const labels: Record<AiAssistantDocument["type"], string> = {
    memo: "Служебная записка",
    "business-trip": "Командировка",
    letter: "Письмо",
    report: "Отчет",
    explanation: "Объяснительная",
    template: "Шаблон",
    other: "Документ",
  };

  return labels[type];
}

function formatMailStatus(status: AiAssistantMailDraft["status"]) {
  const labels: Record<AiAssistantMailDraft["status"], string> = {
    draft: "Черновик",
    "needs-approval": "Нужно решение",
    approved: "Согласовано",
    sent: "Отправлено",
    rejected: "Отклонено",
  };

  return labels[status];
}

function formatDocumentologStatus(status: AiAssistantDocumentologItem["status"]) {
  const labels: Record<AiAssistantDocumentologItem["status"], string> = {
    prepared: "Подготовлено",
    sent: "Отправлено",
    "in-approval": "На согласовании",
    approved: "Согласовано",
    rejected: "Отклонено",
    "needs-rework": "На доработке",
  };

  return labels[status];
}

const workspaceStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 10,
};

const draftListStyle: CSSProperties = {
  ...aiAssistantPanelStyle,
  minHeight: 0,
};

const sectionTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 17,
  fontWeight: 900,
};

const draftButtonsStyle: CSSProperties = {
  display: "grid",
  gap: 7,
  marginTop: 10,
};

const previewHintStyle: CSSProperties = {
  marginTop: 8,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#475569",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const draftButtonStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: 8,
  alignItems: "start",
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  padding: 9,
  color: "#0f172a",
  textAlign: "left",
  cursor: "pointer",
};

const draftButtonTextStyle: CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

const draftButtonTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
};

const viewerStyle: CSSProperties = {
  ...aiAssistantPanelStyle,
  minHeight: 420,
  display: "grid",
  gridTemplateRows: "auto minmax(220px, 1fr) auto",
  gap: 10,
};

const viewerHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "start",
};

const viewerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  justifyContent: "flex-end",
};

const viewerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: "7px 9px",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const primaryViewerButtonStyle: CSSProperties = {
  ...viewerButtonStyle,
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const viewerBodyStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: 14,
  whiteSpace: "pre-wrap",
  overflow: "auto",
  lineHeight: 1.55,
};

const viewerTextareaStyle: CSSProperties = {
  ...viewerBodyStyle,
  width: "100%",
  resize: "vertical",
  font: "inherit",
  outline: "none",
};

const feedbackStyle: CSSProperties = {
  border: "1px solid #fde68a",
  borderRadius: 8,
  background: "#fffbeb",
  color: "#92400e",
  padding: 8,
  fontSize: 12,
  fontWeight: 800,
};

const emptyWorkspaceStyle: CSSProperties = {
  ...aiAssistantMutedTextStyle,
  alignSelf: "center",
  justifySelf: "center",
};
