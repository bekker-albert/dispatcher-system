"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { AppHeaderProps } from "@/components/layout/AppHeader";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAuth } from "@/features/auth/AuthContext";

import { appShellCss } from "./appShellStyles";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import {
  attachReportCustomerNavigationItems,
  createCustomNavigationItems,
  createNavigationTrail,
  getVisibleNavigationGroups,
  type LegacyNavigationActions,
  type LegacyNavigationState,
} from "./navigationMapping";
import { erpNavigationModel, type NavigationGroup } from "./navigationModel";
import {
  applyNavigationLabelOverrides,
  canEditNavigationLabels,
  flattenNavigationLabelEntries,
} from "./navigationLabelOverrides";
import {
  applyNavigationOrderOverrides,
  createNavigationDefaultOrder,
} from "./navigationOrderOverrides";
import { useNavigationLabelOverrides } from "./useNavigationLabelOverrides";
import { useNavigationOrderOverrides } from "./useNavigationOrderOverrides";
import { useSidebarState } from "./useSidebarState";

type AppShellProps = {
  appHeaderProps: AppHeaderProps;
  appState: AppStateBundle;
  databaseConfigured: boolean;
  children: ReactNode;
};

function appendCustomTabs(groups: NavigationGroup[], appHeaderProps: AppHeaderProps): NavigationGroup[] {
  const customItems = createCustomNavigationItems(appHeaderProps.customTabs);
  if (customItems.length === 0) return groups;

  return [
    ...groups,
    {
      id: "custom-tabs",
      label: "Пользовательские вкладки",
      icon: "layout-dashboard",
      items: customItems,
    },
  ];
}

export function AppShell({
  appHeaderProps,
  appState,
  databaseConfigured,
  children,
}: AppShellProps) {
  const { user } = useAuth();
  const sidebar = useSidebarState();
  const labelOverrides = useNavigationLabelOverrides();
  const orderOverrides = useNavigationOrderOverrides();
  const [labelEditing, setLabelEditing] = useState(false);
  const navigationState: LegacyNavigationState = {
    topTab: appHeaderProps.topTab,
    dispatchTab: appHeaderProps.dispatchTab,
    dispatchDailyReportTab: appState.dispatchDailyReportTab,
    ptoTab: appHeaderProps.ptoTab,
    adminSection: appHeaderProps.adminSection,
    fleetTab: appState.fleetTab,
    fuelTab: appState.fuelTab,
    tbTab: appState.tbTab,
    contractorTab: appState.contractorTab,
    reportCustomerId: appHeaderProps.reportCustomerId,
  };
  const navigationActions: LegacyNavigationActions = {
    onSelectTopTab: appHeaderProps.onSelectTopTab,
    onSelectDispatchTab: appHeaderProps.onSelectDispatchTab,
    onSelectDispatchDailyReportTab: appState.setDispatchDailyReportTab,
    onSelectPtoTab: appHeaderProps.onSelectPtoTab,
    onSelectAdminSection: appHeaderProps.onSelectAdminSection,
    onSelectFleetTab: appState.setFleetTab,
    onSelectFuelTab: appState.setFuelTab,
    onSelectTbTab: appState.setTbTab,
    onSelectContractorTab: appState.setContractorTab,
    onSelectReportCustomer: appHeaderProps.onSelectReportCustomer,
  };
  const baseNavigationGroups = useMemo(() => {
    const visibleGroups = getVisibleNavigationGroups(erpNavigationModel, appHeaderProps.topTabs, user);
    const groupsWithReports = attachReportCustomerNavigationItems(visibleGroups, appHeaderProps.reportCustomers);
    return appendCustomTabs(groupsWithReports, appHeaderProps);
  }, [appHeaderProps, user]);
  const navigationGroups = useMemo(() => (
    applyNavigationLabelOverrides(
      applyNavigationOrderOverrides(baseNavigationGroups, orderOverrides.overrides),
      labelOverrides.overrides,
    )
  ), [baseNavigationGroups, labelOverrides.overrides, orderOverrides.overrides]);
  const defaultLabelById = useMemo(() => (
    Object.fromEntries(flattenNavigationLabelEntries(baseNavigationGroups).map((entry) => [entry.id, entry.defaultLabel]))
  ), [baseNavigationGroups]);
  const defaultOrderByParentId = useMemo(() => createNavigationDefaultOrder(baseNavigationGroups), [baseNavigationGroups]);
  const trail = createNavigationTrail(navigationGroups, navigationState);
  const activeReportCustomerCode = appHeaderProps.reportCustomers.find(
    (customer) => customer.id === appHeaderProps.reportCustomerId,
  )?.ptoCode;

  return (
    <div
      className="erp-shell"
      data-collapsed={sidebar.collapsed}
      data-database-configured={databaseConfigured ? "true" : "false"}
      data-mobile-open={sidebar.mobileOpen}
    >
      <style>{appShellCss}</style>
      <Sidebar
        groups={navigationGroups}
        state={navigationState}
        actions={navigationActions}
        collapsed={sidebar.collapsed}
        canEditLabels={canEditNavigationLabels(user)}
        labelEditing={labelEditing}
        labelOverrides={labelOverrides.overrides}
        orderOverrides={orderOverrides.overrides}
        defaultLabelById={defaultLabelById}
        defaultOrderByParentId={defaultOrderByParentId}
        onToggleCollapsed={sidebar.toggleCollapsed}
        onToggleLabelEditing={() => setLabelEditing((current) => !current)}
        onSetLabelOverride={labelOverrides.setLabelOverride}
        onResetLabelOverride={labelOverrides.resetLabelOverride}
        onResetAllLabelOverrides={labelOverrides.resetAllLabelOverrides}
        onAddCustomTab={appState.addCustomTab}
        onMoveNavigationItem={orderOverrides.moveItem}
        onResetNavigationOrder={orderOverrides.resetAllOrderOverrides}
        onCloseMobile={sidebar.closeMobile}
      />
      <button
        type="button"
        className="erp-mobile-backdrop"
        aria-label="Закрыть меню"
        onClick={sidebar.closeMobile}
      />
      <main className="erp-main">
        <TopBar
          activeReportCustomerCode={activeReportCustomerCode}
          trail={trail}
          reportDate={appHeaderProps.reportDate}
          onOpenMobileMenu={sidebar.openMobile}
          onSelectReportDate={appHeaderProps.onSelectReportDate}
          onOpenProfile={() => {
            appHeaderProps.onSelectAdminSection("users");
            appHeaderProps.onSelectTopTab("admin");
          }}
        />
        <section className="erp-content">
          {children}
        </section>
      </main>
    </div>
  );
}
