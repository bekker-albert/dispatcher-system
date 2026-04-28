import type { CustomTab, TopTabDefinition } from "@/lib/domain/navigation/tabs";

export type AdminNavigationEditingTarget =
  | { type: "top"; id: TopTabDefinition["id"] }
  | { type: "custom"; id: string };

export type AdminNavigationRow = {
  key: string;
  editingTarget: AdminNavigationEditingTarget;
  label: string;
  typeLabel: string;
  statusLabel: string;
  visible: boolean;
  locked: boolean;
};

export function getAdminNavigationEditingKey(editing: AdminNavigationEditingTarget | null) {
  return editing ? `${editing.type}:${editing.id}` : "";
}

export function buildAdminNavigationRows(topTabs: TopTabDefinition[], customTabs: CustomTab[]) {
  const topRows: AdminNavigationRow[] = topTabs.map((tab) => ({
    key: `top:${tab.id}`,
    editingTarget: { type: "top", id: tab.id },
    label: tab.label,
    typeLabel: "Системная",
    statusLabel: tab.visible ? "Показывается" : "Скрыта",
    visible: tab.visible,
    locked: tab.locked ?? false,
  }));

  const customRows: AdminNavigationRow[] = customTabs.map((tab) => {
    const visible = tab.visible !== false;

    return {
      key: `custom:${tab.id}`,
      editingTarget: { type: "custom", id: tab.id },
      label: tab.title,
      typeLabel: "Добавленная",
      statusLabel: visible ? "Показывается" : "Скрыта",
      visible,
      locked: false,
    };
  });

  return [...topRows, ...customRows];
}
