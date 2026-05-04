import type { AiAssistantWhatsAppGroup, AiAssistantWhatsAppMessageCandidate } from "@/features/ai-assistant/types";

export const aiAssistantWhatsAppGroupsMock: AiAssistantWhatsAppGroup[] = [
    {
      id: "wa-group-dispatch-work",
      title: "ДС / рабочая",
      status: "planned",
      canRead: true,
      canWrite: false,
      writeMode: "approval-required",
      description: "Рабочая группа для поручений, сменных вопросов и быстрых уведомлений.",
      updatedAt: "2026-04-24T14:00:00.000Z",
    },
  ];

export const aiAssistantWhatsAppMessageCandidatesMock: AiAssistantWhatsAppMessageCandidate[] = [
    {
      id: "wa-candidate-balkhash-trip",
      groupId: "wa-group-dispatch-work",
      author: "Руководитель проекта",
      messageText: "Нужно ехать на Балхаш завтра утром",
      detectedIntent: "trip",
      confidence: 0.82,
      suggestedAction: "Возможная командировка на Балхаш",
      linkedTaskId: "ai-task-004",
      approvalRequired: true,
      status: "needs-approval",
      createdAt: "2026-04-24T09:05:00.000Z",
    },
  ];
