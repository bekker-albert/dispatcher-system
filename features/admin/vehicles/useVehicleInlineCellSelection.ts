"use client";

import {
  useCallback,
  type Dispatch,
  type MouseEvent,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { VehicleCell } from "./vehicleInlineGridModel";
import {
  resolveVehicleInlineDragSelection,
  resolveVehicleInlineSelection,
} from "./vehicleInlineSelection";

type UseVehicleInlineCellSelectionOptions = {
  visibleVehicleRows: VehicleRow[];
  selectedVehicleCellKeys: string[];
  vehicleSelectionAnchorCell: VehicleCell | null;
  vehicleSelectionDraggingRef: MutableRefObject<boolean>;
  vehicleSelectionAnchorRef: MutableRefObject<VehicleCell | null>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleCell | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
};

export function useVehicleInlineCellSelection({
  visibleVehicleRows,
  selectedVehicleCellKeys,
  vehicleSelectionAnchorCell,
  vehicleSelectionDraggingRef,
  vehicleSelectionAnchorRef,
  setActiveVehicleCell,
  setEditingVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
}: UseVehicleInlineCellSelectionOptions) {
  const selectVehicleInlineCell = useCallback((id: number, field: VehicleInlineField, event?: MouseEvent<HTMLElement>) => {
    const targetCell = { id, field };
    const nextSelection = resolveVehicleInlineSelection({
      rows: visibleVehicleRows,
      currentKeys: selectedVehicleCellKeys,
      anchorCell: vehicleSelectionAnchorCell,
      targetCell,
      ctrlKey: event?.ctrlKey,
      metaKey: event?.metaKey,
      shiftKey: event?.shiftKey,
    });

    setActiveVehicleCell(nextSelection.activeKey);
    setEditingVehicleCell((current) => (current === nextSelection.activeKey ? current : null));
    if (nextSelection.nextAnchorCell) {
      vehicleSelectionAnchorRef.current = nextSelection.nextAnchorCell;
      setVehicleSelectionAnchorCell(nextSelection.nextAnchorCell);
    }
    setSelectedVehicleCellKeys(nextSelection.selectedKeys);
  }, [
    selectedVehicleCellKeys,
    setActiveVehicleCell,
    setEditingVehicleCell,
    setSelectedVehicleCellKeys,
    setVehicleSelectionAnchorCell,
    vehicleSelectionAnchorCell,
    vehicleSelectionAnchorRef,
    visibleVehicleRows,
  ]);

  const extendVehicleInlineSelection = useCallback((id: number, field: VehicleInlineField, event: MouseEvent<HTMLElement>) => {
    if (!vehicleSelectionDraggingRef.current || event.buttons !== 1 || event.ctrlKey || event.metaKey) return;

    const targetCell = { id, field };
    const anchorCell = vehicleSelectionAnchorRef.current ?? vehicleSelectionAnchorCell ?? targetCell;
    const nextSelection = resolveVehicleInlineDragSelection(visibleVehicleRows, anchorCell, targetCell);
    setActiveVehicleCell(nextSelection.activeKey);
    setEditingVehicleCell(null);
    setSelectedVehicleCellKeys(nextSelection.selectedKeys);
  }, [
    setActiveVehicleCell,
    setEditingVehicleCell,
    setSelectedVehicleCellKeys,
    vehicleSelectionAnchorCell,
    vehicleSelectionAnchorRef,
    vehicleSelectionDraggingRef,
    visibleVehicleRows,
  ]);

  const startVehicleInlineSelection = useCallback((id: number, field: VehicleInlineField, event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    vehicleSelectionDraggingRef.current = true;
    selectVehicleInlineCell(id, field, event);
  }, [selectVehicleInlineCell, vehicleSelectionDraggingRef]);

  return {
    extendVehicleInlineSelection,
    startVehicleInlineSelection,
  };
}
