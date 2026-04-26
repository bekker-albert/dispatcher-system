"use client";

import { useEffect, useRef, useState } from "react";

import type { AdminSection } from "../../lib/domain/admin/navigation";
import type { SubTabConfig, TopTab } from "../../lib/domain/navigation/tabs";
import type { ReportCustomerConfig } from "../../lib/domain/reports/types";

type HeaderSubtabsOffsetOptions = {
  headerHasSubtabs: boolean;
  topTab: TopTab;
  adminSection: AdminSection;
  dispatchTab: string;
  ptoTab: string;
  reportCustomerId: string;
  reportCustomers: ReportCustomerConfig[];
  dispatchSubTabs: SubTabConfig[];
  ptoSubTabs: SubTabConfig[];
};

export function useHeaderSubtabsOffset({
  headerHasSubtabs,
  topTab,
  adminSection,
  dispatchTab,
  ptoTab,
  reportCustomerId,
  reportCustomers,
  dispatchSubTabs,
  ptoSubTabs,
}: HeaderSubtabsOffsetOptions) {
  const headerNavRef = useRef<HTMLDivElement | null>(null);
  const activeHeaderTabRef = useRef<HTMLDivElement | null>(null);
  const headerSubtabsRef = useRef<HTMLDivElement | null>(null);
  const [headerSubtabsOffset, setHeaderSubtabsOffset] = useState(0);

  useEffect(() => {
    if (!headerHasSubtabs) {
      return;
    }

    const measureHeaderSubtabs = () => {
      const nav = headerNavRef.current;
      const activeTab = activeHeaderTabRef.current;
      const subtabs = headerSubtabsRef.current;
      if (!nav || !activeTab || !subtabs) return;

      const navRect = nav.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const subtabsWidth = subtabs.offsetWidth;
      const desiredLeft = tabRect.left - navRect.left + (tabRect.width - subtabsWidth) / 2;
      const maxLeft = Math.max(0, nav.clientWidth - subtabsWidth);
      const nextLeft = Math.round(Math.min(maxLeft, Math.max(0, desiredLeft)));

      setHeaderSubtabsOffset((current) => (current === nextLeft ? current : nextLeft));
    };

    const frame = window.requestAnimationFrame(measureHeaderSubtabs);
    window.addEventListener("resize", measureHeaderSubtabs);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureHeaderSubtabs);
    };
  }, [adminSection, dispatchTab, dispatchSubTabs, headerHasSubtabs, ptoSubTabs, ptoTab, reportCustomerId, reportCustomers, topTab]);

  return {
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    headerSubtabsOffset: headerHasSubtabs ? headerSubtabsOffset : 0,
  };
}
