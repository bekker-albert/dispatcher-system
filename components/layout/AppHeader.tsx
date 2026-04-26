"use client";

import Image from "next/image";
import type { CSSProperties, RefObject } from "react";

import { adminSectionTabs, type AdminSection } from "../../lib/domain/admin/navigation";
import {
  compactSubTabLabel,
  compactTopTabLabel,
  customTabKey,
  type CustomTab,
  type EditableSubtabGroup,
  type SubTabConfig,
  type TopTab,
  type TopTabDefinition,
} from "../../lib/domain/navigation/tabs";
import type { ReportCustomerConfig } from "../../lib/domain/reports/types";
import { TopButton } from "../../shared/ui/buttons";
import { Field } from "../../shared/ui/layout";
import { HeaderSubButton } from "../../shared/ui/navigation";

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

const topTabsWithSubtabs = new Set<TopTabDefinition["id"]>(["reports", "dispatch", "pto", "admin"]);

export function AppHeader({
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
  onSelectTopTab,
  onDeleteCustomTab,
  onSelectReportCustomer,
  onSelectDispatchTab,
  onSelectPtoTab,
  onSelectAdminSection,
  onSelectReportDate,
}: AppHeaderProps) {
  return (
    <div className="app-print-header" style={appHeaderStyle}>
      <div style={appHeaderRowStyle}>
        <div style={appHeaderLogoCellStyle}>
          <Image src="/mining-logo.png" alt="Логотип" width={112} height={72} style={logoImageStyle} priority />
        </div>
        <div ref={headerNavRef} style={{ ...headerNavStackStyle, ...(headerHasSubtabs ? headerNavStackPtoStyle : null) }}>
          <div style={headerMainTabsStyle}>
            {topTabs.filter((tab) => tab.visible).map((tab) => {
              const tabButton = (
                <TopButton
                  key={tab.id}
                  active={topTab === tab.id}
                  onClick={() => onSelectTopTab(tab.id)}
                  label={compactTopTabLabel(tab)}
                />
              );

              return topTab === tab.id && topTabsWithSubtabs.has(tab.id) ? (
                <div key={tab.id} ref={activeHeaderTabRef} style={headerActiveTabWithSubtabsStyle}>
                  {tabButton}
                </div>
              ) : tabButton;
            })}
            {customTabs.filter((tab) => tab.visible !== false).map((tab) => (
              <TopButton
                key={tab.id}
                active={topTab === customTabKey(tab.id)}
                onClick={() => onSelectTopTab(customTabKey(tab.id))}
                label={tab.title}
                showDelete={topTab === customTabKey(tab.id)}
                deleteLabel={`Удалить вкладку ${tab.title}`}
                onDelete={() => onDeleteCustomTab(tab.id)}
              />
            ))}
          </div>
          {headerHasSubtabs && (
            <div ref={headerSubtabsRef} style={{ ...headerSubtabsStyle, marginLeft: headerSubtabsOffset }}>
              {topTab === "reports" && reportCustomers.filter((customer) => customer.visible).map((customer) => (
                <HeaderSubButton
                  key={customer.id}
                  active={reportCustomerId === customer.id}
                  onClick={() => onSelectReportCustomer(customer.id)}
                  label={customer.label}
                />
              ))}
              {topTab === "dispatch" && subTabs.dispatch.filter((subTab) => subTab.visible).map((subTab) => (
                <HeaderSubButton
                  key={subTab.id}
                  active={dispatchTab === subTab.value}
                  onClick={() => onSelectDispatchTab(subTab.value)}
                  label={compactSubTabLabel("dispatch", subTab)}
                />
              ))}
              {topTab === "pto" && subTabs.pto.filter((subTab) => subTab.visible).map((subTab) => (
                <HeaderSubButton
                  key={subTab.id}
                  active={ptoTab === subTab.value}
                  onClick={() => onSelectPtoTab(subTab.value)}
                  label={compactSubTabLabel("pto", subTab)}
                />
              ))}
              {topTab === "admin" && adminSectionTabs.map((section) => (
                <HeaderSubButton
                  key={section.value}
                  active={adminSection === section.value}
                  onClick={() => onSelectAdminSection(section.value)}
                  label={section.label}
                />
              ))}
            </div>
          )}
        </div>
        <div style={workDateStyle}>
          <Field label="Рабочая дата">
            <input
              type="date"
              value={reportDate}
              onChange={(event) => onSelectReportDate(event.target.value)}
              style={dateInputStyle}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

const appHeaderStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
  marginBottom: 20,
};

const appHeaderRowStyle: CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "center",
  flexWrap: "wrap",
};

const appHeaderLogoCellStyle: CSSProperties = {
  width: 130,
  flex: "0 0 130px",
};

const headerNavStackStyle: CSSProperties = {
  flex: "1 1 720px",
  display: "grid",
  gap: 6,
  minWidth: 280,
  position: "relative",
};

const headerNavStackPtoStyle: CSSProperties = {
  paddingBottom: 0,
};

const headerMainTabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

const headerActiveTabWithSubtabsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const headerSubtabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  alignItems: "center",
  justifyContent: "flex-start",
  width: "fit-content",
  maxWidth: "100%",
  borderTop: "1px solid #0f172a",
  paddingTop: 6,
};

const logoImageStyle: CSSProperties = {
  width: 112,
  height: 72,
  objectFit: "contain",
  display: "block",
};

const workDateStyle: CSSProperties = {
  width: 170,
  flex: "0 0 170px",
};

const dateInputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  background: "#ffffff",
};
