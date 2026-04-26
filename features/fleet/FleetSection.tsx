"use client";

import type { CSSProperties } from "react";

import { compactSubTabLabel, type SubTabConfig } from "../../lib/domain/navigation/tabs";
import { buildVehicleDisplayName } from "../../lib/domain/vehicles/import-export";
import type { VehicleRow } from "../../lib/domain/vehicles/types";
import { TopButton } from "../../shared/ui/buttons";
import { SectionCard, SubTabs } from "../../shared/ui/layout";

type FleetSectionProps = {
  fleetTab: string;
  subTabs: SubTabConfig[];
  rows: VehicleRow[];
  onSelectTab: (tab: string) => void;
};

export function FleetSection({ fleetTab, subTabs, rows, onSelectTab }: FleetSectionProps) {
  const activeSubtab = subTabs.find((tab) => tab.value === fleetTab);

  return (
    <>
      <SubTabs>
        {subTabs.filter((tab) => tab.visible).map((tab) => (
          <TopButton key={tab.id} active={fleetTab === tab.value} onClick={() => onSelectTab(tab.value)} label={compactSubTabLabel("fleet", tab)} />
        ))}
      </SubTabs>

      <SectionCard title={activeSubtab?.label ?? "Список техники по участкам"}>
        {fleetTab.startsWith("custom:") ? (
          <div style={blockStyle}>{activeSubtab?.content || "В этой подвкладке пока нет информации."}</div>
        ) : (
          <div style={cardGridStyle}>
            {rows.map((vehicle) => (
              <div key={vehicle.id} style={blockStyle}>
                <div style={{ fontWeight: 700 }}>{buildVehicleDisplayName(vehicle)}</div>
                <div style={{ color: "#64748b", marginTop: 6 }}>{vehicle.area} · {vehicle.location}</div>
                <div style={{ marginTop: 8 }}>Вид работ: {vehicle.workType}</div>
                <div>Работа: {vehicle.work} ч | Аренда: {vehicle.rent} ч</div>
                <div>Ремонт: {vehicle.repair} ч | Простой: {vehicle.downtime} ч</div>
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
