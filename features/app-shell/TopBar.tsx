"use client";

import { AuthSessionButton } from "@/features/auth/AuthSessionButton";

import { Breadcrumbs } from "./Breadcrumbs";
import { SidebarToggle } from "./SidebarToggle";
import type { NavigationTrail } from "./navigationMapping";

type TopBarProps = {
  activeReportCustomerCode?: string;
  trail: NavigationTrail;
  reportDate: string;
  onOpenMobileMenu: () => void;
  onSelectReportDate: (date: string) => void;
  onOpenProfile: () => void;
};

export function TopBar({
  activeReportCustomerCode,
  trail,
  reportDate,
  onOpenMobileMenu,
  onSelectReportDate,
  onOpenProfile,
}: TopBarProps) {
  return (
    <header className="erp-topbar no-print">
      <div className="erp-topbar__left">
        <SidebarToggle mobile onClick={onOpenMobileMenu} />
        <Breadcrumbs activeReportCustomerCode={activeReportCustomerCode} trail={trail} />
      </div>
      <div className="erp-topbar__right">
        <label className="erp-topbar__date">
          <span>Дата</span>
          <input
            type="date"
            value={reportDate}
            onChange={(event) => onSelectReportDate(event.target.value)}
          />
        </label>
        <AuthSessionButton onOpenProfile={onOpenProfile} />
      </div>
    </header>
  );
}
