import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { toggleEditableGridSelectionKey } from "@/shared/editable-grid/selection";
import { vehicleCellKey, vehicleCellRangeKeys, type VehicleCell } from "./vehicleInlineGridModel";

type ResolveVehicleInlineSelectionOptions = {
  rows: VehicleRow[];
  currentKeys: string[];
  anchorCell: VehicleCell | null;
  targetCell: VehicleCell;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

type VehicleInlineSelectionResult = {
  activeKey: string;
  selectedKeys: string[];
  nextAnchorCell: VehicleCell | null;
};

export function resolveVehicleInlineSelection({
  rows,
  currentKeys,
  anchorCell,
  targetCell,
  ctrlKey,
  metaKey,
  shiftKey,
}: ResolveVehicleInlineSelectionOptions): VehicleInlineSelectionResult {
  const activeKey = vehicleCellKey(targetCell);

  if (ctrlKey || metaKey) {
    return {
      activeKey,
      selectedKeys: toggleEditableGridSelectionKey(currentKeys, activeKey),
      nextAnchorCell: targetCell,
    };
  }

  if (shiftKey && anchorCell) {
    return {
      activeKey,
      selectedKeys: vehicleCellRangeKeys(rows, anchorCell, targetCell),
      nextAnchorCell: null,
    };
  }

  return {
    activeKey,
    selectedKeys: [activeKey],
    nextAnchorCell: targetCell,
  };
}

export function resolveVehicleInlineDragSelection(
  rows: VehicleRow[],
  anchorCell: VehicleCell,
  targetCell: VehicleCell,
) {
  return {
    activeKey: vehicleCellKey(targetCell),
    selectedKeys: vehicleCellRangeKeys(rows, anchorCell, targetCell),
  };
}
