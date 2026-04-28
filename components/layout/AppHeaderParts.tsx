"use client";

import type { RefObject } from "react";

import { adminSectionTabs } from "../../lib/domain/admin/navigation";
import {
  compactSubTabLabel,
  compactTopTabLabel,
  customTabKey,
  type TopTabDefinition,
} from "../../lib/domain/navigation/tabs";
import { TopButton } from "../../shared/ui/buttons";
import { Field } from "../../shared/ui/layout";
import { HeaderSubButton } from "../../shared/ui/navigation";
import {
  dateInputStyle,
  getHeaderSubtabsPositionStyle,
  headerActiveTabWithSubtabsStyle,
  headerMainTabsStyle,
  headerSubtabsStyle,
  workDateStyle,
} from "./AppHeaderStyles";
import type { AppHeaderProps } from "./AppHeaderTypes";

type AppHeaderMainTabsProps = Pick<
  AppHeaderProps,
  "topTabs" | "customTabs" | "topTab" | "onSelectTopTab" | "onDeleteCustomTab"
> & {
  activeHeaderTabRef: RefObject<HTMLDivElement | null>;
};

type AppHeaderSubtabsProps = Pick<
  AppHeaderProps,
  | "topTab"
  | "subTabs"
  | "headerSubtabsOffset"
  | "headerSubtabsRef"
  | "reportCustomers"
  | "reportCustomerId"
  | "dispatchTab"
  | "ptoTab"
  | "adminSection"
  | "onSelectReportCustomer"
  | "onSelectDispatchTab"
  | "onSelectPtoTab"
  | "onSelectAdminSection"
>;

type AppHeaderWorkDateProps = Pick<AppHeaderProps, "reportDate" | "onSelectReportDate">;

const topTabsWithSubtabs = new Set<TopTabDefinition["id"]>(["reports", "dispatch", "pto", "admin"]);

export function AppHeaderMainTabs({
  topTabs,
  customTabs,
  topTab,
  activeHeaderTabRef,
  onSelectTopTab,
  onDeleteCustomTab,
}: AppHeaderMainTabsProps) {
  return (
    <div style={headerMainTabsStyle}>
      {topTabs
        .filter((tab) => tab.visible)
        .map((tab) => {
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
          ) : (
            tabButton
          );
        })}
      {customTabs
        .filter((tab) => tab.visible !== false)
        .map((tab) => (
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
  );
}

export function AppHeaderSubtabs({
  topTab,
  subTabs,
  headerSubtabsOffset,
  headerSubtabsRef,
  reportCustomers,
  reportCustomerId,
  dispatchTab,
  ptoTab,
  adminSection,
  onSelectReportCustomer,
  onSelectDispatchTab,
  onSelectPtoTab,
  onSelectAdminSection,
}: AppHeaderSubtabsProps) {
  return (
    <div
      ref={headerSubtabsRef}
      style={{ ...headerSubtabsStyle, ...getHeaderSubtabsPositionStyle(headerSubtabsOffset) }}
    >
      {topTab === "reports" &&
        reportCustomers
          .filter((customer) => customer.visible)
          .map((customer) => (
            <HeaderSubButton
              key={customer.id}
              active={reportCustomerId === customer.id}
              onClick={() => onSelectReportCustomer(customer.id)}
              label={customer.label}
            />
          ))}
      {topTab === "dispatch" &&
        subTabs.dispatch
          .filter((subTab) => subTab.visible)
          .map((subTab) => (
            <HeaderSubButton
              key={subTab.id}
              active={dispatchTab === subTab.value}
              onClick={() => onSelectDispatchTab(subTab.value)}
              label={compactSubTabLabel("dispatch", subTab)}
            />
          ))}
      {topTab === "pto" &&
        subTabs.pto
          .filter((subTab) => subTab.visible)
          .map((subTab) => (
            <HeaderSubButton
              key={subTab.id}
              active={ptoTab === subTab.value}
              onClick={() => onSelectPtoTab(subTab.value)}
              label={compactSubTabLabel("pto", subTab)}
            />
          ))}
      {topTab === "admin" &&
        adminSectionTabs.map((section) => (
          <HeaderSubButton
            key={section.value}
            active={adminSection === section.value}
            onClick={() => onSelectAdminSection(section.value)}
            label={section.label}
          />
        ))}
    </div>
  );
}

export function AppHeaderWorkDate({ reportDate, onSelectReportDate }: AppHeaderWorkDateProps) {
  return (
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
  );
}
