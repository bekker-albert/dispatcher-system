import type { TopTab } from "@/lib/domain/navigation/tabs";

export type AiAssistantRuntimeContextInput = {
  adminSection?: string;
  dispatchTab?: string;
  ptoTab?: string;
  reportCustomerLabel?: string;
  topTab: TopTab;
  workDate: string;
};

export type AiAssistantRuntimeContext = {
  detailLabel?: string;
  quickActions: string[];
  sectionKey: string;
  sectionLabel: string;
  suggestions: string[];
  workDate: string;
};

export const defaultAiAssistantRuntimeContext: AiAssistantRuntimeContext = {
  sectionKey: "workspace",
  sectionLabel: "Рабочий раздел",
  workDate: "2026-04-24",
  quickActions: [
    "Создать задачу",
    "Подготовить сообщение",
    "Найти проблему",
  ],
  suggestions: [
    "Проверь, что требует решения",
    "Покажи черновики на сегодня",
    "Составь короткий список действий",
  ],
};

export function createAiAssistantRuntimeContext({
  adminSection,
  dispatchTab,
  ptoTab,
  reportCustomerLabel,
  topTab,
  workDate,
}: AiAssistantRuntimeContextInput): AiAssistantRuntimeContext {
  const base = runtimeContextByTopTab(topTab);
  const detailLabel = resolveRuntimeContextDetail({
    adminSection,
    dispatchTab,
    ptoTab,
    reportCustomerLabel,
    topTab,
  });

  return {
    ...base,
    detailLabel,
    workDate,
  };
}

function runtimeContextByTopTab(topTab: TopTab): Omit<AiAssistantRuntimeContext, "detailLabel" | "workDate"> {
  if (topTab.startsWith("custom:")) {
    return {
      sectionKey: "custom",
      sectionLabel: "Рабочая вкладка",
      quickActions: ["Составить задачу", "Подготовить заметку", "Собрать вопросы"],
      suggestions: ["Проверь незавершенные действия", "Сформируй краткое резюме", "Подготовь список уточнений"],
    };
  }

  const contexts: Record<string, Omit<AiAssistantRuntimeContext, "detailLabel" | "workDate">> = {
    reports: {
      sectionKey: "reports",
      sectionLabel: "Отчетность",
      quickActions: ["Проверить отклонения", "Подготовить причину", "Открыть черновики"],
      suggestions: ["Найди минусовые отклонения", "Собери причины для отчета", "Подготовь короткий комментарий заказчику"],
    },
    dispatch: {
      sectionKey: "dispatch",
      sectionLabel: "Сводка",
      quickActions: ["Собрать итоги смены", "Найти простои", "Создать поручение"],
      suggestions: ["Проверь незаполненные события", "Собери простои за смену", "Подготовь сводку для руководителя"],
    },
    fleet: {
      sectionKey: "fleet",
      sectionLabel: "Техника",
      quickActions: ["Проверить ремонты", "Найти простой", "Подготовить список техники"],
      suggestions: ["Покажи технику в ремонте", "Найди технику без статуса", "Подготовь список на смену"],
    },
    contractors: {
      sectionKey: "contractors",
      sectionLabel: "Подрядчики",
      quickActions: ["Подготовить сообщение", "Проверить GPS", "Создать задачу"],
      suggestions: ["Составь сообщение подрядчику", "Проверь готовность техники", "Собери вопросы подрядчику"],
    },
    fuel: {
      sectionKey: "fuel",
      sectionLabel: "Топливо",
      quickActions: ["Проверить расход", "Подготовить сверку", "Создать замечание"],
      suggestions: ["Проверь отклонения по топливу", "Подготовь основу акта сверки", "Найди подозрительные записи"],
    },
    pto: {
      sectionKey: "pto",
      sectionLabel: "ПТО",
      quickActions: ["Проверить план/факт", "Найти пустые строки", "Подготовить Excel"],
      suggestions: ["Проверь строки без факта", "Найди расхождения плана и замера", "Подготовь список проблемных работ"],
    },
    tb: {
      sectionKey: "safety",
      sectionLabel: "ТБ",
      quickActions: ["Проверить нарушения", "Подготовить уведомление", "Создать задачу"],
      suggestions: ["Покажи рисковые события", "Собери замечания по вождению", "Подготовь сообщение ответственному"],
    },
    "ai-assistant": {
      sectionKey: "ai-assistant",
      sectionLabel: "AI Center",
      quickActions: ["Показать входящие", "Открыть черновики", "Проверить историю"],
      suggestions: ["Покажи задачи на сегодня", "Покажи черновики", "Проверь, что ждет решения"],
    },
    user: {
      sectionKey: "user",
      sectionLabel: "Профиль",
      quickActions: ["Показать задачи", "Показать черновики", "Проверить уведомления"],
      suggestions: ["Покажи мои решения", "Покажи последние действия", "Проверь мои черновики"],
    },
    admin: {
      sectionKey: "admin",
      sectionLabel: "Админка",
      quickActions: ["Проверить настройки", "Найти ошибки", "Открыть историю"],
      suggestions: ["Проверь настройки AI", "Покажи последние изменения", "Найди слабые места конфигурации"],
    },
  };

  return contexts[topTab] ?? defaultAiAssistantRuntimeContext;
}

function resolveRuntimeContextDetail({
  adminSection,
  dispatchTab,
  ptoTab,
  reportCustomerLabel,
  topTab,
}: Omit<AiAssistantRuntimeContextInput, "workDate">) {
  if (topTab === "reports") return reportCustomerLabel;
  if (topTab === "pto") return formatKnownDetail(ptoTab, ptoTabLabels);
  if (topTab === "dispatch") return formatKnownDetail(dispatchTab, dispatchTabLabels);
  if (topTab === "admin") return formatKnownDetail(adminSection, adminSectionLabels);

  return undefined;
}

function formatKnownDetail(value: string | undefined, labels: Record<string, string>) {
  if (!value) return undefined;
  return labels[value] ?? value;
}

const ptoTabLabels: Record<string, string> = {
  bodies: "Кузова",
  performance: "Производительность",
  cycle: "Цикл",
  buckets: "Ковши",
  plan: "План",
  oper: "Оперучет",
  survey: "Замер",
};

const dispatchTabLabels: Record<string, string> = {
  daily: "Сутки",
  night: "Ночь",
  day: "День",
};

const adminSectionLabels: Record<string, string> = {
  vehicles: "Техника",
  reports: "Отчетность",
  database: "База данных",
  logs: "Логи",
};
