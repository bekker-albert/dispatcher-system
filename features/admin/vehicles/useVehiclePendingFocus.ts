"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { vehicleInlineFieldDomKey, type VehicleInlineField } from "@/lib/domain/vehicles/grid";

type MutableRef<T> = {
  current: T;
};

type VehicleSelectionAnchor = {
  id: number;
  field: VehicleInlineField;
};

export type PendingVehicleFocus = VehicleSelectionAnchor & {
  edit?: boolean;
  selectContents?: boolean;
};

type VehiclePendingFocusOptions = {
  pendingVehicleFocus: PendingVehicleFocus | null;
  setPendingVehicleFocus: Dispatch<SetStateAction<PendingVehicleFocus | null>>;
  vehicleSelectionAnchorRef: MutableRef<VehicleSelectionAnchor | null>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleSelectionAnchor | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
};

export function useVehiclePendingFocus({
  pendingVehicleFocus,
  setPendingVehicleFocus,
  vehicleSelectionAnchorRef,
  setActiveVehicleCell,
  setEditingVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
}: VehiclePendingFocusOptions) {
  useEffect(() => {
    if (!pendingVehicleFocus) return undefined;

    const fieldKey = vehicleInlineFieldDomKey(pendingVehicleFocus.id, pendingVehicleFocus.field);
    setActiveVehicleCell(fieldKey);
    setEditingVehicleCell(pendingVehicleFocus.edit ? fieldKey : null);
    vehicleSelectionAnchorRef.current = { id: pendingVehicleFocus.id, field: pendingVehicleFocus.field };
    setVehicleSelectionAnchorCell({ id: pendingVehicleFocus.id, field: pendingVehicleFocus.field });
    setSelectedVehicleCellKeys([fieldKey]);

    const timeoutId = window.setTimeout(() => {
      if (pendingVehicleFocus.edit) {
        const input = document.querySelector<HTMLInputElement>(`[data-admin-vehicle-input="${fieldKey}"]`);
        input?.focus();

        if (pendingVehicleFocus.selectContents !== false) {
          try {
            input?.select();
          } catch {
            // Number inputs do not support text selection APIs in some browsers.
          }
        } else {
          const cursorPosition = String(input?.value ?? "").length;
          try {
            input?.setSelectionRange(cursorPosition, cursorPosition);
          } catch {
            // Number inputs do not support text selection APIs in some browsers.
          }
        }
      } else {
        document.querySelector<HTMLElement>(`[data-admin-vehicle-cell="${fieldKey}"]`)?.focus();
      }

      setPendingVehicleFocus(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    pendingVehicleFocus,
    setActiveVehicleCell,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    setVehicleSelectionAnchorCell,
    vehicleSelectionAnchorRef,
  ]);
}
