import type { TopTab } from "@/lib/domain/navigation/tabs";

export type DispatchWorkspaceId =
  | "home"
  | "mining-dispatch"
  | "taxation"
  | "smts-gps"
  | "fleet"
  | "common-processes"
  | "reports"
  | "admin"
  | "ai-assistant";

export type WorkspaceStatus = "active" | "scaffold" | "planned";

export type DispatchWorkspaceDefinition = {
  id: DispatchWorkspaceId;
  title: string;
  shortTitle: string;
  topTab: TopTab;
  status: WorkspaceStatus;
  purpose: string;
  currentModules: string[];
  futureModules: string[];
  performanceRule: string;
};

export type WorkspaceSubdomainRoute = {
  host: string;
  workspaceId: DispatchWorkspaceId;
  topTab: TopTab;
};

export type LegacyWorkspaceTopTabBridge = {
  topTab: TopTab;
  workspaceId: DispatchWorkspaceId;
  reason: string;
};

export const dispatchServiceWorkspaces: DispatchWorkspaceDefinition[] = [
  {
    id: "home",
    title: "Главная",
    shortTitle: "Главная",
    topTab: "home",
    status: "scaffold",
    purpose: "Единая точка входа в рабочие зоны диспетчерской службы без загрузки тяжелых таблиц.",
    currentModules: ["features/app/AppRoot.tsx", "features/app/AppPrimaryContent.tsx"],
    futureModules: ["оперативная сводка по доступным рабочим зонам", "напоминания", "состояние сдачи документов"],
    performanceRule: "Главная показывает только легкие статусы и ссылки, а данные модулей грузятся после перехода.",
  },
  {
    id: "mining-dispatch",
    title: "Горная диспетчеризация",
    shortTitle: "Горная ДС",
    topTab: "dispatch",
    status: "active",
    purpose: "Сменные сводки участков, консолидация день/ночь/сутки, оперучет и причины отклонений.",
    currentModules: ["features/dispatch", "features/pto", "features/reports"],
    futureModules: ["сменные сводки участка", "звенья экскаватор + самосвалы", "GPS-сверка", "маркшейдерский корректирующий слой"],
    performanceRule: "Сводки открываются по дате, участку и смене; отчеты строятся из подготовленных агрегатов.",
  },
  {
    id: "taxation",
    title: "Таксировка",
    shortTitle: "Таксировка",
    topTab: "fuel",
    status: "scaffold",
    purpose: "Путевые листы, закрепления, ходатайства, заправочные ведомости и учет топлива по периодам 1С.",
    currentModules: ["features/fuel", "lib/domain/reference/defaults.ts"],
    futureModules: ["пакетная выдача путевых листов", "временные закрепления", "периоды 01-15 и 16-30/31", "акты сверки топлива"],
    performanceRule: "Путевые листы и топливо сохраняются патчами, списки работают через серверную пагинацию.",
  },
  {
    id: "smts-gps",
    title: "СМТС / GPS",
    shortTitle: "СМТС / GPS",
    topTab: "tb",
    status: "scaffold",
    purpose: "Мониторинг техники, терминалы, SIM-карты, ДУТ, экодрайвинг, сливы топлива и доступы подрядчиков.",
    currentModules: ["features/safety-driving"],
    futureModules: ["карточка СМТС", "терминалы", "SIM-карты", "монтажи", "экодрайвинг", "события сливов"],
    performanceRule: "GPS/Wialon данные запрашиваются только по выбранному периоду, участку и технике.",
  },
  {
    id: "fleet",
    title: "Техника",
    shortTitle: "Техника",
    topTab: "fleet",
    status: "active",
    purpose: "Карточки техники, текущий участок, ремонты, перемещения и служебный автомобиль.",
    currentModules: ["features/fleet", "features/admin/vehicles", "lib/domain/vehicles"],
    futureModules: ["документ перемещения техники", "история участков", "ТО/страховка/резина/ремонты служебного автомобиля"],
    performanceRule: "Карточки техники открываются постранично, история перемещений хранится отдельными событиями.",
  },
  {
    id: "common-processes",
    title: "Общие процессы",
    shortTitle: "Общие процессы",
    topTab: "common",
    status: "planned",
    purpose: "Переработки, совмещение, командировки, согласования, документы, напоминания и журнал событий.",
    currentModules: ["features/admin/structure", "features/ai-assistant/components/tasks"],
    futureModules: ["переработки", "командировки", "сверхурочные", "работа за вакансию", "общие согласования"],
    performanceRule: "Процессы открываются по статусу, периоду и ответственному; вложения и печатные формы создаются по запросу.",
  },
  {
    id: "reports",
    title: "Отчеты",
    shortTitle: "Отчеты",
    topTab: "reports",
    status: "active",
    purpose: "План/факт, причины отклонений, контроль выполнения и печатные формы.",
    currentModules: ["features/reports", "lib/domain/reports"],
    futureModules: ["агрегаты по вахте", "контроль таксировки", "СМТС-отчеты", "экспорт PDF/Excel по запросу"],
    performanceRule: "Отчеты считают ограниченные периоды и переиспользуют индексы/агрегаты вместо пересчета всего массива.",
  },
  {
    id: "admin",
    title: "Администрирование",
    shortTitle: "Админ",
    topTab: "admin",
    status: "active",
    purpose: "Пользователи, видимость вкладок, справочники, структура, логи и состояние data layer.",
    currentModules: ["features/admin", "features/users", "lib/domain/auth"],
    futureModules: ["матрица user/role/section/workspace", "аудит прав", "справочники участков и подразделений"],
    performanceRule: "Админка не грузит производственные таблицы без перехода в конкретный раздел.",
  },
  {
    id: "ai-assistant",
    title: "AI-ассистент",
    shortTitle: "AI",
    topTab: "ai-assistant",
    status: "active",
    purpose: "Подсказки, задачи, документы и интеграции, работающие по запросу пользователя или событию.",
    currentModules: ["features/ai-assistant", "lib/domain/ai-assistant"],
    futureModules: ["контекстные подсказки по рабочим зонам", "проверка документов", "черновики сообщений"],
    performanceRule: "AI не анализирует все данные в фоне; он получает ограниченный runtime context и запускается по запросу.",
  },
];

export const workspaceSubdomainRoutes: WorkspaceSubdomainRoute[] = [
  { host: "gd.aam-dispatch.kz", workspaceId: "mining-dispatch", topTab: "dispatch" },
  { host: "dt.aam-dispatch.kz", workspaceId: "taxation", topTab: "fuel" },
  { host: "smts.aam-dispatch.kz", workspaceId: "smts-gps", topTab: "tb" },
  { host: "pto.aam-dispatch.kz", workspaceId: "mining-dispatch", topTab: "pto" },
  { host: "reports.aam-dispatch.kz", workspaceId: "reports", topTab: "reports" },
  { host: "admin.aam-dispatch.kz", workspaceId: "admin", topTab: "admin" },
];

export const legacyWorkspaceTopTabBridges: LegacyWorkspaceTopTabBridge[] = [
  {
    topTab: "pto",
    workspaceId: "mining-dispatch",
    reason: "Current PТО screens stay as a visible legacy tab while plans, operational accounting, and survey layers move under mining dispatch architecture.",
  },
  {
    topTab: "contractors",
    workspaceId: "taxation",
    reason: "Current contractor screens stay visible while contractor fuel acts, reconciliations, debts, and supplier checks are prepared under taxation architecture.",
  },
];

export function getWorkspaceByTopTab(topTab: TopTab) {
  return dispatchServiceWorkspaces.find((workspace) => workspace.topTab === topTab);
}

export function getWorkspaceById(id: DispatchWorkspaceId) {
  return dispatchServiceWorkspaces.find((workspace) => workspace.id === id);
}

export function getLegacyWorkspaceTopTabBridge(topTab: TopTab) {
  return legacyWorkspaceTopTabBridges.find((bridge) => bridge.topTab === topTab);
}
