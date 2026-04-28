"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaTypes";
import type { VehicleInlineField } from "@/lib/domain/vehicles/grid";

type MutableRef<T> = {
  current: T;
};

type VehicleSelectionAnchor = {
  id: number;
  field: VehicleInlineField;
};

type GlobalCellSelectionEffectsOptions = {
  ptoSelectionActive: boolean;
  vehicleSelectionActive: boolean;
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

const vehicleCellSelector = [
  "[data-admin-vehicle-cell]",
  "[data-admin-vehicle-input]",
].join(",");

const ptoCellSelector = [
  "[data-pto-cell-key]",
  "[data-pto-bucket-cell]",
].join(",");

export function useGlobalCellSelectionEffects({
  ptoSelectionActive,
  vehicleSelectionActive,
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
    if (!ptoSelectionActive && !vehicleSelectionActive) return;

    const stopSelectionDrag = () => {
      if (ptoSelectionActive) ptoSelectionDraggingRef.current = false;
      if (vehicleSelectionActive) vehicleSelectionDraggingRef.current = false;
    };

    window.addEventListener("mouseup", stopSelectionDrag);
    return () => window.removeEventListener("mouseup", stopSelectionDrag);
  }, [
    ptoSelectionActive,
    ptoSelectionDraggingRef,
    vehicleSelectionActive,
    vehicleSelectionDraggingRef,
  ]);

  useEffect(() => {
    if (vehicleSelectionActive) return;

    vehicleSelectionDraggingRef.current = false;
    vehicleSelectionAnchorRef.current = null;
    setActiveVehicleCell((current) => (current === null ? current : null));
    setVehicleSelectionAnchorCell((current) => (current === null ? current : null));
    setSelectedVehicleCellKeys((current) => (current.length === 0 ? current : []));
    setEditingVehicleCell((current) => (current === null ? current : null));
  }, [
    setActiveVehicleCell,
    setEditingVehicleCell,
    setSelectedVehicleCellKeys,
    setVehicleSelectionAnchorCell,
    vehicleSelectionActive,
    vehicleSelectionAnchorRef,
    vehicleSelectionDraggingRef,
  ]);

  useEffect(() => {
    if (ptoSelectionActive) return;

    ptoSelectionDraggingRef.current = false;
    setPtoFormulaCell((current) => (current === null ? current : null));
    setPtoFormulaDraft((current) => (current === "" ? current : ""));
    setPtoInlineEditCell((current) => (current === null ? current : null));
    setPtoInlineEditInitialDraft((current) => (current === "" ? current : ""));
    setPtoSelectionAnchorCell((current) => (current === null ? current : null));
    setPtoSelectedCellKeys((current) => (current.length === 0 ? current : []));
  }, [
    ptoSelectionActive,
    ptoSelectionDraggingRef,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectedCellKeys,
    setPtoSelectionAnchorCell,
  ]);

  useEffect(() => {
    if (!ptoSelectionActive && !vehicleSelectionActive) return;

    const clearCellSelectionsOnOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const activeSelectors = [
        vehicleSelectionActive ? vehicleCellSelector : "",
        ptoSelectionActive ? ptoCellSelector : "",
      ].filter(Boolean).join(",");

      if (activeSelectors && target.closest(activeSelectors)) return;

      if (vehicleSelectionActive) {
        vehicleSelectionDraggingRef.current = false;
        vehicleSelectionAnchorRef.current = null;

        setActiveVehicleCell((current) => (current === null ? current : null));
        setVehicleSelectionAnchorCell((current) => (current === null ? current : null));
        setSelectedVehicleCellKeys((current) => (current.length === 0 ? current : []));
        setEditingVehicleCell((current) => (current === null ? current : null));
      }

      if (ptoSelectionActive) {
        ptoSelectionDraggingRef.current = false;

        setPtoFormulaCell((current) => (current === null ? current : null));
        setPtoFormulaDraft((current) => (current === "" ? current : ""));
        setPtoInlineEditCell((current) => (current === null ? current : null));
        setPtoInlineEditInitialDraft((current) => (current === "" ? current : ""));
        setPtoSelectionAnchorCell((current) => (current === null ? current : null));
        setPtoSelectedCellKeys((current) => (current.length === 0 ? current : []));
      }
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
    ptoSelectionActive,
    vehicleSelectionAnchorRef,
    vehicleSelectionActive,
    vehicleSelectionDraggingRef,
  ]);
}
