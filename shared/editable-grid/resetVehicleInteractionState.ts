import type { Dispatch, SetStateAction } from "react";

type NullableStateSetter<T> = Dispatch<SetStateAction<T | null>>;

type VehicleInteractionStateResetTarget<PendingFocus, SelectionAnchor> = {
  setActiveVehicleCell: NullableStateSetter<string>;
  setAdminVehiclesEditing: Dispatch<SetStateAction<boolean>>;
  setEditingVehicleCell: NullableStateSetter<string>;
  setPendingVehicleFocus: NullableStateSetter<PendingFocus>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  setVehicleCellInitialDraft: Dispatch<SetStateAction<string>>;
  setVehicleSelectionAnchorCell: NullableStateSetter<SelectionAnchor>;
};

export function resetVehicleInteractionState<PendingFocus, SelectionAnchor>({
  setActiveVehicleCell,
  setAdminVehiclesEditing,
  setEditingVehicleCell,
  setPendingVehicleFocus,
  setSelectedVehicleCellKeys,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  setVehicleSelectionAnchorCell,
}: VehicleInteractionStateResetTarget<PendingFocus, SelectionAnchor>) {
  setAdminVehiclesEditing((current) => (current ? false : current));
  setPendingVehicleFocus((current) => (current === null ? current : null));
  setActiveVehicleCell((current) => (current === null ? current : null));
  setVehicleSelectionAnchorCell((current) => (current === null ? current : null));
  setSelectedVehicleCellKeys((current) => (current.length === 0 ? current : []));
  setEditingVehicleCell((current) => (current === null ? current : null));
  setVehicleCellDraft((current) => (current === "" ? current : ""));
  setVehicleCellInitialDraft((current) => (current === "" ? current : ""));
}
