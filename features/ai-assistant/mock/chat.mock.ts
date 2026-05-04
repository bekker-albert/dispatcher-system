import type { AiAssistantChatMessage } from "@/features/ai-assistant/types";

export const aiAssistantChatMessagesMock: AiAssistantChatMessage[] = [
    {
      id: "chat-001",
      role: "system",
      author: "Система",
      text: "Чат используется для вопросов, анализа и подготовки черновиков. Критические действия автоматически попадают во вкладку Задачи.",
      createdAt: "2026-04-24T15:05:00.000Z",
    },
    {
      id: "chat-002",
      role: "user",
      author: "Начальник диспетчерской службы",
      text: "Проверь причину невыполнения суточного плана по Аксу и подготовь формулировку.",
      createdAt: "2026-04-24T15:15:00.000Z",
      linkedTaskId: "ai-task-001",
    },
    {
      id: "chat-003",
      role: "assistant",
      author: "AI-ассистент",
      text: "Найдено отставание. Я подготовил черновик причины и поместил действие в Задачи, потому что текст пойдет в официальный отчет.",
      createdAt: "2026-04-24T15:20:00.000Z",
      linkedTaskId: "ai-task-001",
    },
  ];
