"use client";

import { PtoBucketsToolbar } from "@/features/pto/PtoBucketsToolbar";
import { allAreasLabel } from "@/features/pto/ptoBucketsConfig";
import { ptoBucketsHintStyle, ptoBucketsLayoutStyle } from "@/features/pto/ptoBucketsStyles";
import { PtoPerformanceTable } from "@/features/pto/PtoPerformanceTable";
import { usePtoBucketsGridEditing } from "@/features/pto/usePtoBucketsGridEditing";
import { usePtoGridViewport } from "@/features/pto/usePtoGridViewport";
import type { PtoMatrixHeaderEditor } from "@/features/pto/ptoMatrixHeaderEditing";
import type { PtoPerformanceColumn, PtoPerformanceRow } from "@/lib/domain/pto/performance";

type PtoPerformanceSectionProps = {
  ptoAreaTabs: string[];
  ptoAreaFilter: string;
  onSelectArea: (area: string) => void;
  rows: PtoPerformanceRow[];
  columns: PtoPerformanceColumn[];
  values: Record<string, number>;
  headerEditor: PtoMatrixHeaderEditor;
  onCommitValue: (cellKey: string, draft: string) => void;
  onClearCells: (cellKeys: string[]) => void;
};

export default function PtoPerformanceSection({
  ptoAreaTabs,
  ptoAreaFilter,
  onSelectArea,
  rows,
  columns,
  values,
  headerEditor,
  onCommitValue,
  onClearCells,
}: PtoPerformanceSectionProps) {
  const defaultDraftArea = ptoAreaFilter === allAreasLabel ? "" : ptoAreaFilter;
  const { scrollRef, updateViewport, scheduleViewportUpdate } = usePtoGridViewport();
  const {
    activeCell,
    draft,
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
    scrollRef,
    updateViewport,
    onCommitValue,
    onClearCells,
    onAddManualRow: () => false,
  });

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
        <div style={ptoBucketsHintStyle}>
          В Плане, Оперучете или Замере пока нет строк с участком и видом работ.
        </div>
      ) : null}

      <PtoPerformanceTable
        activeCell={activeCell}
        columns={columns}
        draft={draft}
        editKey={editKey}
        editingMode={editingMode}
        headerEditor={headerEditor}
        rows={rows}
        scrollRef={scrollRef}
        selectedBucketKeys={selectedBucketKeys}
        values={values}
        onCellBlur={handleCellBlur}
        onCellDraftChange={handleCellDraftChange}
        onCellKeyDown={handleCellKeyDown}
        onCellMouseDown={handleCellMouseDown}
        onScheduleViewportUpdate={scheduleViewportUpdate}
        onSelectCell={selectCell}
        onStartEdit={startEdit}
      />
    </div>
  );
}
