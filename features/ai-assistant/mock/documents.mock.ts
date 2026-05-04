import type { AiAssistantDocument, AiAssistantDocumentTemplate } from "@/features/ai-assistant/types";

export const aiAssistantDocumentsMock: AiAssistantDocument[] = [
    {
      id: "doc-trip-balkhash",
      title: "Служебная записка на командировку",
      type: "business-trip",
      status: "review",
      linkedTaskId: "ai-task-004",
      linkedApprovalId: "approval-004",
      documentologId: "doclog-trip-balkhash",
      updatedAt: "2026-04-24T09:30:00.000Z",
    },
  ];

export const aiAssistantDocumentTemplatesMock: AiAssistantDocumentTemplate[] = [
    {
      id: "template-business-trip",
      title: "Служебная записка на командировку",
      documentType: "business-trip",
      description: "Шаблон для подготовки командировки после подтверждения пользователем.",
      owner: "Администрация",
      updatedAt: "2026-04-20T08:00:00.000Z",
    },
  ];
