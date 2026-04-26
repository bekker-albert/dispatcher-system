"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import type { VehicleInlineField } from "@/lib/domain/vehicles/grid";

type MutableRef<T> = {
  current: T;
};

type VehicleSelectionAnchor = {
  id: number;
  field: VehicleInlineField;
};

type GlobalCellSelectionEffectsOptions = {
  ptoSelectionDraggingRef: MutableRef<boolean>;
  vehicleSelectionDraggingRef: MutableRef<boolean>;
  vehicleSelectionAnchorRef: MutableRef<VehicleSelectionAnchor | null>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleSelectionAnchor | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setPtoFormulaCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoFormulaDraft: Dispatch<SetStateAction<string>>;
  setPtoInlineEditCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoInlineEditInitialDraft: Dispatch<SetStateAction<string>>;
  setPtoSelectionAnchorCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoSelectedCellKeys: Dispatch<SetStateAction<string[]>>;
};

const selectableCellSelector = [
  "[data-admin-vehicle-cell]",
  "[data-admin-vehicle-input]",
  "[data-pto-cell-key]",
  "[data-pto-bucket-cell]",
].join(",");

export function useGlobalCellSelectionEffects({
  ptoSelectionDraggingRef,
  vehicleSelectionDraggingRef,
  vehicleSelectionAnchorRef,
  setActiveVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
  setEditingVehicleCell,
  setPtoFormulaCell,
  setPtoFormulaDraft,
  setPtoInlineEditCell,
  setPtoInlineEditInitialDraft,
  setPtoSelectionAnchorCell,
  setPtoSelectedCellKeys,
}: GlobalCellSelectionEffectsOptions) {
  useEffect(() => {
    const stopSelectionDrag = () => {
      ptoSelectionDraggingRef.current = false;
      vehicleSelectionDraggingRef.current = false;
    };

    window.addEventListener("mouseup", stopSelectionDrag);
    return () => window.removeEventListener("mouseup", stopSelectionDrag);
  }, [ptoSelectionDraggingRef, vehicleSelectionDraggingRef]);

  useEffect(() => {
    const clearCellSelectionsOnOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(selectableCellSelector)) return;

      vehicleSelectionDraggingRef.current = false;
      vehicleSelectionAnchorRef.current = null;
      ptoSelectionDraggingRef.current = false;

      setActiveVehicleCell((current) => (current === null ? current : null));
      setVehicleSelectionAnchorCell((current) => (current === null ? current : null));
      setSelectedVehicleCellKeys((current) => (current.length === 0 ? current : []));
      setEditingVehicleCell((current) => (current === null ? current : null));

      setPtoFormulaCell((current) => (current === null ? current : null));
      setPtoFormulaDraft((current) => (current === "" ? current : ""));
      setPtoInlineEditCell((current) => (current === null ? current : null));
      setPtoInlineEditInitialDraft((current) => (current === "" ? current : ""));
      setPtoSelectionAnchorCell((current) => (current === null ? current : null));
      setPtoSelectedCellKeys((current) => (current.length === 0 ? current : []));
    };

    window.addEventListener("mousedown", clearCellSelectionsOnOutsideClick);
    return () => window.removeEventListener("mousedown", clearCellSelectionsOnOutsideClick);
  }, [
    ptoSelectionDraggingRef,
    setActiveVehicleCell,
    setEditingVehicleCell,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectedCellKeys,
    setPtoSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setVehicleSelectionAnchorCell,
    vehicleSelectionAnchorRef,
    vehicleSelectionDraggingRef,
  ]);
}
