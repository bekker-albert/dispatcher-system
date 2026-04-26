"use client";

import type { CSSProperties } from "react";

import { compactSubTabLabel, type SubTabConfig } from "../../lib/domain/navigation/tabs";
import { defaultContractors } from "../../lib/domain/reference/defaults";
import { TopButton } from "../../shared/ui/buttons";
import { SectionCard, SubTabs } from "../../shared/ui/layout";

type ContractorsSectionProps = {
  contractorTab: string;
  subTabs: SubTabConfig[];
  onSelectTab: (tab: string) => void;
};

export function ContractorsSection({ contractorTab, subTabs, onSelectTab }: ContractorsSectionProps) {
  const activeSubtab = subTabs.find((tab) => tab.value === contractorTab);

  return (
    <>
      <SubTabs>
        {subTabs.filter((tab) => tab.visible).map((tab) => (
          <TopButton key={tab.id} active={contractorTab === tab.value} onClick={() => onSelectTab(tab.value)} label={compactSubTabLabel("contractors", tab)} />
        ))}
      </SubTabs>

      <SectionCard title={`Действующий подрядчик: ${activeSubtab?.label ?? contractorTab}`}>
        {contractorTab.startsWith("custom:") ? (
          <div style={blockStyle}>{activeSubtab?.content || "В этой подвкладке пока нет информации."}</div>
        ) : (
          <div style={cardGridStyle}>
            {(defaultContractors[contractorTab] ?? []).map((unit) => (
              <div key={unit} style={blockStyle}>{unit}</div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};
