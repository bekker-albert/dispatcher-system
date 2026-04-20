import { isRecord, mergeDefaultsById } from "../../utils/normalizers";

export type BaseTopTab =
  | "reports"
  | "dispatch"
  | "fleet"
  | "contractors"
  | "fuel"
  | "pto"
  | "tb"
  | "user"
  | "admin";

export type TopTab = BaseTopTab | `custom:${string}`;

export type TopTabDefinition = {
  id: BaseTopTab;
  label: string;
  visible: boolean;
  locked?: boolean;
};

export type EditableSubtabGroup = "reports" | "dispatch" | "fleet" | "contractors" | "fuel" | "pto" | "tb";

export type SubTabConfig = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  builtIn?: boolean;
  content?: string;
};

export type NewSubTabForm = {
  group: EditableSubtabGroup;
  label: string;
  content: string;
};

export type CustomTab = {
  id: string;
  title: string;
  description: string;
  items: string[];
  visible?: boolean;
};

export const defaultCustomTabForm = {
  title: "",
  description: "",
};

export const defaultTopTabs: TopTabDefinition[] = [
  { id: "reports", label: "Отчетность", visible: true },
  { id: "dispatch", label: "Сводка", visible: true },
  { id: "fleet", label: "Техника", visible: true },
  { id: "contractors", label: "Подрядчики", visible: true },
  { id: "fuel", label: "Топливо", visible: true },
  { id: "pto", label: "ПТО", visible: true },
  { id: "tb", label: "ТБ", visible: true },
  { id: "user", label: "Профиль", visible: true },
  { id: "admin", label: "Админка", visible: true, locked: true },
];

export const subtabGroupLabels: Record<EditableSubtabGroup, string> = {
  reports: "Отчетность",
  dispatch: "Диспетчерская сводка",
  fleet: "Список техники",
  contractors: "Подрядчики",
  fuel: "Топливо",
  pto: "ПТО",
  tb: "ТБ",
};

export function createDefaultSubTabs(contractorNames: string[]): Record<EditableSubtabGroup, SubTabConfig[]> {
  return {
    reports: [
      { id: "reports-all", label: "Все участки", value: "Все участки", visible: true, builtIn: true },
      { id: "reports-aksu", label: "Аксу", value: "Аксу", visible: true, builtIn: true },
      { id: "reports-akbakai", label: "Акбакай", value: "Акбакай", visible: true, builtIn: true },
      { id: "reports-zholymbet", label: "Жолымбет", value: "Жолымбет", visible: true, builtIn: true },
    ],
    dispatch: [
      { id: "dispatch-daily", label: "Сутки", value: "daily", visible: true, builtIn: true },
      { id: "dispatch-night", label: "Ночь", value: "night", visible: true, builtIn: true },
      { id: "dispatch-day", label: "День", value: "day", visible: true, builtIn: true },
    ],
    fleet: [
      { id: "fleet-all", label: "Все", value: "all", visible: true, builtIn: true },
      { id: "fleet-rent", label: "Аренда", value: "rent", visible: true, builtIn: true },
      { id: "fleet-work", label: "Работа", value: "work", visible: true, builtIn: true },
      { id: "fleet-idle", label: "Простой", value: "idle", visible: true, builtIn: true },
      { id: "fleet-repair", label: "Ремонт", value: "repair", visible: true, builtIn: true },
      { id: "fleet-free", label: "Свободна", value: "free", visible: true, builtIn: true },
    ],
    contractors: contractorNames.map((name) => ({
      id: `contractors-${name}`,
      label: name,
      value: name,
      visible: true,
      builtIn: true,
    })),
    fuel: [
      { id: "fuel-general", label: "Общая", value: "general", visible: true, builtIn: true },
      { id: "fuel-contractors", label: "Подрядчики", value: "contractors", visible: true, builtIn: true },
    ],
    pto: [
      { id: "pto-bodies", label: "Кузова", value: "bodies", visible: true, builtIn: true },
      { id: "pto-performance", label: "Произв.", value: "performance", visible: true, builtIn: true },
      { id: "pto-cycle", label: "Цикл", value: "cycle", visible: true, builtIn: true },
      { id: "pto-buckets", label: "Ковши", value: "buckets", visible: true, builtIn: true },
      { id: "pto-plan", label: "План", value: "plan", visible: true, builtIn: true },
      { id: "pto-oper", label: "Оперучет", value: "oper", visible: true, builtIn: true },
      { id: "pto-survey", label: "Замер", value: "survey", visible: true, builtIn: true },
    ],
    tb: [
      { id: "tb-list", label: "Техника", value: "list", visible: true, builtIn: true },
      { id: "tb-driving", label: "Вождение", value: "driving", visible: true, builtIn: true },
      { id: "tb-contractors", label: "Подрядчики", value: "contractors", visible: true, builtIn: true },
    ],
  };
}

export function normalizeStoredTopTabs(value: unknown) {
  if (!Array.isArray(value)) return defaultTopTabs;

  const defaultById = new Map(defaultTopTabs.map((tab) => [tab.id, tab]));
  const normalized = value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== "string") return [];

    const defaultTab = defaultById.get(item.id as BaseTopTab);
    if (!defaultTab) return [];

    return [{
      ...defaultTab,
      label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : defaultTab.label,
      visible: defaultTab.locked ? true : item.visible !== false,
    }];
  });

  return mergeDefaultsById(normalized, defaultTopTabs);
}

export function normalizeStoredSubTabs(
  value: unknown,
  defaultSubTabs: Record<EditableSubtabGroup, SubTabConfig[]>,
): Record<EditableSubtabGroup, SubTabConfig[]> {
  const stored = isRecord(value) ? value : {};
  const groups = Object.keys(defaultSubTabs) as EditableSubtabGroup[];

  return groups.reduce((result, group) => {
    const storedGroup = stored[group];
    const normalizedGroup = Array.isArray(storedGroup)
      ? storedGroup.flatMap((item) => {
        if (!isRecord(item) || typeof item.id !== "string") return [];

        return [{
          id: item.id,
          label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : "Подвкладка",
          value: typeof item.value === "string" && item.value.trim() ? item.value.trim() : item.id,
          visible: item.visible !== false,
          builtIn: item.builtIn === true,
          content: typeof item.content === "string" ? item.content : undefined,
        }];
      })
      : [];

    return {
      ...result,
      [group]: mergeDefaultsById(normalizedGroup, defaultSubTabs[group]),
    };
  }, {} as Record<EditableSubtabGroup, SubTabConfig[]>);
}

export function normalizeStoredCustomTabs(value: unknown): CustomTab[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((tab): CustomTab[] => {
    if (!isRecord(tab) || typeof tab.id !== "string" || typeof tab.title !== "string") return [];

    const title = tab.title.trim();
    if (!title) return [];

    return [{
      id: tab.id,
      title,
      description: typeof tab.description === "string" ? tab.description.trim() : "",
      items: Array.isArray(tab.items) ? tab.items.filter((item): item is string => typeof item === "string") : [],
      visible: tab.visible !== false,
    }];
  });
}

export function customTabKey(id: string): TopTab {
  return `custom:${id}`;
}

export function compactTopTabLabel(tab: TopTabDefinition) {
  const labels: Partial<Record<BaseTopTab, Record<string, string>>> = {
    reports: { "Отчетность": "Отчетность" },
    dispatch: { "Диспетчерская сводка": "Сводка" },
    contractors: { "Действующие подрядчики": "Подрядчики" },
    user: { "Пользователь": "Профиль" },
  };

  return labels[tab.id]?.[tab.label] ?? tab.label;
}

export function compactSubTabLabel(group: EditableSubtabGroup, tab: SubTabConfig) {
  const labels: Partial<Record<EditableSubtabGroup, Record<string, string>>> = {
    reports: { "Все участки": "Все", "ТОО AA Mining": "AA Mining", "АО АК Алтыналмас": "Алтыналмас", "ТОО AA Engineering": "AA Eng." },
    fleet: { "Общий список": "Все", "В аренде": "Аренда", "В работе": "Работа", "В простое": "Простой", "В ремонте": "Ремонт", "Не задействована": "Свободна" },
    fuel: { "Подрядчики": "Подряд." },
    pto: {
      "Замеры кузовов": "Кузова",
      "Расчет производительности": "Произв.",
      "Цикл погрузки": "Цикл",
      "Объемы ковшей": "Ковши",
      "Оперучет": "Оперучет",
      "Маркшейдерский замер": "Замер",
    },
    tb: { "Список техники": "Техника", "Качество вождения": "Вождение" },
  };

  return labels[group]?.[tab.label] ?? tab.label;
}
