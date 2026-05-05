export type StructureSection = "scheme" | "elements" | "links" | "roles" | "schedule";

export type AdminSection = "navigation" | "structure" | "ai" | "vehicles" | "reports" | "users" | "logs" | "database";

export type AdminReportCustomerSettingsTab = "order" | "display" | "rename" | "summary";

export const adminSectionTabs: Array<{ value: AdminSection; label: string }> = [
  { value: "navigation", label: "Вкладки" },
  { value: "structure", label: "Структура" },
  { value: "ai", label: "ИИ-сводка" },
  { value: "vehicles", label: "Техника" },
  { value: "reports", label: "Отчетность" },
  { value: "users", label: "Профиль" },
  { value: "logs", label: "Логи" },
];

export const structureSectionTabs: Array<{ value: StructureSection; label: string }> = [
  { value: "scheme", label: "Схема" },
  { value: "elements", label: "Элементы" },
  { value: "links", label: "Связи" },
  { value: "roles", label: "Роли" },
  { value: "schedule", label: "Распорядок" },
];
