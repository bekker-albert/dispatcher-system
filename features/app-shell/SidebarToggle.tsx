"use client";

import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

type SidebarToggleProps = {
  collapsed?: boolean;
  floating?: boolean;
  mobile?: boolean;
  onClick: () => void;
};

export function SidebarToggle({ collapsed = false, floating = false, mobile = false, onClick }: SidebarToggleProps) {
  const Icon = mobile ? Menu : collapsed ? ChevronRight : ChevronLeft;
  const label = mobile ? "Открыть меню" : collapsed ? "Развернуть меню" : "Свернуть меню";

  return (
    <button
      type="button"
      className={floating ? "erp-icon-button erp-sidebar__toggle" : "erp-icon-button"}
      aria-label={label}
      title={label}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}
