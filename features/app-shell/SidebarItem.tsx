"use client";

import { Clock3, Eye } from "lucide-react";

import type { NavigationItem } from "./navigationModel";
import type { NavigationLabelOverrides } from "./navigationLabelOverrides";
import type { NavigationOrderOverrides } from "./navigationOrderOverrides";

type SidebarItemProps = {
  item: NavigationItem;
  active: boolean;
  depth?: number;
  collapsed?: boolean;
  parentId: string;
  editing: boolean;
  labelOverrides: NavigationLabelOverrides;
  orderOverrides: NavigationOrderOverrides;
  defaultLabel: string;
  defaultOrderIds: string[];
  onSetLabelOverride: (id: string, value: string, defaultLabel: string) => void;
  onResetLabelOverride: (id: string) => void;
  onMoveNavigationItem: (parentId: string, draggedId: string, targetId: string, defaultIds: string[]) => void;
  onSelect: (item: NavigationItem) => void;
};

function statusLabel(status: NavigationItem["status"]) {
  if (status === "preview") return "Preview";
  if (status === "planned") return "Planned";
  return "";
}

function StatusIcon({ status }: { status: Exclude<NavigationItem["status"], "production"> }) {
  const label = statusLabel(status);

  return (
    <span className="erp-sidebar-item__badge" data-status={status} title={label} aria-label={label}>
      {status === "preview" ? <Eye size={12} aria-hidden /> : <Clock3 size={12} aria-hidden />}
    </span>
  );
}

export function SidebarItem({
  item,
  active,
  depth = 0,
  collapsed = false,
  parentId,
  editing,
  labelOverrides,
  orderOverrides,
  defaultLabel,
  defaultOrderIds,
  onSetLabelOverride,
  onResetLabelOverride,
  onMoveNavigationItem,
  onSelect,
}: SidebarItemProps) {
  const hasChildren = Boolean(item.children?.length);
  const disabled = !item.target && !hasChildren;
  const title = disabled ? `${item.label}: в разработке` : item.label;
  const orderChanged = Boolean(orderOverrides[parentId]);

  return (
    <button
      type="button"
      className="erp-sidebar-item"
      aria-disabled={disabled}
      data-active={active}
      data-disabled={disabled}
      data-editing={editing}
      draggable={editing && !collapsed}
      title={title}
      style={{ paddingLeft: collapsed ? undefined : 9 + depth * 12 }}
      onDragStart={(event) => {
        if (!editing) return;
        event.dataTransfer.setData("text/plain", `${parentId}:${item.id}`);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (editing) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!editing) return;
        event.preventDefault();

        const [dragParentId, draggedId] = event.dataTransfer.getData("text/plain").split(":");
        if (dragParentId !== parentId || !draggedId) return;
        onMoveNavigationItem(parentId, draggedId, item.id, defaultOrderIds);
      }}
      onClick={() => {
        if (editing) return;
        if (!disabled) onSelect(item);
      }}
    >
      <span className="erp-sidebar-item__label">
        {editing && !collapsed ? (
          <InlineNavigationItemLabel
            id={item.id}
            label={item.label}
            defaultLabel={defaultLabel}
            hasOverride={Boolean(labelOverrides[item.id])}
            orderChanged={orderChanged}
            onSetLabel={onSetLabelOverride}
            onResetLabel={onResetLabelOverride}
          />
        ) : item.label}
      </span>
      {item.status !== "production" ? <StatusIcon status={item.status} /> : null}
    </button>
  );
}

function InlineNavigationItemLabel({
  id,
  label,
  defaultLabel,
  hasOverride,
  orderChanged,
  onSetLabel,
  onResetLabel,
}: {
  id: string;
  label: string;
  defaultLabel: string;
  hasOverride: boolean;
  orderChanged: boolean;
  onSetLabel: (id: string, value: string, defaultLabel: string) => void;
  onResetLabel: (id: string) => void;
}) {
  return (
    <span className="erp-sidebar-inline-label" onClick={(event) => event.stopPropagation()}>
      <span className="erp-sidebar-inline-label__handle" title="Перетащить внутри группы">
        {orderChanged ? "↕" : "⋮"}
      </span>
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
