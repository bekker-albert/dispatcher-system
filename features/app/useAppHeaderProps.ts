"use client";

import type { AppHeaderProps } from "@/components/layout/AppHeader";

type UseAppHeaderPropsOptions = {
  topTabs: AppHeaderProps["topTabs"];
  customTabs: AppHeaderProps["customTabs"];
  topTab: AppHeaderProps["topTab"];
  subTabs: AppHeaderProps["subTabs"];
  headerHasSubtabs: boolean;
  headerSubtabsOffset: number;
  headerNavRef: AppHeaderProps["headerNavRef"];
  activeHeaderTabRef: AppHeaderProps["activeHeaderTabRef"];
  headerSubtabsRef: AppHeaderProps["headerSubtabsRef"];
  reportCustomers: AppHeaderProps["reportCustomers"];
  reportCustomerId: string;
  dispatchTab: string;
  ptoTab: string;
  adminSection: AppHeaderProps["adminSection"];
  reportDate: string;
  selectTopTab: AppHeaderProps["onSelectTopTab"];
  deleteCustomTab: AppHeaderProps["onDeleteCustomTab"];
  setReportCustomerId: AppHeaderProps["onSelectReportCustomer"];
  setDispatchTab: AppHeaderProps["onSelectDispatchTab"];
  selectPtoTab: AppHeaderProps["onSelectPtoTab"];
  setAdminSection: AppHeaderProps["onSelectAdminSection"];
  selectReportDate: AppHeaderProps["onSelectReportDate"];
};

export function useAppHeaderProps({
  topTabs,
  customTabs,
  topTab,
  subTabs,
  headerHasSubtabs,
  headerSubtabsOffset,
  headerNavRef,
  activeHeaderTabRef,
  headerSubtabsRef,
  reportCustomers,
  reportCustomerId,
  dispatchTab,
  ptoTab,
  adminSection,
  reportDate,
  selectTopTab,
  deleteCustomTab,
  setReportCustomerId,
  setDispatchTab,
  selectPtoTab,
  setAdminSection,
  selectReportDate,
}: UseAppHeaderPropsOptions): AppHeaderProps {
  return {
    topTabs,
    customTabs,
    topTab,
    subTabs,
    headerHasSubtabs,
    headerSubtabsOffset,
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    reportCustomers,
    reportCustomerId,
    dispatchTab,
    ptoTab,
    adminSection,
    reportDate,
    onSelectTopTab: selectTopTab,
    onDeleteCustomTab: deleteCustomTab,
    onSelectReportCustomer: setReportCustomerId,
    onSelectDispatchTab: setDispatchTab,
    onSelectPtoTab: selectPtoTab,
    onSelectAdminSection: setAdminSection,
    onSelectReportDate: selectReportDate,
  };
}
