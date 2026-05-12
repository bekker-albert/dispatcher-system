"use client";

import { useState } from "react";
import { Check, PencilLine, Plus, RotateCcw } from "lucide-react";
import Image from "next/image";

import { SidebarGroup } from "./SidebarGroup";
import { SidebarToggle } from "./SidebarToggle";
import {
  selectNavigationItem,
  selectNavigationTarget,
  type LegacyNavigationActions,
  type LegacyNavigationState,
} from "./navigationMapping";
import type { NavigationGroup, NavigationItem } from "./navigationModel";
import type { NavigationLabelOverrides } from "./navigationLabelOverrides";
import type { NavigationOrderOverrides } from "./navigationOrderOverrides";

type SidebarProps = {
  groups: NavigationGroup[];
  state: LegacyNavigationState;
  actions: LegacyNavigationActions;
  collapsed: boolean;
  canEditLabels: boolean;
  labelEditing: boolean;
  labelOverrides: NavigationLabelOverrides;
  orderOverrides: NavigationOrderOverrides;
  defaultLabelById: Record<string, string>;
  defaultOrderByParentId: Record<string, string[]>;
  onToggleCollapsed: () => void;
  onToggleLabelEditing: () => void;
  onSetLabelOverride: (id: string, value: string, defaultLabel: string) => void;
  onResetLabelOverride: (id: string) => void;
  onResetAllLabelOverrides: () => void;
  onAddCustomTab: (title: string) => void;
  onMoveNavigationItem: (parentId: string, draggedId: string, targetId: string, defaultIds: string[]) => void;
  onResetNavigationOrder: () => void;
  onCloseMobile: () => void;
};

export function Sidebar({
  groups,
  state,
  actions,
  collapsed,
  canEditLabels,
  labelEditing,
  labelOverrides,
  orderOverrides,
  defaultLabelById,
  defaultOrderByParentId,
  onToggleCollapsed,
  onToggleLabelEditing,
  onSetLabelOverride,
  onResetLabelOverride,
  onResetAllLabelOverrides,
  onAddCustomTab,
  onMoveNavigationItem,
  onResetNavigationOrder,
  onCloseMobile,
}: SidebarProps) {
  const [newCustomTabTitle, setNewCustomTabTitle] = useState("");

  function handleSelectItem(item: NavigationItem) {
    selectNavigationItem(item, actions);
    onCloseMobile();
  }

  function handleAddCustomTab() {
    const title = newCustomTabTitle.trim().replace(/\s+/g, " ");
    if (!title) return;

    onAddCustomTab(title.slice(0, 48));
    setNewCustomTabTitle("");
    onCloseMobile();
  }

  return (
    <aside className="erp-sidebar" aria-label="ERP navigation">
      <div className="erp-sidebar__brand">
        <div className="erp-sidebar__brand-mark" title="Dispatcher ERP">
          <Image className="erp-sidebar__brand-logo" src="/mining-logo.png" alt="AAM" width={34} height={34} />
        </div>
        <div className="erp-sidebar__brand-text">
          <div className="erp-sidebar__brand-title">AAM Dispatch</div>
          <div className="erp-sidebar__brand-subtitle">Dispatch ERP</div>
        </div>
      </div>
      <SidebarToggle collapsed={collapsed} floating onClick={onToggleCollapsed} />
      {canEditLabels ? (
        <div className="erp-sidebar__inline-editor">
          <button
            type="button"
            className="erp-sidebar__inline-editor-button"
            aria-pressed={labelEditing}
            onClick={onToggleLabelEditing}
            title={labelEditing ? "Завершить редактирование меню" : "Править меню"}
          >
            {labelEditing ? <Check size={15} aria-hidden /> : <PencilLine size={15} aria-hidden />}
            {!collapsed ? <span>{labelEditing ? "Готово" : "Править меню"}</span> : null}
          </button>
          {!collapsed && labelEditing ? (
            <button
              type="button"
              className="erp-sidebar__inline-editor-reset"
              title="Сбросить названия и порядок"
              onClick={() => {
                onResetAllLabelOverrides();
                onResetNavigationOrder();
              }}
            >
              <RotateCcw size={14} aria-hidden />
              <span>Сбросить</span>
            </button>
          ) : null}
          {!collapsed && labelEditing ? (
            <form
              className="erp-sidebar__add-tab"
              onSubmit={(event) => {
                event.preventDefault();
                handleAddCustomTab();
              }}
            >
              <input
                aria-label="Название новой вкладки"
                maxLength={48}
                placeholder="Новая вкладка"
                value={newCustomTabTitle}
                onChange={(event) => setNewCustomTabTitle(event.target.value)}
              />
              <button
                type="submit"
                disabled={!newCustomTabTitle.trim()}
                title="Добавить вкладку"
              >
                <Plus size={14} aria-hidden />
                <span>Добавить</span>
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
      <nav className="erp-sidebar__scroll">
        {groups.map((group) => (
          <SidebarGroup
            key={group.id}
            group={group}
            state={state}
            collapsed={collapsed}
            editing={canEditLabels && labelEditing}
            labelOverrides={labelOverrides}
            orderOverrides={orderOverrides}
            defaultLabelById={defaultLabelById}
            defaultOrderByParentId={defaultOrderByParentId}
            onSetLabelOverride={onSetLabelOverride}
            onResetLabelOverride={onResetLabelOverride}
            onMoveNavigationItem={onMoveNavigationItem}
            onSelectItem={handleSelectItem}
            onSelectTarget={(target) => {
              selectNavigationTarget(target, actions);
              onCloseMobile();
            }}
          />
        ))}
      </nav>
    </aside>
  );
}
