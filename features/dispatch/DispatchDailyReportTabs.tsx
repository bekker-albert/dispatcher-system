"use client";

import {
  dispatchInnerTabActiveButtonStyle,
  dispatchInnerTabButtonStyle,
  dispatchInnerTabsStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import type { DispatchDailyReportTab } from "@/lib/domain/dispatch/summary";

type DispatchDailyReportTabsProps = {
  activeTab: DispatchDailyReportTab;
  onSelectTab: (tab: DispatchDailyReportTab) => void;
};

const dailyReportTabs: { id: DispatchDailyReportTab; label: string }[] = [
  { id: "volumes", label: "Объемы" },
  { id: "summary", label: "Сводка" },
];

export function DispatchDailyReportTabs({
  activeTab,
  onSelectTab,
}: DispatchDailyReportTabsProps) {
  return (
    <div style={dispatchInnerTabsStyle} role="tablist" aria-label="Суточный отчет">
      {dailyReportTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          style={activeTab === tab.id ? dispatchInnerTabActiveButtonStyle : dispatchInnerTabButtonStyle}
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
