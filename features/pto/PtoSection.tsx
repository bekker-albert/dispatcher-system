"use client";

import type { CSSProperties, ChangeEvent, ReactNode } from "react";
import dynamic from "next/dynamic";
import type { PtoBodyColumn } from "@/lib/domain/pto/bodies";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPerformanceColumn, PtoPerformanceRow } from "@/lib/domain/pto/performance";
import { isPtoDataTableKey } from "@/lib/domain/pto/tabs";
import { SectionCard } from "@/shared/ui/layout";
import { createPtoMatrixHeaderEditor, type PtoMatrixHeaderEditorBase } from "./ptoMatrixHeaderEditing";
import { PtoStaticTabContent, ptoInfoBlockStyle } from "./PtoStaticTabContent";

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
  ptoCycleRows: PtoBucketRow[];
  ptoCycleColumns: PtoBucketColumn[];
  ptoBodyRows: PtoBucketRow[];
  ptoBodyColumns: PtoBodyColumn[];
  ptoPerformanceRows: PtoPerformanceRow[];
  ptoPerformanceColumns: PtoPerformanceColumn[];
  ptoBucketValues: Record<string, number>;
  ptoMatrixHeaderEditor?: PtoMatrixHeaderEditorBase;
  onCommitBucketValue: (cellKey: string, draft: string) => void;
  onClearBucketCells: (cellKeys: string[]) => void;
  onAddBucketManualRow: (area: string, structure: string) => boolean;
  onDeleteBucketManualRow: (row: PtoBucketRow) => void;
  onExportPtoMatrixToExcel: () => void | Promise<void>;
  onImportPtoMatrixFromExcel: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  renderPlanTable: () => ReactNode;
  renderOperTable: () => ReactNode;
  renderSurveyTable: () => ReactNode;
};

const PtoBucketsSection = dynamic(() => import("./PtoBucketsSection"), {
  ssr: false,
  loading: () => <div style={ptoInfoBlockStyle}>Загружаю таблицу ковшей...</div>,
});

const PtoBodiesSection = dynamic(() => import("./PtoBodiesSection"), {
  ssr: false,
  loading: () => <div style={ptoInfoBlockStyle}>Загружаю таблицу кузовов...</div>,
});

const PtoPerformanceSection = dynamic(() => import("./PtoPerformanceSection"), {
  ssr: false,
  loading: () => <div style={ptoInfoBlockStyle}>Загружаю таблицу производительности...</div>,
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
  ptoCycleRows,
  ptoCycleColumns,
  ptoBodyRows,
  ptoBodyColumns,
  ptoPerformanceRows,
  ptoPerformanceColumns,
  ptoBucketValues,
  ptoMatrixHeaderEditor,
  onCommitBucketValue,
  onClearBucketCells,
  onAddBucketManualRow,
  onDeleteBucketManualRow,
  onExportPtoMatrixToExcel,
  onImportPtoMatrixFromExcel,
  renderPlanTable,
  renderOperTable,
  renderSurveyTable,
}: PtoSectionProps) {
  const content = activePtoSubtabContent || "";
  const bucketHeaderEditor = createPtoMatrixHeaderEditor(ptoMatrixHeaderEditor, "buckets");
  const cycleHeaderEditor = createPtoMatrixHeaderEditor(ptoMatrixHeaderEditor, "cycle");
  const bodiesHeaderEditor = createPtoMatrixHeaderEditor(ptoMatrixHeaderEditor, "bodies");
  const performanceHeaderEditor = createPtoMatrixHeaderEditor(ptoMatrixHeaderEditor, "performance");
  const showStaticContent = !isPtoDataTableKey(ptoTab);

  return (
    <div style={isPtoDateTab ? ptoWorkspaceStyle : undefined}>
      <SectionCard title={isPtoDateTab ? "" : `ПТО: ${activePtoSubtabLabel || ptoTab}`} fill={isPtoDateTab}>
        {showStaticContent ? <PtoStaticTabContent content={content} ptoTab={ptoTab} /> : null}
        {ptoTab === "buckets" && (
          <div style={ptoBucketsPanelStyle}>
            {content ? <div style={ptoInfoBlockStyle}>{content}</div> : null}
            <PtoBucketsSection
              ptoAreaTabs={ptoAreaTabs}
              ptoAreaFilter={ptoAreaFilter}
              onSelectArea={onSelectArea}
              rows={ptoBucketRows}
              columns={ptoBucketColumns}
              values={ptoBucketValues}
              headerEditor={bucketHeaderEditor}
              onCommitValue={onCommitBucketValue}
              onClearCells={onClearBucketCells}
              onAddManualRow={onAddBucketManualRow}
              onDeleteManualRow={onDeleteBucketManualRow}
              onExportToExcel={onExportPtoMatrixToExcel}
              onImportFromExcel={onImportPtoMatrixFromExcel}
            />
          </div>
        )}
        {ptoTab === "cycle" && (
          <div style={ptoBucketsPanelStyle}>
            <PtoBucketsSection
              ptoAreaTabs={ptoAreaTabs}
              ptoAreaFilter={ptoAreaFilter}
              onSelectArea={onSelectArea}
              rows={ptoCycleRows}
              columns={ptoCycleColumns}
              values={ptoBucketValues}
              headerEditor={cycleHeaderEditor}
              onCommitValue={onCommitBucketValue}
              onClearCells={onClearBucketCells}
              onAddManualRow={onAddBucketManualRow}
              onDeleteManualRow={onDeleteBucketManualRow}
              onExportToExcel={onExportPtoMatrixToExcel}
              onImportFromExcel={onImportPtoMatrixFromExcel}
            />
          </div>
        )}
        {ptoTab === "bodies" && (
          <div style={ptoBucketsPanelStyle}>
            <PtoBodiesSection
              ptoAreaTabs={ptoAreaTabs}
              ptoAreaFilter={ptoAreaFilter}
              onSelectArea={onSelectArea}
              rows={ptoBodyRows}
              columns={ptoBodyColumns}
              values={ptoBucketValues}
              headerEditor={bodiesHeaderEditor}
              onCommitValue={onCommitBucketValue}
              onClearCells={onClearBucketCells}
            />
          </div>
        )}
        {ptoTab === "performance" && (
          <div style={ptoBucketsPanelStyle}>
            <PtoPerformanceSection
              ptoAreaTabs={ptoAreaTabs}
              ptoAreaFilter={ptoAreaFilter}
              onSelectArea={onSelectArea}
              rows={ptoPerformanceRows}
              columns={ptoPerformanceColumns}
              values={ptoBucketValues}
              headerEditor={performanceHeaderEditor}
              onCommitValue={onCommitBucketValue}
              onClearCells={onClearBucketCells}
            />
          </div>
        )}
        {ptoTab === "plan" && (
          <div style={ptoDatePanelStyle}>
            {content ? <div style={ptoInfoBlockStyle}>{content}</div> : null}
            <div style={ptoDateTableFrameStyle}>{renderPlanTable()}</div>
          </div>
        )}
        {ptoTab === "oper" && (
          <div style={ptoDatePanelStyle}>
            {content ? <div style={ptoInfoBlockStyle}>{content}</div> : null}
            <div style={ptoDateTableFrameStyle}>{renderOperTable()}</div>
          </div>
        )}
        {ptoTab === "survey" && (
          <div style={ptoDatePanelStyle}>
            {content ? <div style={ptoInfoBlockStyle}>{content}</div> : null}
            <div style={ptoDateTableFrameStyle}>{renderSurveyTable()}</div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

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
