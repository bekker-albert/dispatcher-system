"use client";

import {
  BarChart3,
  Bot,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Fuel,
  LayoutDashboard,
  RadioTower,
  Settings,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

import {
  isNavigationGroupActive,
  isNavigationItemActive,
  type LegacyNavigationState,
} from "./navigationMapping";
import type { NavigationGroup, NavigationItem, NavigationTarget } from "./navigationModel";
import type { NavigationLabelOverrides } from "./navigationLabelOverrides";
import type { NavigationOrderOverrides } from "./navigationOrderOverrides";
import { SidebarItem } from "./SidebarItem";
import { useSidebarGroupExpansion } from "./useSidebarGroupExpansion";

type SidebarGroupProps = {
  group: NavigationGroup;
  state: LegacyNavigationState;
  collapsed: boolean;
  editing: boolean;
  labelOverrides: NavigationLabelOverrides;
  orderOverrides: NavigationOrderOverrides;
  defaultLabelById: Record<string, string>;
  defaultOrderByParentId: Record<string, string[]>;
  onSetLabelOverride: (id: string, value: string, defaultLabel: string) => void;
  onResetLabelOverride: (id: string) => void;
  onMoveNavigationItem: (parentId: string, draggedId: string, targetId: string, defaultIds: string[]) => void;
  onSelectItem: (item: NavigationItem) => void;
  onSelectTarget: (target: NavigationTarget | undefined) => void;
};

const iconMap: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "radio-tower": RadioTower,
  "clipboard-list": ClipboardList,
  truck: Truck,
  fuel: Fuel,
  "shield-check": ShieldCheck,
  "briefcase-business": Briefcase,
  "bar-chart-3": BarChart3,
  bot: Bot,
  settings: Settings,
};

export function SidebarGroup({
  group,
  state,
  collapsed,
  editing,
  labelOverrides,
  orderOverrides,
  defaultLabelById,
  defaultOrderByParentId,
  onSetLabelOverride,
  onResetLabelOverride,
  onMoveNavigationItem,
  onSelectItem,
  onSelectTarget,
}: SidebarGroupProps) {
  const active = isNavigationGroupActive(group, state);
  const { expanded, setExpanded, toggleExpanded } = useSidebarGroupExpansion(group.id, active);
  const Icon = iconMap[group.icon] ?? LayoutDashboard;
  const hasItems = group.items.length > 0;

  return (
    <div className="erp-sidebar-group">
      <div className="erp-sidebar-group__header">
        <button
          type="button"
          className="erp-sidebar-group__button"
          data-active={active}
          title={group.label}
          onClick={() => {
            if (editing) return;
            if (!hasItems) {
              onSelectTarget(group.defaultTarget);
              return;
            }
            if (collapsed) {
              onSelectTarget(group.defaultTarget);
              return;
            }
            if (!active && group.defaultTarget) {
              onSelectTarget(group.defaultTarget);
              setExpanded(true);
              return;
            }
            toggleExpanded();
          }}
        >
          <Icon size={18} strokeWidth={2} />
          <span className="erp-sidebar-group__label">
            {editing && !collapsed ? (
              <InlineNavigationLabelInput
                id={group.id}
                label={group.label}
                defaultLabel={defaultLabelById[group.id] ?? group.label}
                hasOverride={Boolean(labelOverrides[group.id])}
                onSetLabel={onSetLabelOverride}
                onResetLabel={onResetLabelOverride}
              />
            ) : group.label}
          </span>
        </button>
        {hasItems ? (
          <button
            type="button"
            className="erp-sidebar-group__chevron"
            data-active={active}
            aria-label={`${expanded ? "Свернуть" : "Развернуть"} ${group.label}`}
            title={`${expanded ? "Свернуть" : "Развернуть"} ${group.label}`}
            onClick={(event) => {
              event.stopPropagation();
              if (editing) return;
              toggleExpanded();
            }}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : null}
      </div>
      {!collapsed && expanded && hasItems && (
        <div className="erp-sidebar-group__items">
          {group.items.map((item) => (
            <div key={item.id}>
              <SidebarItem
                item={item}
                active={isNavigationItemActive(item, state)}
                parentId={group.id}
                editing={editing}
                labelOverrides={labelOverrides}
                orderOverrides={orderOverrides}
                defaultLabel={defaultLabelById[item.id] ?? item.label}
                defaultOrderIds={defaultOrderByParentId[group.id] ?? group.items.map((candidate) => candidate.id)}
                onSetLabelOverride={onSetLabelOverride}
                onResetLabelOverride={onResetLabelOverride}
                onMoveNavigationItem={onMoveNavigationItem}
                onSelect={onSelectItem}
              />
              {item.children && (
                <div className="erp-sidebar-group__items">
                  {item.children.map((child) => (
                    <SidebarItem
                      key={child.id}
                      item={child}
                      active={isNavigationItemActive(child, state)}
                      depth={1}
                      parentId={item.id}
                      editing={editing}
                      labelOverrides={labelOverrides}
                      orderOverrides={orderOverrides}
                      defaultLabel={defaultLabelById[child.id] ?? child.label}
                      defaultOrderIds={defaultOrderByParentId[item.id] ?? item.children?.map((candidate) => candidate.id) ?? []}
                      onSetLabelOverride={onSetLabelOverride}
                      onResetLabelOverride={onResetLabelOverride}
                      onMoveNavigationItem={onMoveNavigationItem}
                      onSelect={onSelectItem}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineNavigationLabelInput({
  id,
  label,
  defaultLabel,
  hasOverride,
  onSetLabel,
  onResetLabel,
}: {
  id: string;
  label: string;
  defaultLabel: string;
  hasOverride: boolean;
  onSetLabel: (id: string, value: string, defaultLabel: string) => void;
  onResetLabel: (id: string) => void;
}) {
  return (
    <span className="erp-sidebar-inline-label" onClick={(event) => event.stopPropagation()}>
      <input
        value={label}
        maxLength={48}
        onChange={(event) => onSetLabel(id, event.target.value, defaultLabel)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      {hasOverride ? (
        <button type="button" onClick={() => onResetLabel(id)} title="Сбросить название">
          ×
        </button>
      ) : null}
    </span>
  );
}
