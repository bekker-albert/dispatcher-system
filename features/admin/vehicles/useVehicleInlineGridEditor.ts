import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { VehicleCell } from "./vehicleInlineGridModel";
import { useVehicleInlineCellEdit } from "./useVehicleInlineCellEdit";
import { useVehicleInlineCellInputProps } from "./useVehicleInlineCellInputProps";
import { useVehicleInlineCellKeyboard } from "./useVehicleInlineCellKeyboard";
import { useVehicleInlineCellSelection } from "./useVehicleInlineCellSelection";
import type { PendingVehicleFocus } from "./useVehiclePendingFocus";

type UseVehicleInlineGridEditorOptions = {
  vehicleRows: VehicleRow[];
  visibleVehicleRows: VehicleRow[];
  activeVehicleCell: string | null;
  selectedVehicleCellKeys: string[];
  editingVehicleCell: string | null;
  vehicleCellDraft: string;
  vehicleCellInitialDraft: string;
  vehicleSelectionAnchorCell: VehicleCell | null;
  vehicleCellSkipBlurCommitRef: MutableRefObject<boolean>;
  vehicleSelectionDraggingRef: MutableRefObject<boolean>;
  vehicleSelectionAnchorRef: MutableRefObject<VehicleCell | null>;
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleCell | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  setVehicleCellInitialDraft: Dispatch<SetStateAction<string>>;
  setPendingVehicleFocus: Dispatch<SetStateAction<PendingVehicleFocus | null>>;
  updateVehicleRow: (id: number, field: VehicleInlineField, value: string) => void;
  pushVehicleUndoSnapshot: () => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useVehicleInlineGridEditor({
  vehicleRows,
  visibleVehicleRows,
  activeVehicleCell,
  selectedVehicleCellKeys,
  editingVehicleCell,
  vehicleCellDraft,
  vehicleCellInitialDraft,
  vehicleSelectionAnchorCell,
  vehicleCellSkipBlurCommitRef,
  vehicleSelectionDraggingRef,
  vehicleSelectionAnchorRef,
  setVehicleRows,
  setActiveVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
  setEditingVehicleCell,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  setPendingVehicleFocus,
  updateVehicleRow,
  pushVehicleUndoSnapshot,
  addAdminLog,
}: UseVehicleInlineGridEditorOptions) {
  const {
    extendVehicleInlineSelection,
    startVehicleInlineSelection,
  } = useVehicleInlineCellSelection({
    visibleVehicleRows,
    selectedVehicleCellKeys,
    vehicleSelectionAnchorCell,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    setActiveVehicleCell,
    setEditingVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
  });

  const {
    cancelVehicleInlineCellEdit,
    clearSelectedVehicleCells,
    commitVehicleInlineCellEdit,
    focusVehicleCellByOffset,
    startVehicleInlineCellEdit,
  } = useVehicleInlineCellEdit({
    vehicleRows,
    visibleVehicleRows,
    selectedVehicleCellKeys,
    vehicleCellDraft,
    vehicleCellInitialDraft,
    vehicleCellSkipBlurCommitRef,
    vehicleSelectionAnchorRef,
    setVehicleRows,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setPendingVehicleFocus,
    updateVehicleRow,
    pushVehicleUndoSnapshot,
    addAdminLog,
  });

  const handleVehicleCellKeyDown = useVehicleInlineCellKeyboard({
    activeVehicleCell,
    cancelVehicleInlineCellEdit,
    clearSelectedVehicleCells,
    commitVehicleInlineCellEdit,
    focusVehicleCellByOffset,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    startVehicleInlineCellEdit,
  });

  const vehicleCellInputProps = useVehicleInlineCellInputProps({
    activeVehicleCell,
    selectedVehicleCellKeys,
    editingVehicleCell,
    vehicleCellDraft,
    vehicleCellSkipBlurCommitRef,
    setVehicleCellDraft,
    startVehicleInlineSelection,
    extendVehicleInlineSelection,
    startVehicleInlineCellEdit,
    commitVehicleInlineCellEdit,
    handleVehicleCellKeyDown,
  });

  return {
    commitVehicleInlineCellEdit,
    vehicleCellInputProps,
  };
}
