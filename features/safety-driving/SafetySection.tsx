"use client";

import type { CSSProperties } from "react";

import { compactSubTabLabel, type SubTabConfig } from "../../lib/domain/navigation/tabs";
import { TopButton } from "../../shared/ui/buttons";
import { SectionCard, SubTabs } from "../../shared/ui/layout";

type SafetySectionProps = {
  tbTab: string;
  subTabs: SubTabConfig[];
  onSelectTab: (tab: string) => void;
};

export function SafetySection({ tbTab, subTabs, onSelectTab }: SafetySectionProps) {
  const activeSubtab = subTabs.find((tab) => tab.value === tbTab);

  return (
    <>
      <SubTabs>
        {subTabs.filter((tab) => tab.visible).map((tab) => (
          <TopButton key={tab.id} active={tbTab === tab.value} onClick={() => onSelectTab(tab.value)} label={compactSubTabLabel("tb", tab)} />
        ))}
      </SubTabs>

      <SectionCard title={`ТБ: ${activeSubtab?.label ?? tbTab}`}>
        {tbTab.startsWith("custom:") && (
          <div style={blockStyle}>{activeSubtab?.content || "В этой подвкладке пока нет информации."}</div>
        )}
        {tbTab === "list" && (
          <div style={blockStyle}>
            {activeSubtab?.content || "Список техники с данными GPS и статусом подключения."}
          </div>
        )}
        {tbTab === "driving" && (
          <div style={blockStyle}>
            {activeSubtab?.content || "Анализ качества вождения: резкие ускорения, торможения, превышения скорости, ремень, фары."}
          </div>
        )}
        {tbTab === "contractors" && (
          <div style={blockStyle}>
            {activeSubtab?.content || "Подрядчики с контролем наличия и активности GPS на технике."}
          </div>
        )}
      </SectionCard>
    </>
  );
}

const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};
