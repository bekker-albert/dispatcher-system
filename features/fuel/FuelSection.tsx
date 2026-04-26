"use client";

import type { CSSProperties } from "react";

import { compactSubTabLabel, type SubTabConfig } from "../../lib/domain/navigation/tabs";
import { defaultFuelContractors, defaultFuelGeneral } from "../../lib/domain/reference/defaults";
import { TopButton } from "../../shared/ui/buttons";
import { SectionCard, SubTabs } from "../../shared/ui/layout";

type FuelSectionProps = {
  fuelTab: string;
  subTabs: SubTabConfig[];
  onSelectTab: (tab: string) => void;
};

export function FuelSection({ fuelTab, subTabs, onSelectTab }: FuelSectionProps) {
  const activeSubtab = subTabs.find((tab) => tab.value === fuelTab);

  return (
    <>
      <SubTabs>
        {subTabs.filter((tab) => tab.visible).map((tab) => (
          <TopButton key={tab.id} active={fuelTab === tab.value} onClick={() => onSelectTab(tab.value)} label={compactSubTabLabel("fuel", tab)} />
        ))}
      </SubTabs>

      <SectionCard title={`Топливо — ${activeSubtab?.label ?? fuelTab}`}>
        {fuelTab.startsWith("custom:") ? (
          <div style={blockStyle}>{activeSubtab?.content || "В этой подвкладке пока нет информации."}</div>
        ) : (
          <div style={cardGridStyle}>
            {(fuelTab === "general" ? defaultFuelGeneral : defaultFuelContractors).map((row) => (
              <div key={`${row.unit}-${row.mode}`} style={blockStyle}>
                <div style={{ fontWeight: 700 }}>{row.unit}</div>
                {"contractor" in row && row.contractor ? <div style={{ color: "#64748b", marginTop: 6 }}>Организация: {row.contractor}</div> : null}
                <div style={{ marginTop: 8 }}>Режим: {row.mode}</div>
                <div>Литраж: {row.liters} л</div>
                <div>Долг: {row.debt} л</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
};

const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};
