import type { AdminSection } from "@/lib/domain/admin/navigation";
import type { DispatchDailyReportTab } from "@/lib/domain/dispatch/summary";
import type { TopTab } from "@/lib/domain/navigation/tabs";

export type NavigationStatus = "production" | "preview" | "planned";

export type NavigationTarget = {
  topTab: TopTab;
  dispatchTab?: string;
  dispatchDailyReportTab?: DispatchDailyReportTab;
  ptoTab?: string;
  adminSection?: AdminSection;
  fleetTab?: string;
  fuelTab?: string;
  tbTab?: string;
  contractorTab?: string;
  reportCustomerId?: string;
};

export type NavigationItem = {
  id: string;
  label: string;
  status: NavigationStatus;
  target?: NavigationTarget;
  children?: NavigationItem[];
};

export type NavigationGroup = {
  id: string;
  label: string;
  icon: string;
  defaultTarget?: NavigationTarget;
  items: NavigationItem[];
};

export const erpNavigationModel: NavigationGroup[] = [
  {
    id: "main",
    label: "Главная",
    icon: "layout-dashboard",
    defaultTarget: { topTab: "home" },
    items: [
      { id: "main-analytics", label: "Аналитика", status: "planned" },
      { id: "main-notifications", label: "Уведомления", status: "planned" },
      { id: "main-tasks", label: "Задачи", status: "planned" },
    ],
  },
  {
    id: "dispatch",
    label: "Горная",
    icon: "radio-tower",
    defaultTarget: { topTab: "dispatch", dispatchTab: "daily" },
    items: [
      { id: "dispatch-daily-volumes", label: "Суточные объемы", status: "preview", target: { topTab: "dispatch", dispatchTab: "daily", dispatchDailyReportTab: "volumes" } },
      { id: "dispatch-daily-report", label: "Суточный отчет", status: "preview", target: { topTab: "dispatch", dispatchTab: "daily", dispatchDailyReportTab: "summary" } },
      { id: "dispatch-day", label: "День", status: "preview", target: { topTab: "dispatch", dispatchTab: "day" } },
      { id: "dispatch-night", label: "Ночь", status: "preview", target: { topTab: "dispatch", dispatchTab: "night" } },
    ],
  },
  {
    id: "pto",
    label: "ПТО",
    icon: "clipboard-list",
    defaultTarget: { topTab: "pto" },
    items: [],
  },
  {
    id: "fleet",
    label: "Техника",
    icon: "truck",
    defaultTarget: { topTab: "fleet" },
    items: [
      { id: "fleet-directory", label: "Справочник техники", status: "production", target: { topTab: "fleet", fleetTab: "directory" } },
      { id: "fleet-placement", label: "Расстановка техники", status: "preview", target: { topTab: "fleet", fleetTab: "placement" } },
      { id: "fleet-movement", label: "Перемещение техники", status: "planned" },
      { id: "fleet-history", label: "История техники", status: "planned" },
      { id: "fleet-documents", label: "Документы техники", status: "planned" },
    ],
  },
  {
    id: "fuel",
    label: "Топливо",
    icon: "fuel",
    defaultTarget: { topTab: "fuel", fuelTab: "general" },
    items: [
      { id: "tax-waybills", label: "Путевые", status: "planned" },
      { id: "fuel-overview", label: "Топливо", status: "preview", target: { topTab: "fuel", fuelTab: "general" } },
      { id: "fuel-issue", label: "Выдача", status: "planned" },
      { id: "fuel-consumption", label: "Расход", status: "planned" },
      { id: "fuel-debts", label: "Долги", status: "planned" },
      { id: "fuel-acts", label: "Акты", status: "planned" },
    ],
  },
  {
    id: "gps-safety",
    label: "GPS / ТБ",
    icon: "shield-check",
    defaultTarget: { topTab: "tb", tbTab: "list" },
    items: [
      { id: "gps-monitoring", label: "GPS", status: "preview", target: { topTab: "tb", tbTab: "list" } },
      { id: "gps-wialon", label: "Wialon", status: "planned" },
      { id: "smts", label: "СМТС", status: "preview", target: { topTab: "tb", tbTab: "list" } },
      { id: "dut", label: "ДУТ", status: "planned" },
      { id: "safe-driving", label: "Вождение", status: "preview", target: { topTab: "tb", tbTab: "driving" } },
      { id: "safety-violations", label: "Нарушения", status: "planned" },
      { id: "safety-reports", label: "Отчеты ТБ", status: "preview", target: { topTab: "tb", tbTab: "contractors" } },
    ],
  },
  {
    id: "contractors",
    label: "Договоры",
    icon: "briefcase-business",
    defaultTarget: { topTab: "contractors" },
    items: [
      { id: "contractors-list", label: "Подрядчики", status: "preview", target: { topTab: "contractors" } },
      { id: "contracts", label: "Договоры", status: "planned" },
      { id: "rent-terms", label: "Аренда", status: "planned" },
      { id: "downtime-responsibility", label: "Простои", status: "planned" },
      { id: "contract-fuel", label: "Топливо", status: "planned" },
      { id: "reconciliation-acts", label: "Сверки", status: "planned" },
    ],
  },
  {
    id: "reports",
    label: "Отчеты",
    icon: "bar-chart-3",
    defaultTarget: { topTab: "reports" },
    items: [],
  },
  {
    id: "ai-assistant",
    label: "AI",
    icon: "bot",
    defaultTarget: { topTab: "ai-assistant" },
    items: [
      { id: "ai-inbox", label: "Задачи", status: "preview", target: { topTab: "ai-assistant" } },
      { id: "ai-drafts", label: "Черновики", status: "planned" },
      { id: "ai-approvals", label: "Согласования", status: "planned" },
      { id: "ai-actions", label: "Журнал", status: "planned" },
      { id: "ai-settings", label: "Настройки", status: "planned" },
      { id: "ai-system-ideas", label: "Идеи", status: "planned" },
    ],
  },
  {
    id: "admin",
    label: "Админка",
    icon: "settings",
    defaultTarget: { topTab: "admin", adminSection: "users" },
    items: [
      { id: "admin-users", label: "Пользователи", status: "production", target: { topTab: "admin", adminSection: "users" } },
      { id: "admin-access", label: "Роли", status: "preview", target: { topTab: "admin", adminSection: "access" } },
      { id: "admin-sections", label: "Участки", status: "planned", target: { topTab: "admin", adminSection: "structure" } },
      { id: "admin-directories", label: "Справочники", status: "preview", target: { topTab: "admin", adminSection: "structure" } },
      { id: "admin-database", label: "База данных", status: "production", target: { topTab: "admin", adminSection: "database" } },
      {
        id: "admin-integrations",
        label: "Интеграции",
        status: "preview",
        target: { topTab: "admin", adminSection: "wialon" },
        children: [
          { id: "admin-wialon", label: "Wialon Local", status: "preview", target: { topTab: "admin", adminSection: "wialon" } },
        ],
      },
      { id: "admin-logs", label: "Журнал", status: "production", target: { topTab: "admin", adminSection: "logs" } },
      { id: "admin-settings", label: "Настройки", status: "preview", target: { topTab: "admin", adminSection: "navigation" } },
    ],
  },
];
