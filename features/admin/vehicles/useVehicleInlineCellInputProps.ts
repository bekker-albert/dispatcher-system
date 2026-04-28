"use client";

import {
  useCallback,
  useMemo,
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  vehicleInlineFieldDomKey,
  type VehicleInlineField,
} from "@/lib/domain/vehicles/grid";

type UseVehicleInlineCellInputPropsOptions = {
  activeVehicleCell: string | null;
  selectedVehicleCellKeys: string[];
  editingVehicleCell: string | null;
  vehicleCellDraft: string;
  vehicleCellSkipBlurCommitRef: MutableRefObject<boolean>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  startVehicleInlineSelection: (id: number, field: VehicleInlineField, event: MouseEvent<HTMLElement>) => void;
  extendVehicleInlineSelection: (id: number, field: VehicleInlineField, event: MouseEvent<HTMLElement>) => void;
  startVehicleInlineCellEdit: (id: number, field: VehicleInlineField, draftOverride?: string) => void;
  commitVehicleInlineCellEdit: (id: number, field: VehicleInlineField) => void;
  handleVehicleCellKeyDown: (
    event: KeyboardEvent<HTMLElement>,
    id: number,
    field: VehicleInlineField,
    editing: boolean,
  ) => void;
};

export function useVehicleInlineCellInputProps({
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
}: UseVehicleInlineCellInputPropsOptions) {
  const selectedVehicleCellKeySet = useMemo(() => new Set(selectedVehicleCellKeys), [selectedVehicleCellKeys]);

  return useCallback((id: number, field: VehicleInlineField) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);

    return {
      active: activeVehicleCell === fieldKey,
      selected: selectedVehicleCellKeySet.has(fieldKey),
      editing: editingVehicleCell === fieldKey,
      draft: vehicleCellDraft,
      fieldKey,
      onSelect: (event: MouseEvent<HTMLElement>) => startVehicleInlineSelection(id, field, event),
      onExtendSelection: (event: MouseEvent<HTMLElement>) => extendVehicleInlineSelection(id, field, event),
      onStartEdit: () => startVehicleInlineCellEdit(id, field),
      onDraftChange: setVehicleCellDraft,
      onCommitEdit: () => {
        if (vehicleCellSkipBlurCommitRef.current) {
          vehicleCellSkipBlurCommitRef.current = false;
          return;
        }

        if (editingVehicleCell === fieldKey) commitVehicleInlineCellEdit(id, field);
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleVehicleCellKeyDown(event, id, field, editingVehicleCell === fieldKey),
    };
  }, [
    activeVehicleCell,
    commitVehicleInlineCellEdit,
    editingVehicleCell,
    extendVehicleInlineSelection,
    handleVehicleCellKeyDown,
    selectedVehicleCellKeySet,
    setVehicleCellDraft,
    startVehicleInlineCellEdit,
    startVehicleInlineSelection,
    vehicleCellDraft,
    vehicleCellSkipBlurCommitRef,
  ]);
}
