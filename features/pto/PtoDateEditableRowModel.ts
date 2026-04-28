import type { CSSProperties } from "react";
import type { PtoFormulaCellWithoutScope } from "@/features/pto/ptoDateFormulaTypes";
import type { PtoDropTarget } from "@/features/pto/ptoDateInteractionTypes";
import type { PtoRowDateTotals } from "@/features/pto/ptoDateTableModel";
import { ptoDropIndicatorStyle } from "@/features/pto/ptoDateTableStyles";
import type { PtoDateOptionMaps } from "@/features/pto/ptoDateTableTypes";
import {
  ptoAutomatedStatus,
  ptoStatusRowBackground,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import { cleanAreaName, normalizeLookupValue } from "@/lib/utils/text";

type PtoDateEditableRowModelOptions = {
  row: PtoPlanRow;
  rowIndex: number;
  filteredRowsLength: number;
  showLocation: boolean;
  ptoDateEditing: boolean;
  ptoDateOptionMaps: PtoDateOptionMaps;
  ptoDropTarget: PtoDropTarget | null;
  tableMinWidth: number;
  reportDate: string;
  getEffectiveCarryover: (row: PtoPlanRow) => number;
  getRowDateTotals: (row: PtoPlanRow) => PtoRowDateTotals | undefined;
  formulaCellsByRowId: Map<string, PtoFormulaCellWithoutScope[]>;
  ptoTab: string;
  ptoRowHeights: Record<string, number>;
};

export function createPtoDateEditableRowModel({
  row,
  rowIndex,
  filteredRowsLength,
  showLocation,
  ptoDateEditing,
  ptoDateOptionMaps,
  ptoDropTarget,
  tableMinWidth,
  reportDate,
  getEffectiveCarryover,
  getRowDateTotals,
  formulaCellsByRowId,
  ptoTab,
  ptoRowHeights,
}: PtoDateEditableRowModelOptions) {
  const rowAreaFilter = cleanAreaName(row.area) || "Все участки";
  const rowAreaKey = rowAreaFilter === "Все участки"
    ? ptoDateOptionMaps.allAreasKey
    : normalizeLookupValue(rowAreaFilter);
  const rowLocationKey = normalizeLookupValue(row.location);
  const locationOptions = showLocation
    ? ptoDateOptionMaps.locationsByArea.get(rowAreaKey) ?? []
    : [];
  const structureOptions = showLocation && rowLocationKey
    ? ptoDateOptionMaps.structuresByAreaLocation.get(`${rowAreaKey}:${rowLocationKey}`) ?? []
    : ptoDateOptionMaps.structuresByArea.get(rowAreaKey) ?? [];
  const locationListId = `pto-location-${row.id}`;
  const structureListId = `pto-structure-${row.id}`;
  const isDropTarget = ptoDropTarget?.rowId === row.id;
  const dropLineStyle: CSSProperties | null = ptoDateEditing && isDropTarget
    ? {
        ...ptoDropIndicatorStyle,
        width: tableMinWidth,
        ...(ptoDropTarget.position === "before" ? { top: -2 } : { bottom: -2 }),
      }
    : null;
  const showInlineAddRowButton = ptoDateEditing && rowIndex < filteredRowsLength - 1;
  const rowStatus = ptoAutomatedStatus(row, reportDate);
  const effectiveCarryover = getEffectiveCarryover(row);
  const rowDateTotals = getRowDateTotals(row);
  const rowYearTotalWithCarryover = Math.round(((rowDateTotals?.yearDailyTotal ?? 0) + effectiveCarryover) * 1000000) / 1000000;
  const rowFormulaCells = formulaCellsByRowId.get(row.id) ?? [];
  const rowHeightKey = `${ptoTab}:${row.id}`;
  const rowHeight = ptoRowHeights[rowHeightKey];
  const rowStyle = {
    background: ptoStatusRowBackground(rowStatus),
    ...(rowHeight ? { height: rowHeight } : null),
  };

  return {
    dropLineStyle,
    effectiveCarryover,
    locationListId,
    locationOptions,
    rowDateTotals,
    rowFormulaCells,
    rowHeightKey,
    rowStatus,
    rowStyle,
    rowYearTotalWithCarryover,
    showInlineAddRowButton,
    structureListId,
    structureOptions,
  };
}
