"use client";

import type { CSSProperties, ReactNode } from "react";
import dynamic from "next/dynamic";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";
import { SectionCard } from "@/shared/ui/layout";

export type PtoSectionProps = {
  ptoTab: string;
  activePtoSubtabLabel: string;
  activePtoSubtabContent: string;
  isPtoDateTab: boolean;
  ptoAreaTabs: string[];
  ptoAreaFilter: string;
  onSelectArea: (area: string) => void;
  ptoBucketRows: PtoBucketRow[];
  ptoBucketColumns: PtoBucketColumn[];
  ptoBucketValues: Record<string, number>;
  onCommitBucketValue: (cellKey: string, draft: string) => void;
  onClearBucketCells: (cellKeys: string[]) => void;
  onAddBucketManualRow: (area: string, structure: string) => boolean;
  onDeleteBucketManualRow: (row: PtoBucketRow) => void;
  renderPlanTable: () => ReactNode;
  renderOperTable: () => ReactNode;
  renderSurveyTable: () => ReactNode;
};

const PtoBucketsSection = dynamic(() => import("./PtoBucketsSection"), {
  ssr: false,
  loading: () => <div style={blockStyle}>Загружаю таблицу ковшей...</div>,
});

export default function PtoSection({
  ptoTab,
  activePtoSubtabLabel,
  activePtoSubtabContent,
  isPtoDateTab,
  ptoAreaTabs,
  ptoAreaFilter,
  onSelectArea,
  ptoBucketRows,
  ptoBucketColumns,
  ptoBucketValues,
  onCommitBucketValue,
  onClearBucketCells,
  onAddBucketManualRow,
  onDeleteBucketManualRow,
  renderPlanTable,
  renderOperTable,
  renderSurveyTable,
}: PtoSectionProps) {
  const content = activePtoSubtabContent || "";

  return (
    <div style={isPtoDateTab ? ptoWorkspaceStyle : undefined}>
      <SectionCard title={isPtoDateTab ? "" : `ПТО: ${activePtoSubtabLabel || ptoTab}`} fill={isPtoDateTab}>
        {ptoTab.startsWith("custom:") && <div style={blockStyle}>{content || "В этой подвкладке пока нет информации."}</div>}
        {ptoTab === "bodies" && <div style={blockStyle}>{content || "Справочник объемов кузовов: модель техники → материал → объем кузова."}</div>}
        {ptoTab === "performance" && <div style={blockStyle}>{content || "Расчет производительности: рейсы, кузова, материалы, удельный вес, перевод м³ ↔ тн."}</div>}
        {ptoTab === "cycle" && <div style={blockStyle}>{content || "Цикл погрузки: подъезд, погрузка, выезд, разгрузка, обратный путь."}</div>}
        {ptoTab === "buckets" && (
          <div style={ptoBucketsPanelStyle}>
            {content ? <div style={blockStyle}>{content}</div> : null}
            <PtoBucketsSection
              ptoAreaTabs={ptoAreaTabs}
              ptoAreaFilter={ptoAreaFilter}
              onSelectArea={onSelectArea}
              rows={ptoBucketRows}
              columns={ptoBucketColumns}
              values={ptoBucketValues}
              onCommitValue={onCommitBucketValue}
              onClearCells={onClearBucketCells}
              onAddManualRow={onAddBucketManualRow}
              onDeleteManualRow={onDeleteBucketManualRow}
            />
          </div>
        )}
        {ptoTab === "plan" && (
          <div style={ptoDatePanelStyle}>
            {content ? <div style={blockStyle}>{content}</div> : null}
            <div style={ptoDateTableFrameStyle}>{renderPlanTable()}</div>
          </div>
        )}
        {ptoTab === "oper" && (
          <div style={ptoDatePanelStyle}>
            {content ? <div style={blockStyle}>{content}</div> : null}
            <div style={ptoDateTableFrameStyle}>{renderOperTable()}</div>
          </div>
        )}
        {ptoTab === "survey" && (
          <div style={ptoDatePanelStyle}>
            {content ? <div style={blockStyle}>{content}</div> : null}
            <div style={ptoDateTableFrameStyle}>{renderSurveyTable()}</div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};

const ptoWorkspaceStyle: CSSProperties = {
  height: "calc(100dvh - 184px)",
  minHeight: 420,
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr)",
};

const ptoDatePanelStyle: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const ptoDateTableFrameStyle: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  height: "100%",
};

const ptoBucketsPanelStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};
