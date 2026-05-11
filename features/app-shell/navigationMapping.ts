import { canAuthUserViewTab, type AuthUser } from "@/lib/domain/auth/types";
import type { AdminSection } from "@/lib/domain/admin/navigation";
import { customTabKey, type CustomTab, type TopTab, type TopTabDefinition } from "@/lib/domain/navigation/tabs";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";

import type { NavigationGroup, NavigationItem, NavigationTarget } from "./navigationModel";

export type LegacyNavigationState = {
  topTab: TopTab;
  dispatchTab: string;
  ptoTab: string;
  adminSection: AdminSection;
  fleetTab: string;
  fuelTab: string;
  tbTab: string;
  contractorTab: string;
  reportCustomerId: string;
};

export type LegacyNavigationActions = {
  onSelectTopTab: (tab: TopTab) => void;
  onSelectDispatchTab: (tab: string) => void;
  onSelectPtoTab: (tab: string) => void;
  onSelectAdminSection: (section: AdminSection) => void;
  onSelectFleetTab: (tab: string) => void;
  onSelectFuelTab: (tab: string) => void;
  onSelectTbTab: (tab: string) => void;
  onSelectContractorTab: (tab: string) => void;
  onSelectReportCustomer: (customerId: string) => void;
};

export type NavigationTrail = {
  workspace: string;
  workspaceId?: string;
  item?: string;
  itemId?: string;
  child?: string;
  childId?: string;
  status?: string;
};

function targetTopTab(target?: NavigationTarget) {
  return target?.topTab;
}

function isTargetAllowed(
  target: NavigationTarget | undefined,
  topTabs: TopTabDefinition[],
  user: AuthUser,
) {
  const topTab = targetTopTab(target);
  if (!topTab) return true;
  if (typeof topTab === "string" && topTab.startsWith("custom:")) return true;

  const tab = topTabs.find((item) => item.id === topTab);
  return Boolean(tab?.visible && canAuthUserViewTab(user, tab.id));
}

function filterNavigationItem(
  item: NavigationItem,
  topTabs: TopTabDefinition[],
  user: AuthUser,
  allowUntargeted: boolean,
): NavigationItem | null {
  const children = item.children
    ?.map((child) => filterNavigationItem(child, topTabs, user, allowUntargeted))
    .filter((child): child is NavigationItem => Boolean(child));
  const allowed = item.target ? isTargetAllowed(item.target, topTabs, user) : allowUntargeted;

  if (!allowed && (!children || children.length === 0)) return null;

  return {
    ...item,
    children,
  };
}

export function getVisibleNavigationGroups(
  groups: NavigationGroup[],
  topTabs: TopTabDefinition[],
  user: AuthUser,
) {
  return groups.flatMap((group) => {
    const defaultAllowed = isTargetAllowed(group.defaultTarget, topTabs, user);
    const items = group.items
      .map((item) => filterNavigationItem(item, topTabs, user, defaultAllowed))
      .filter((item): item is NavigationItem => Boolean(item));

    if (items.length === 0 && !defaultAllowed) return [];

    return [{ ...group, items }];
  });
}

export function createCustomNavigationItems(customTabs: CustomTab[]): NavigationItem[] {
  return customTabs
    .filter((tab) => tab.visible !== false)
    .map((tab) => ({
      id: `custom-${tab.id}`,
      label: tab.title,
      status: "preview" as const,
      target: { topTab: customTabKey(tab.id) },
    }));
}

function reportCustomerShortCode(customer: ReportCustomerConfig) {
  const code = customer.ptoCode?.trim();
  if (!code) return customer.label.trim();

  const knownCodes: Record<string, string> = {
    AA: "АА",
    AAE: "ААЕ",
    AAM: "ААМ",
  };

  return knownCodes[code.toUpperCase()] ?? code;
}

export function createReportCustomerNavigationItems(reportCustomers: ReportCustomerConfig[]): NavigationItem[] {
  return reportCustomers
    .filter((customer) => customer.visible !== false)
    .map((customer) => ({
      id: `reports-customer-${customer.id}`,
      label: `Сводный отчет ${reportCustomerShortCode(customer)}`,
      status: "production" as const,
      target: { topTab: "reports" as const, reportCustomerId: customer.id },
    }));
}

export function attachReportCustomerNavigationItems(
  groups: NavigationGroup[],
  reportCustomers: ReportCustomerConfig[],
) {
  const reportItems = createReportCustomerNavigationItems(reportCustomers);

  return groups.map((group) => (
    group.id === "reports" && reportItems.length > 0
      ? { ...group, items: reportItems }
      : group
  ));
}

export function isNavigationTargetActive(target: NavigationTarget | undefined, state: LegacyNavigationState) {
  if (!target) return false;
  if (target.topTab !== state.topTab) return false;
  if (target.dispatchTab && target.dispatchTab !== state.dispatchTab) return false;
  if (target.ptoTab && target.ptoTab !== state.ptoTab) return false;
  if (target.adminSection && target.adminSection !== state.adminSection) return false;
  if (target.fleetTab && target.fleetTab !== state.fleetTab) return false;
  if (target.fuelTab && target.fuelTab !== state.fuelTab) return false;
  if (target.tbTab && target.tbTab !== state.tbTab) return false;
  if (target.contractorTab && target.contractorTab !== state.contractorTab) return false;
  if (target.reportCustomerId && target.reportCustomerId !== state.reportCustomerId) return false;
  return true;
}

export function isNavigationItemActive(item: NavigationItem, state: LegacyNavigationState): boolean {
  return isNavigationTargetActive(item.target, state)
    || Boolean(item.children?.some((child) => isNavigationItemActive(child, state)));
}

export function isNavigationGroupActive(group: NavigationGroup, state: LegacyNavigationState) {
  return isNavigationTargetActive(group.defaultTarget, state)
    || group.items.some((item) => isNavigationItemActive(item, state));
}

export function selectNavigationTarget(target: NavigationTarget | undefined, actions: LegacyNavigationActions) {
  if (!target) return;

  if (target.dispatchTab) actions.onSelectDispatchTab(target.dispatchTab);
  if (target.ptoTab) actions.onSelectPtoTab(target.ptoTab);
  if (target.adminSection) actions.onSelectAdminSection(target.adminSection);
  if (target.fleetTab) actions.onSelectFleetTab(target.fleetTab);
  if (target.fuelTab) actions.onSelectFuelTab(target.fuelTab);
  if (target.tbTab) actions.onSelectTbTab(target.tbTab);
  if (target.contractorTab) actions.onSelectContractorTab(target.contractorTab);
  if (target.reportCustomerId) actions.onSelectReportCustomer(target.reportCustomerId);
  actions.onSelectTopTab(target.topTab);
}

export function selectNavigationItem(item: NavigationItem, actions: LegacyNavigationActions) {
  selectNavigationTarget(item.target, actions);
}

export function createNavigationTrail(
  groups: NavigationGroup[],
  state: LegacyNavigationState,
): NavigationTrail {
  for (const group of groups) {
    for (const item of group.items) {
      if (isNavigationTargetActive(item.target, state)) {
        return {
          workspace: group.label,
          workspaceId: group.id,
          item: item.label,
          itemId: item.id,
          status: item.status,
        };
      }
      const child = item.children?.find((candidate) => isNavigationTargetActive(candidate.target, state));
      if (child) {
        return {
          workspace: group.label,
          workspaceId: group.id,
          item: item.label,
          itemId: item.id,
          child: child.label,
          childId: child.id,
          status: child.status,
        };
      }
    }
    if (isNavigationTargetActive(group.defaultTarget, state)) return { workspace: group.label, workspaceId: group.id };
  }

  return { workspace: "Рабочий стол" };
}
