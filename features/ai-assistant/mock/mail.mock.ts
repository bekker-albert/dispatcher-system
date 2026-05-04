import type { AiAssistantMailItem, AiAssistantMailDraft } from "@/features/ai-assistant/types";

export const aiAssistantMailItemsMock: AiAssistantMailItem[] = [
    {
      id: "mail-gps-source",
      from: "gps@qaztrucks.example",
      to: ["dispatcher@aam-dispatch.kz"],
      subject: "GPS по технике",
      bodyPreview: "Просим подтвердить список техники для проверки GPS.",
      receivedAt: "2026-04-24T12:40:00.000Z",
      linkedTaskId: "ai-task-005",
    },
  ];

export const aiAssistantMailDraftsMock: AiAssistantMailDraft[] = [
    {
      id: "mail-draft-gps",
      to: ["gps@qaztrucks.example"],
      cc: [],
      subject: "Проверка GPS по технике подрядчика",
      body: "Просим проверить GPS на закрепленной технике и подтвердить восстановление сигнала.",
      status: "needs-approval",
      linkedTaskId: "ai-task-005",
      linkedApprovalId: "approval-005",
      updatedAt: "2026-04-24T13:52:00.000Z",
    },
  ];
