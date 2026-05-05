"use client";

import type {
  AiAssistantDocument,
  AiAssistantDocumentologItem,
  AiAssistantMailDraft,
} from "@/features/ai-assistant/types";

const draftDocumentStatuses = new Set<AiAssistantDocument["status"]>(["draft"]);
const draftMailStatuses = new Set<AiAssistantMailDraft["status"]>(["draft"]);
const draftDocumentologStatuses = new Set<AiAssistantDocumentologItem["status"]>([
  "prepared",
  "needs-rework",
]);

export type DraftCardItem = {
  id: string;
  title: string;
  status: string;
  kind: "document" | "mail" | "message";
  updatedAt: string;
};

export function createDraftCards(
  documents: AiAssistantDocument[],
  mailDrafts: AiAssistantMailDraft[],
  documentologItems: AiAssistantDocumentologItem[],
): DraftCardItem[] {
  return [
    ...documents.filter((document) => draftDocumentStatuses.has(document.status)).map((document) => ({
      id: document.id,
      title: document.title,
      status: document.status,
      kind: "document" as const,
      updatedAt: document.updatedAt,
    })),
    ...mailDrafts.filter((draft) => draftMailStatuses.has(draft.status)).map((draft) => ({
      id: draft.id,
      title: draft.subject,
      status: draft.status,
      kind: "mail" as const,
      updatedAt: draft.updatedAt,
    })),
    ...documentologItems.filter((item) => draftDocumentologStatuses.has(item.status)).map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      kind: "document" as const,
      updatedAt: item.updatedAt,
    })),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
