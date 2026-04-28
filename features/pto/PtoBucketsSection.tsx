"use client";

import { PtoBucketsTable } from "@/features/pto/PtoBucketsTable";
import { PtoBucketsToolbar } from "@/features/pto/PtoBucketsToolbar";
import { allAreasLabel } from "@/features/pto/ptoBucketsConfig";
import { ptoBucketsHintStyle, ptoBucketsLayoutStyle } from "@/features/pto/ptoBucketsStyles";
import { usePtoBucketsGridEditing } from "@/features/pto/usePtoBucketsGridEditing";
import { usePtoBucketsVirtualGrid } from "@/features/pto/usePtoBucketsVirtualGrid";
import { usePtoGridViewport } from "@/features/pto/usePtoGridViewport";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";

type PtoBucketsSectionProps = {
  ptoAreaTabs: string[];
  ptoAreaFilter: string;
  onSelectArea: (area: string) => void;
  rows: PtoBucketRow[];
  columns: PtoBucketColumn[];
  values: Record<string, number>;
  onCommitValue: (cellKey: string, draft: string) => void;
  onClearCells: (cellKeys: string[]) => void;
  onAddManualRow: (area: string, structure: string) => boolean;
  onDeleteManualRow: (row: PtoBucketRow) => void;
};

export default function PtoBucketsSection({
  ptoAreaTabs,
  ptoAreaFilter,
  onSelectArea,
  rows,
  columns,
  values,
  onCommitValue,
  onClearCells,
  onAddManualRow,
  onDeleteManualRow,
}: PtoBucketsSectionProps) {
  const defaultDraftArea = ptoAreaFilter === allAreasLabel ? "" : ptoAreaFilter;
  const { scrollRef, viewport, updateViewport, scheduleViewportUpdate } = usePtoGridViewport();
  const {
    tableMinWidth,
    virtualRows,
    virtualColumns,
    renderedColumnSpan,
  } = usePtoBucketsVirtualGrid({ rows, columns, viewport });
  const {
    activeCell,
    addManualRow,
    draft,
    draftRow,
    editKey,
    editingMode,
    handleCellBlur,
    handleCellDraftChange,
    handleCellKeyDown,
    handleCellMouseDown,
    selectCell,
    selectedBucketKeys,
    setDraftRowArea,
    setDraftRowStructure,
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
    onAddManualRow,
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

      {columns.length === 0 ? (
        <div style={ptoBucketsHintStyle}>
          Добавь в админке погрузочную технику с видом &quot;Экскаватор&quot; или &quot;Погрузчик&quot;. Здесь автоматически появятся столбцы Марка Модель.
        </div>
      ) : null}

      <PtoBucketsTable
        activeCell={activeCell}
        draft={draft}
        draftRow={draftRow}
        editKey={editKey}
        editingMode={editingMode}
        ptoAreaFilter={ptoAreaFilter}
        renderedColumnSpan={renderedColumnSpan}
        rows={rows}
        scrollRef={scrollRef}
        selectedBucketKeys={selectedBucketKeys}
        tableMinWidth={tableMinWidth}
        values={values}
        virtualColumns={virtualColumns}
        virtualRows={virtualRows}
        onAddManualRow={addManualRow}
        onCellBlur={handleCellBlur}
        onCellDraftChange={handleCellDraftChange}
        onCellKeyDown={handleCellKeyDown}
        onCellMouseDown={handleCellMouseDown}
        onDeleteManualRow={onDeleteManualRow}
        onScheduleViewportUpdate={scheduleViewportUpdate}
        onSelectCell={selectCell}
        onSetDraftRowArea={setDraftRowArea}
        onSetDraftRowStructure={setDraftRowStructure}
        onStartEdit={startEdit}
      />

      {editingMode ? (
        <datalist id="pto-bucket-area-options">
          {ptoAreaTabs.filter((area) => area !== allAreasLabel).map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
