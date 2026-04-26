import { useState } from "react";

import {
  customTabKey,
  defaultTopTabs,
  type CustomTab,
  type EditableSubtabGroup,
  type SubTabConfig,
  type TopTab,
  type TopTabDefinition,
} from "@/lib/domain/navigation/tabs";
import { createId } from "@/lib/utils/id";

type UseAppTabsStateOptions = {
  defaultSubTabs: Record<EditableSubtabGroup, SubTabConfig[]>;
};

export function useAppTabsState({ defaultSubTabs }: UseAppTabsStateOptions) {
  const [topTab, setTopTab] = useState<TopTab>("reports");
  const [topTabs, setTopTabs] = useState<TopTabDefinition[]>(defaultTopTabs);
  const [subTabs, setSubTabs] = useState<Record<EditableSubtabGroup, SubTabConfig[]>>(defaultSubTabs);
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);

  function addCustomTab(title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const nextTab: CustomTab = {
      id: createId(),
      title: trimmedTitle,
      description: "",
      items: [],
      visible: true,
    };

    setCustomTabs((current) => [...current, nextTab]);
    setTopTab(customTabKey(nextTab.id));
  }

  function updateTopTabLabel(id: TopTabDefinition["id"], label: string) {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, label: trimmedLabel } : tab)),
    );
  }

  function deleteTopTab(id: TopTabDefinition["id"]) {
    const tab = topTabs.find((item) => item.id === id);
    if (!tab || tab.locked) return;
    if (!window.confirm(`Удалить вкладку "${tab.label}"? Она будет скрыта, при необходимости ее можно вернуть.`)) return;

    setTopTabs((current) =>
      current.map((item) => (item.id === id ? { ...item, visible: false } : item)),
    );

    if (topTab === id) {
      setTopTab("admin");
    }
  }

  function showTopTab(id: TopTabDefinition["id"]) {
    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, visible: true } : tab)),
    );
  }

  function updateCustomTabTitle(id: string, title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setCustomTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, title: trimmedTitle } : tab)),
    );
  }

  function showCustomTab(id: string) {
    setCustomTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, visible: true } : tab)),
    );
  }

  function deleteCustomTab(id: string) {
    const tab = customTabs.find((item) => item.id === id);
    if (!tab) return;
    if (!window.confirm(`Удалить вкладку "${tab.title}"?`)) return;

    setCustomTabs((current) => current.filter((item) => item.id !== id));
    if (topTab === customTabKey(id)) {
      setTopTab("admin");
    }
  }

  return {
    topTab,
    setTopTab,
    topTabs,
    setTopTabs,
    subTabs,
    setSubTabs,
    customTabs,
    setCustomTabs,
    addCustomTab,
    updateTopTabLabel,
    deleteTopTab,
    showTopTab,
    updateCustomTabTitle,
    showCustomTab,
    deleteCustomTab,
  };
}
