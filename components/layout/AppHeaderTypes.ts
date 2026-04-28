import type { RefObject } from "react";

import type { AdminSection } from "../../lib/domain/admin/navigation";
import type {
  CustomTab,
  EditableSubtabGroup,
  SubTabConfig,
  TopTab,
  TopTabDefinition,
} from "../../lib/domain/navigation/tabs";
import type { ReportCustomerConfig } from "../../lib/domain/reports/types";

export type AppHeaderProps = {
  topTabs: TopTabDefinition[];
  customTabs: CustomTab[];
  topTab: TopTab;
  subTabs: Record<EditableSubtabGroup, SubTabConfig[]>;
  headerHasSubtabs: boolean;
  headerSubtabsOffset: number;
  headerNavRef: RefObject<HTMLDivElement | null>;
  activeHeaderTabRef: RefObject<HTMLDivElement | null>;
  headerSubtabsRef: RefObject<HTMLDivElement | null>;
  reportCustomers: ReportCustomerConfig[];
  reportCustomerId: string;
  dispatchTab: string;
  ptoTab: string;
  adminSection: AdminSection;
  reportDate: string;
  onSelectTopTab: (tab: TopTab) => void;
  onDeleteCustomTab: (id: string) => void;
  onSelectReportCustomer: (id: string) => void;
  onSelectDispatchTab: (tab: string) => void;
  onSelectPtoTab: (tab: string) => void;
  onSelectAdminSection: (section: AdminSection) => void;
  onSelectReportDate: (date: string) => void;
};
