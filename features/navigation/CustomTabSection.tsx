import type { CSSProperties } from "react";

import type { CustomTab } from "@/lib/domain/navigation/tabs";
import { SectionCard } from "@/shared/ui/layout";

type CustomTabSectionProps = {
  tab: CustomTab;
};

export function CustomTabSection({ tab }: CustomTabSectionProps) {
  return (
    <SectionCard title={tab.title}>
      <div style={{ display: "grid", gap: 16 }}>
        {tab.description ? <div style={{ color: "#475569" }}>{tab.description}</div> : null}
        {tab.items.length > 0 ? (
          tab.items.map((item, index) => (
            <div key={`${tab.id}-${index}`} style={blockStyle}>
              {item}
            </div>
          ))
        ) : (
          <div style={blockStyle}>Во вкладке пока нет информации.</div>
        )}
      </div>
    </SectionCard>
  );
}

const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};
