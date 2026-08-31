"use client";

import { useCallback, type ChangeEvent } from "react";

import { PtoBucketsToolbar } from "@/features/pto/PtoBucketsToolbar";
import { allAreasLabel } from "@/features/pto/ptoBucketsConfig";
import { bodyTechniqueColumnWidth } from "@/features/pto/ptoBodiesConfig";
import { ptoBucketsLayoutStyle } from "@/features/pto/ptoBucketsStyles";
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
  onExportToExcel: () => void | Promise<void>;
  onImportFromExcel: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onAddArea: () => void;
  onAddMaterial: () => void;
};

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
  onExportToExcel,
  onImportFromExcel,
  onAddArea,
  onAddMaterial,
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
        onExportToExcel={onExportToExcel}
        onImportFromExcel={onImportFromExcel}
        onAddArea={onAddArea}
        onAddMaterial={onAddMaterial}
        ptoAreaFilter={ptoAreaFilter}
        ptoAreaTabs={ptoAreaTabs}
      />

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
