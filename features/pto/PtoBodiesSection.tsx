"use client";

import { useCallback } from "react";

import { PtoBucketsToolbar } from "@/features/pto/PtoBucketsToolbar";
import { allAreasLabel } from "@/features/pto/ptoBucketsConfig";
import { bodyTechniqueColumnWidth } from "@/features/pto/ptoBodiesConfig";
import { ptoBucketsHintStyle, ptoBucketsLayoutStyle } from "@/features/pto/ptoBucketsStyles";
import { PtoBodiesTable } from "@/features/pto/PtoBodiesTable";
import { usePtoBodiesVirtualGrid } from "@/features/pto/usePtoBodiesVirtualGrid";
import { usePtoBucketsGridEditing } from "@/features/pto/usePtoBucketsGridEditing";
import { usePtoGridViewport } from "@/features/pto/usePtoGridViewport";
import type { PtoMatrixHeaderEditor } from "@/features/pto/ptoMatrixHeaderEditing";
import type { PtoBodyColumn } from "@/lib/domain/pto/bodies";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";

type PtoBodiesSectionProps = {
  ptoAreaTabs: string[];
  ptoAreaFilter: string;
  onSelectArea: (area: string) => void;
  rows: PtoBucketRow[];
  columns: PtoBodyColumn[];
  values: Record<string, number>;
  headerEditor: PtoMatrixHeaderEditor;
  onCommitValue: (cellKey: string, draft: string) => void;
  onClearCells: (cellKeys: string[]) => void;
};

const emptyDumpTrucksHint = "\u0412 \u0430\u0434\u043c\u0438\u043d\u043a\u0435 \u0434\u043e\u0431\u0430\u0432\u044c \u0441\u0430\u043c\u043e\u0441\u0432\u0430\u043b\u044b. \u0417\u0434\u0435\u0441\u044c \u0441\u0442\u0440\u043e\u043a\u0438 \u0444\u043e\u0440\u043c\u0438\u0440\u0443\u044e\u0442\u0441\u044f \u0438\u0437 \u0443\u043d\u0438\u043a\u0430\u043b\u044c\u043d\u044b\u0445 \u0441\u043e\u0447\u0435\u0442\u0430\u043d\u0438\u0439 \u041c\u0430\u0440\u043a\u0430 \u041c\u043e\u0434\u0435\u043b\u044c.";
const emptyMaterialsHint = "\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044b \u043f\u043e\u0433\u0440\u0443\u0437\u043a\u0438 \u043f\u043e\u043a\u0430 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b. \u041a\u043e\u043b\u043e\u043d\u043a\u0438 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u0430 \u043f\u043e\u0433\u0440\u0443\u0437\u043a\u0438.";

export default function PtoBodiesSection({
  ptoAreaTabs,
  ptoAreaFilter,
  onSelectArea,
  rows,
  columns,
  values,
  headerEditor,
  onCommitValue,
  onClearCells,
}: PtoBodiesSectionProps) {
  const defaultDraftArea = ptoAreaFilter === allAreasLabel ? "" : ptoAreaFilter;
  const { scrollRef, viewport, updateViewport, scheduleViewportUpdate } = usePtoGridViewport();
  const {
    activeCell,
    draft,
    commitActiveEdit,
    editKey,
    editingMode,
    handleCellBlur,
    handleCellDraftChange,
    handleCellKeyDown,
    handleCellMouseDown,
    selectCell,
    selectedBucketKeys,
    startEdit,
    toggleEditingMode,
  } = usePtoBucketsGridEditing({
    rows,
    columns,
    defaultDraftArea,
    frozenWidth: bodyTechniqueColumnWidth,
    scrollRef,
    updateViewport,
    onCommitValue,
    onClearCells,
    onAddManualRow: () => false,
  });
  const virtualGrid = usePtoBodiesVirtualGrid({
    rows,
    columns,
    viewport,
  });
  const handleScheduleViewportUpdate = useCallback(() => {
    commitActiveEdit();
    scheduleViewportUpdate();
  }, [commitActiveEdit, scheduleViewportUpdate]);

  return (
    <div style={ptoBucketsLayoutStyle}>
      <PtoBucketsToolbar
        editingMode={editingMode}
        onSelectArea={onSelectArea}
        onToggleEditingMode={toggleEditingMode}
        ptoAreaFilter={ptoAreaFilter}
        ptoAreaTabs={ptoAreaTabs}
      />

      {rows.length === 0 ? (
        <div style={ptoBucketsHintStyle}>{emptyDumpTrucksHint}</div>
      ) : null}

      {columns.length === 0 ? (
        <div style={ptoBucketsHintStyle}>{emptyMaterialsHint}</div>
      ) : null}

      <PtoBodiesTable
        activeCell={activeCell}
        columns={columns}
        draft={draft}
        editKey={editKey}
        editingMode={editingMode}
        headerEditor={headerEditor}
        renderedColumnSpan={virtualGrid.renderedColumnSpan}
        rows={rows}
        scrollRef={scrollRef}
        selectedBucketKeys={selectedBucketKeys}
        tableMinWidth={virtualGrid.tableMinWidth}
        values={values}
        virtualColumns={virtualGrid.virtualColumns}
        virtualRows={virtualGrid.virtualRows}
        onCellBlur={handleCellBlur}
        onCellDraftChange={handleCellDraftChange}
        onCellKeyDown={handleCellKeyDown}
        onCellMouseDown={handleCellMouseDown}
        onScheduleViewportUpdate={handleScheduleViewportUpdate}
        onSelectCell={selectCell}
        onStartEdit={startEdit}
      />
    </div>
  );
}
