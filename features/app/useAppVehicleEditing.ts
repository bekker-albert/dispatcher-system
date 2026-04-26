"use client";

import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";

import { useAdminVehicleEditMode } from "@/features/admin/vehicles/useAdminVehicleEditMode";
import { useVehicleExcelTransfer } from "@/features/admin/vehicles/useVehicleExcelTransfer";
import { useVehicleInlineGridEditor } from "@/features/admin/vehicles/useVehicleInlineGridEditor";
import { useVehicleRowsEditor } from "@/features/admin/vehicles/useVehicleRowsEditor";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import type { VehicleFilterKey, VehicleFilters, VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type VehicleCell = {
  id: number;
  field: VehicleInlineField;
};

type PendingVehicleFocus = VehicleCell & {
  edit?: boolean;
  selectContents?: boolean;
};

type UseAppVehicleEditingOptions = {
  vehicleRows: VehicleRow[];
  visibleVehicleRows: VehicleRow[];
  vehicleRowsRef: RefObject<VehicleRow[]>;
  vehicleImportInputRef: RefObject<HTMLInputElement | null>;
  vehiclesDatabaseLoadedRef: RefObject<boolean>;
  vehiclesDatabaseSaveSnapshotRef: RefObject<string>;
  databaseConfigured: boolean;
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
  setVehicleFilters: Dispatch<SetStateAction<VehicleFilters>>;
  setVehicleFilterDrafts: Dispatch<SetStateAction<VehicleFilters>>;
  setOpenVehicleFilter: Dispatch<SetStateAction<VehicleFilterKey | null>>;
  setPendingVehicleFocus: Dispatch<SetStateAction<PendingVehicleFocus | null>>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleCell | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  setVehicleCellInitialDraft: Dispatch<SetStateAction<string>>;
  setAdminVehiclesEditing: Dispatch<SetStateAction<boolean>>;
  setShowAllVehicleRows: Dispatch<SetStateAction<boolean>>;
  pushVehicleUndoSnapshot: () => void;
  clearAllVehicleFilters: () => void;
  showSaveStatus: (kind: SaveStatusState["kind"], message: string) => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useAppVehicleEditing({
  vehicleRows,
  visibleVehicleRows,
  vehicleRowsRef,
  vehicleImportInputRef,
  vehiclesDatabaseLoadedRef,
  vehiclesDatabaseSaveSnapshotRef,
  databaseConfigured,
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
  setVehicleFilters,
  setVehicleFilterDrafts,
  setOpenVehicleFilter,
  setPendingVehicleFocus,
  setActiveVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
  setEditingVehicleCell,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  setAdminVehiclesEditing,
  setShowAllVehicleRows,
  pushVehicleUndoSnapshot,
  clearAllVehicleFilters,
  showSaveStatus,
  addAdminLog,
}: UseAppVehicleEditingOptions) {
  const {
    addVehicleRow,
    updateVehicleRow,
    toggleVehicleVisibility,
    deleteVehicle,
  } = useVehicleRowsEditor({
    vehicleRows,
    vehicleRowsRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    setVehicleRows,
    setPendingVehicleFocus,
    pushVehicleUndoSnapshot,
    clearAllVehicleFilters,
    showSaveStatus,
    addAdminLog,
  });

  const {
    commitVehicleInlineCellEdit,
    vehicleCellInputProps,
  } = useVehicleInlineGridEditor({
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
  });

  const {
    startAdminVehiclesEditing,
    finishAdminVehiclesEditing,
  } = useAdminVehicleEditMode({
    editingVehicleCell,
    commitVehicleInlineCellEdit,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    vehicleRowsRef,
  });

  const {
    openVehicleImportFilePicker,
    importVehiclesFromExcel,
    exportVehiclesToExcel,
  } = useVehicleExcelTransfer({
    vehicleRows,
    vehicleImportInputRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    setVehicleRows,
    setVehicleFilters,
    setVehicleFilterDrafts,
    setOpenVehicleFilter,
    pushVehicleUndoSnapshot,
    showSaveStatus,
    addAdminLog,
  });

  return {
    addVehicleRow,
    updateVehicleRow,
    toggleVehicleVisibility,
    deleteVehicle,
    vehicleCellInputProps,
    startAdminVehiclesEditing,
    finishAdminVehiclesEditing,
    openVehicleImportFilePicker,
    importVehiclesFromExcel,
    exportVehiclesToExcel,
  };
}
