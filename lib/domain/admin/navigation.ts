export type StructureSection = "scheme" | "elements" | "links" | "roles" | "schedule";

export type AdminSection = "menu" | "subtabs" | "structure" | "ai" | "vehicles" | "reports" | "logs" | "database";

export type AdminReportCustomerSettingsTab = "display" | "rename" | "summary";

export const adminSectionTabs: Array<{ value: AdminSection; label: string }> = [
  { value: "menu", label: "Вкладки" },
  { value: "structure", label: "Структура" },
  { value: "ai", label: "ИИ-сводка" },
  { value: "vehicles", label: "Техника" },
  { value: "reports", label: "Отчетность" },
  { value: "logs", label: "Логи" },
];

export const structureSectionTabs: Array<{ value: StructureSection; label: string }> = [
  { value: "scheme", label: "Схема" },
  { value: "elements", label: "Элементы" },
  { value: "links", label: "Связи" },
  { value: "roles", label: "Роли" },
  { value: "schedule", label: "Распорядок" },
];
