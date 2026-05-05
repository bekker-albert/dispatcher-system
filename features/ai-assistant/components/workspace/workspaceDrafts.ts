import type {
  AiAssistantDocument,
  AiAssistantDocumentologItem,
  AiAssistantMailDraft,
} from "@/features/ai-assistant/types";

export type WorkspaceDraft = {
  body: string;
  id: string;
  kind: "document" | "mail" | "documentolog";
  status: string;
  subtitle: string;
  title: string;
};

export function createWorkspaceDrafts(
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
