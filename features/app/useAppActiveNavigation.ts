import { useHeaderSubtabsOffset } from "@/components/layout/useHeaderSubtabsOffset";
import type { AdminSection } from "@/lib/domain/admin/navigation";
import { customTabKey, type CustomTab, type EditableSubtabGroup, type SubTabConfig, type TopTab } from "@/lib/domain/navigation/tabs";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";

type UseAppActiveNavigationOptions = {
  topTab: TopTab;
  renderedTopTab: string;
  customTabs: CustomTab[];
  subTabs: Record<EditableSubtabGroup, SubTabConfig[]>;
  dispatchTab: string;
  ptoTab: string;
  adminSection: AdminSection;
  reportCustomerId: string;
  reportCustomers: ReportCustomerConfig[];
};

export function useAppActiveNavigation({
  topTab,
  renderedTopTab,
  customTabs,
  subTabs,
  dispatchTab,
  ptoTab,
  adminSection,
  reportCustomerId,
  reportCustomers,
}: UseAppActiveNavigationOptions) {
  const activeCustomTab = customTabs.find((tab) => tab.visible !== false && customTabKey(tab.id) === renderedTopTab);
  const activeDispatchSubtab = subTabs.dispatch.find((tab) => tab.value === dispatchTab);
  const activePtoSubtab = subTabs.pto.find((tab) => tab.value === ptoTab);
  const headerHasSubtabs = topTab === "reports" || topTab === "dispatch" || topTab === "pto" || topTab === "admin";
  const {
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    headerSubtabsOffset,
  } = useHeaderSubtabsOffset({
    headerHasSubtabs,
    topTab,
    adminSection,
    dispatchTab,
    ptoTab,
    reportCustomerId,
    reportCustomers,
    dispatchSubTabs: subTabs.dispatch,
    ptoSubTabs: subTabs.pto,
  });

  return {
    activeCustomTab,
    activeDispatchSubtab,
    activeHeaderTabRef,
    activePtoSubtab,
    headerNavRef,
    headerHasSubtabs,
    headerSubtabsOffset,
    headerSubtabsRef,
  };
}
