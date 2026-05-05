"use client";

import Image from "next/image";

import { AuthSessionButton } from "@/features/auth/AuthSessionButton";

import { AppHeaderMainTabs, AppHeaderSubtabs, AppHeaderWorkDate } from "./AppHeaderParts";
import {
  appHeaderLogoCellStyle,
  appHeaderRowStyle,
  appHeaderStyle,
  headerActionsStyle,
  headerNavStackPtoStyle,
  headerNavStackStyle,
  logoImageStyle,
} from "./AppHeaderStyles";
import type { AppHeaderProps } from "./AppHeaderTypes";

export type { AppHeaderProps } from "./AppHeaderTypes";

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
          <Image
            src="/mining-logo.png"
            alt="Логотип"
            width={112}
            height={72}
            style={logoImageStyle}
            priority
          />
        </div>
        <div
          ref={headerNavRef}
          style={{ ...headerNavStackStyle, ...(headerHasSubtabs ? headerNavStackPtoStyle : null) }}
        >
          <AppHeaderMainTabs
            topTabs={topTabs}
            customTabs={customTabs}
            topTab={topTab}
            activeHeaderTabRef={activeHeaderTabRef}
            onSelectTopTab={onSelectTopTab}
            onDeleteCustomTab={onDeleteCustomTab}
          />
          {headerHasSubtabs && (
            <AppHeaderSubtabs
              topTab={topTab}
              subTabs={subTabs}
              headerSubtabsOffset={headerSubtabsOffset}
              headerSubtabsRef={headerSubtabsRef}
              reportCustomers={reportCustomers}
              reportCustomerId={reportCustomerId}
              dispatchTab={dispatchTab}
              ptoTab={ptoTab}
              adminSection={adminSection}
              onSelectReportCustomer={onSelectReportCustomer}
              onSelectDispatchTab={onSelectDispatchTab}
              onSelectPtoTab={onSelectPtoTab}
              onSelectAdminSection={onSelectAdminSection}
            />
          )}
        </div>
        <div style={headerActionsStyle}>
          <AppHeaderWorkDate reportDate={reportDate} onSelectReportDate={onSelectReportDate} />
          <AuthSessionButton />
        </div>
      </div>
    </div>
  );
}
